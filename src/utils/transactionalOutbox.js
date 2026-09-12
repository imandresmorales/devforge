/**
 * @fileoverview Simulador del Patrón Outbox Transaccional y Sincronización Event-Driven.
 *
 * Resuelve el problema fundamental de "Dual-Write" en arquitecturas de microservicios:
 * - Escritura atómica ACID: Entidad de Dominio (ej. Pedido) + Evento de Outbox en la misma transacción SQL.
 * - Change Data Capture (CDC) / Polling Publisher Relay: Publicación garantizada hacia el Broker de Eventos (Kafka/RabbitMQ).
 * - Garantía de Entrega At-Least-Once con Deduplicación Idempotente en los consumidores.
 * - Simulación comparativa: Patrón Outbox vs Dual-Write directo vulnerable.
 *
 * @module utils/transactionalOutbox
 */

export const OUTBOX_STATUS = {
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
}

/**
 * Base de Datos Relacional y Broker simulados para el Patrón Outbox.
 */
export class TransactionalOutboxEngine {
  constructor() {
    /** @type {Map<string, Object>} id -> Order */
    this.ordersTable = new Map()

    /** @type {Array<Object>} Lista de eventos en outbox_events */
    this.outboxTable = []

    /** @type {Array<Object>} Mensajes recibidos en el Message Broker (Kafka) */
    this.brokerEvents = []

    /** @type {Set<string>} Registro de IDs procesados para consumo idempotente */
    this.consumerProcessedIds = new Set()

    /** Historial de auditoría y métricas */
    this.stats = {
      transactionsCommitted: 0,
      transactionsRolledBack: 0,
      eventsPublished: 0,
      inconsistenciesPrevented: 0,
    }

    /** Estado del Broker (para simular caídas de red) */
    this.isBrokerHealthy = true
  }

  /**
   * Ejecuta una transacción atómica para crear un pedido y registrar su evento Outbox.
   *
   * @param {Object} orderData - Datos del pedido { id, customer, amount, items }
   * @param {Object} [options]
   * @param {boolean} [options.simulateDbCrash=false] - Forzar fallo en BD para probar rollback.
   * @returns {{ success: boolean, order?: Object, outboxEvent?: Object, error?: string }}
   */
  createOrderTransaction(orderData, options = {}) {
    const { simulateDbCrash = false } = options

    if (simulateDbCrash) {
      this.stats.transactionsRolledBack++
      return {
        success: false,
        error: 'SQL Rollback: Error de base de datos relacional (Constraint / Connection Loss). No se escribió pedido ni outbox.',
      }
    }

    const orderId = orderData.id || `ord_${Date.now()}`
    const newOrder = {
      id: orderId,
      customer: orderData.customer || 'Cliente Anónimo',
      amount: orderData.amount || 99.99,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    }

    const outboxEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      aggregateType: 'ORDER',
      aggregateId: orderId,
      eventType: 'ORDER_CREATED',
      payload: { ...newOrder },
      status: OUTBOX_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      publishedAt: null,
      retryCount: 0,
    }

    // Escritura ATÓMICA en la misma transacción de base de datos
    this.ordersTable.set(orderId, newOrder)
    this.outboxTable.push(outboxEvent)
    this.stats.transactionsCommitted++

    return {
      success: true,
      order: newOrder,
      outboxEvent,
    }
  }

  /**
   * Simula el proceso CDC / Polling Publisher Relay que barre outbox_events pendientes.
   *
   * @returns {{ publishedCount: number, failedCount: number, errors: string[] }}
   */
  processPendingOutbox() {
    let publishedCount = 0
    let failedCount = 0
    const errors = []

    const pendingEvents = this.outboxTable.filter((e) => e.status === OUTBOX_STATUS.PENDING)

    pendingEvents.forEach((event) => {
      if (!this.isBrokerHealthy) {
        event.retryCount++
        failedCount++
        errors.push(`Broker Kafka no disponible para evento ${event.id}. Permanece en Outbox para reintento automático.`)
        this.stats.inconsistenciesPrevented++
        return
      }

      // Publicar al Broker
      this.brokerEvents.push({
        messageId: event.id,
        topic: 'orders.events',
        timestamp: new Date().toISOString(),
        payload: event.payload,
      })

      // Actualizar estado en la tabla Outbox
      event.status = OUTBOX_STATUS.PUBLISHED
      event.publishedAt = new Date().toISOString()
      publishedCount++
      this.stats.eventsPublished++
    })

    return {
      publishedCount,
      failedCount,
      errors,
    }
  }

  /**
   * Simula un consumidor del Broker aplicando el patrón Idempotent Consumer.
   *
   * @param {string} messageId - ID del mensaje.
   * @returns {{ status: 'PROCESSED' | 'DUPLICATE_IGNORED', messageId: string }}
   */
  consumeEvent(messageId) {
    if (this.consumerProcessedIds.has(messageId)) {
      return { status: 'DUPLICATE_IGNORED', messageId }
    }

    this.consumerProcessedIds.add(messageId)
    return { status: 'PROCESSED', messageId }
  }

  /**
   * Simula la alternativa errónea: "Dual-Write" sin Outbox (escribir en BD y luego invocar Broker directamente).
   * Muestra cómo una caída del broker tras escribir en BD genera inconsistencia de datos.
   *
   * @param {Object} orderData - Datos del pedido.
   * @param {boolean} [brokerFails=false] - Forzar fallo en llamada al broker.
   * @returns {{ success: boolean, dbSaved: boolean, brokerSent: boolean, isInconsistent: boolean }}
   */
  simulateDualWrite(orderData, brokerFails = false) {
    const orderId = `dw_ord_${Date.now()}`
    const order = { id: orderId, ...orderData, status: 'CONFIRMED' }

    // Paso 1: Guarda en BD
    this.ordersTable.set(orderId, order)
    const dbSaved = true

    // Paso 2: Intenta enviar al Broker
    let brokerSent = false
    let isInconsistent = false

    if (brokerFails || !this.isBrokerHealthy) {
      brokerSent = false
      isInconsistent = true // Inconsistencia: Guardado en BD pero downstream nunca se enteró
    } else {
      this.brokerEvents.push({
        messageId: `dw_evt_${orderId}`,
        topic: 'orders.events',
        timestamp: new Date().toISOString(),
        payload: order,
      })
      brokerSent = true
    }

    return {
      success: !isInconsistent,
      dbSaved,
      brokerSent,
      isInconsistent,
    }
  }

  /**
   * Configura la salud del broker de eventos.
   * @param {boolean} healthy
   */
  setBrokerHealth(healthy) {
    this.isBrokerHealthy = healthy
  }

  /**
   * Retorna una instantánea del estado de las tablas y métricas.
   */
  getStateSnapshot() {
    return {
      orders: Array.from(this.ordersTable.values()),
      outboxEvents: [...this.outboxTable],
      brokerEvents: [...this.brokerEvents],
      stats: { ...this.stats },
      isBrokerHealthy: this.isBrokerHealthy,
    }
  }

  /**
   * Limpia y reinicia la base de datos y broker simulados.
   */
  reset() {
    this.ordersTable.clear()
    this.outboxTable = []
    this.brokerEvents = []
    this.consumerProcessedIds.clear()
    this.stats = {
      transactionsCommitted: 0,
      transactionsRolledBack: 0,
      eventsPublished: 0,
      inconsistenciesPrevented: 0,
    }
    this.isBrokerHealthy = true
  }
}
