/**
 * @fileoverview Simulador de Event Bus y Arquitectura Dirigida por Eventos (EDA) (Mejora 59).
 *
 * CARACTERÍSTICAS:
 * - Enrutamiento Pub/Sub con soporte para tópicos exactos y patrones comodín (Wildcards: "order.*", "payment.#").
 * - Dead Letter Queue (DLQ): Aislamiento y reintento de eventos fallidos o poison pills tras superar umbral de reintentos.
 * - Deduplicación e Idempotencia: Control mediante "idempotencyKey" para evitar doble procesamiento (ej. cobros duplicados).
 * - Simulación de microservicios suscriptores (InventoryService, BillingService, NotificationService, AnalyticsService).
 * - Replay de eventos desde la Dead Letter Queue para tolerancia a fallos.
 *
 * @module utils/eventBus
 */

/**
 * Convierte un patrón de tópico con wildcards de RabbitMQ/Kafka a una RegExp.
 * "order.*" -> coincide con "order.created", "order.canceled"
 * "billing.#" -> coincide con "billing.invoice.generated", "billing.paid"
 *
 * @param {string} pattern
 * @returns {RegExp}
 */
export function topicPatternToRegex(pattern) {
  const escaped = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '[^.]+')
    .replace(/#/g, '.*')
  return new RegExp(`^${escaped}$`)
}

/**
 * Microservicios predefinidos con sus tópicos de interés.
 */
export const DEFAULT_SUBSCRIBERS = [
  { id: 'sub-billing', serviceName: 'BillingService', topicPattern: 'order.*', shouldFail: false },
  { id: 'sub-inventory', serviceName: 'InventoryService', topicPattern: 'order.created', shouldFail: false },
  { id: 'sub-notification', serviceName: 'NotificationService', topicPattern: '*.created', shouldFail: false },
  { id: 'sub-analytics', serviceName: 'AnalyticsService', topicPattern: '#', shouldFail: false },
]

/**
 * Clase que simula un broker de eventos distribuido.
 */
export class DistributedEventBus {
  /**
   * @param {Object} options
   * @param {number} [options.maxRetries=3]
   */
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3
    this.subscribers = new Map() // subId -> subscriber object
    this.deadLetterQueue = []
    this.eventLogs = []
    this.processedIdempotencyKeys = new Set()
    this.metrics = {
      totalPublished: 0,
      totalDelivered: 0,
      totalRetries: 0,
      totalDLQ: 0,
      duplicatesIgnored: 0,
    }

    // Registrar suscriptores iniciales
    DEFAULT_SUBSCRIBERS.forEach((sub) => {
      this.subscribe(sub.id, sub.serviceName, sub.topicPattern, sub.shouldFail)
    })
  }

  /**
   * Registra un nuevo suscriptor en el bus.
   *
   * @param {string} id
   * @param {string} serviceName
   * @param {string} topicPattern
   * @param {boolean} [shouldFail=false]
   */
  subscribe(id, serviceName, topicPattern, shouldFail = false) {
    const regex = topicPatternToRegex(topicPattern)
    this.subscribers.set(id, {
      id,
      serviceName,
      topicPattern,
      regex,
      shouldFail,
      receivedCount: 0,
    })
  }

  /**
   * Elimina un suscriptor.
   *
   * @param {string} id
   */
  unsubscribe(id) {
    this.subscribers.delete(id)
  }

  /**
   * Alterna el estado de fallo intencional de un microservicio para pruebas de DLQ.
   *
   * @param {string} id
   * @param {boolean} shouldFail
   */
  setSubscriberFailing(id, shouldFail) {
    const sub = this.subscribers.get(id)
    if (sub) {
      sub.shouldFail = shouldFail
    }
  }

  /**
   * Publica un evento en el Event Bus.
   *
   * @param {string} topic - Tópico (ej. "order.created").
   * @param {Object|string} payload - Contenido del mensaje.
   * @param {Object} [options={}]
   * @param {string} [options.idempotencyKey] - Clave para evitar duplicados.
   * @returns {{ status: 'DELIVERED'|'DUPLICATE_IGNORED'|'NO_SUBSCRIBERS', eventId: string, matchedSubscribers: string[], dlqEntries: Object[] }}
   */
  publish(topic, payload, options = {}) {
    if (!topic || typeof topic !== 'string') {
      throw new Error('El tópico del evento debe ser una cadena no vacía.')
    }

    const { idempotencyKey } = options

    // ── 1. Control de Idempotencia ──
    if (idempotencyKey) {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) {
        this.metrics.duplicatesIgnored++
        const dupLog = {
          id: `evt_dup_${Date.now()}`,
          topic,
          idempotencyKey,
          status: 'DUPLICATE_IGNORED',
          message: `Evento ignorado: Clave de idempotencia "${idempotencyKey}" ya fue procesada con anterioridad.`,
          timestamp: Date.now(),
        }
        this.eventLogs.unshift(dupLog)
        return { status: 'DUPLICATE_IGNORED', eventId: dupLog.id, matchedSubscribers: [], dlqEntries: [] }
      }
      this.processedIdempotencyKeys.add(idempotencyKey)
    }

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    const traceId = `trc_${Math.random().toString(36).substr(2, 8)}`
    const now = Date.now()

    this.metrics.totalPublished++

    // ── 2. Encontrar suscriptores coincidentes ──
    const matched = []
    for (const sub of this.subscribers.values()) {
      if (sub.regex.test(topic)) {
        matched.push(sub)
      }
    }

    const dlqEntries = []

    // ── 3. Despachar a cada microservicio ──
    matched.forEach((sub) => {
      sub.receivedCount++

      if (sub.shouldFail) {
        // Simular reintentos con backoff
        this.metrics.totalRetries += this.maxRetries
        this.metrics.totalDLQ++

        const dlqEntry = {
          dlqId: `dlq_${Date.now()}_${sub.id}`,
          eventId,
          traceId,
          topic,
          payload,
          targetService: sub.serviceName,
          subscriberId: sub.id,
          idempotencyKey: idempotencyKey || null,
          attempts: this.maxRetries,
          errorReason: `Excepción simulada en ${sub.serviceName}: Servicio no disponible tras ${this.maxRetries} reintentos.`,
          failedAt: now,
        }

        this.deadLetterQueue.unshift(dlqEntry)
        dlqEntries.push(dlqEntry)
      } else {
        this.metrics.totalDelivered++
      }
    })

    const logEntry = {
      id: eventId,
      traceId,
      topic,
      payload,
      idempotencyKey: idempotencyKey || null,
      subscribersMatched: matched.map((s) => s.serviceName),
      failedCount: dlqEntries.length,
      successCount: matched.length - dlqEntries.length,
      status: dlqEntries.length > 0 ? 'PARTIAL_FAILURE' : matched.length > 0 ? 'DELIVERED' : 'NO_SUBSCRIBERS',
      timestamp: now,
    }

    this.eventLogs.unshift(logEntry)
    if (this.eventLogs.length > 30) {
      this.eventLogs.pop()
    }

    return {
      status: logEntry.status,
      eventId,
      matchedSubscribers: matched.map((s) => s.serviceName),
      dlqEntries,
    }
  }

  /**
   * Reenvía un evento desde la Dead Letter Queue tras resolver el fallo del suscriptor.
   *
   * @param {string} dlqId
   * @returns {boolean}
   */
  replayDLQEvent(dlqId) {
    const idx = this.deadLetterQueue.findIndex((d) => d.dlqId === dlqId)
    if (idx === -1) return false

    const dlqItem = this.deadLetterQueue[idx]
    this.deadLetterQueue.splice(idx, 1)

    // Re-publicar sin clave de idempotencia duplicada para forzar re-entrega
    this.publish(dlqItem.topic, dlqItem.payload, {
      idempotencyKey: `replay_${Date.now()}`,
    })

    return true
  }

  /**
   * Vacía la Dead Letter Queue.
   */
  clearDLQ() {
    this.deadLetterQueue = []
  }

  /**
   * Retorna estadísticas calculadas y estado de microservicios.
   *
   * @returns {Object}
   */
  getStats() {
    return {
      ...this.metrics,
      dlqCount: this.deadLetterQueue.length,
      activeSubscribers: Array.from(this.subscribers.values()),
      logs: this.eventLogs,
      dlq: this.deadLetterQueue,
    }
  }

  /**
   * Reinicia todos los estados y contadores.
   */
  reset() {
    this.deadLetterQueue = []
    this.eventLogs = []
    this.processedIdempotencyKeys.clear()
    this.metrics = {
      totalPublished: 0,
      totalDelivered: 0,
      totalRetries: 0,
      totalDLQ: 0,
      duplicatesIgnored: 0,
    }
    for (const sub of this.subscribers.values()) {
      sub.receivedCount = 0
      sub.shouldFail = false
    }
  }
}
