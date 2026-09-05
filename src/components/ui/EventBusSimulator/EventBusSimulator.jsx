/**
 * @fileoverview Componente EventBusSimulator — Simulador de Event Bus y Arquitectura Pub/Sub (Mejora 59).
 *
 * CARACTERÍSTICAS:
 * - Publicador interactivo de eventos con tópicos jerárquicos (order.created, payment.processed).
 * - Control de idempotencia con detección en vivo de claves duplicadas.
 * - Topología visual de microservicios suscriptores con switches para simular fallos de consumo.
 * - Dead Letter Queue (DLQ) en tiempo real con visor de excepciones y botón "Replay Event".
 * - Tablero de métricas de entrega, reintentos y deduplicación.
 *
 * @module components/ui/EventBusSimulator
 */
import { useState, useRef, useEffect } from 'react'
import { DistributedEventBus } from '../../../utils/eventBus'
import { useToast } from '../../../context/ToastContext'
import './EventBusSimulator.css'

const EVENT_PRESETS = [
  {
    label: 'Pedido Creado',
    topic: 'order.created',
    payload: '{\n  "orderId": "ord_8841",\n  "customerId": "usr_99",\n  "amount": 149.99,\n  "items": ["MacBook Cover", "USB-C Cable"]\n}',
    idempotencyKey: 'idem_ord_8841_v1',
  },
  {
    label: 'Pago Aprobado',
    topic: 'order.paid',
    payload: '{\n  "orderId": "ord_8841",\n  "paymentId": "pay_stripe_5521",\n  "status": "CAPTURED"\n}',
    idempotencyKey: 'idem_pay_5521',
  },
  {
    label: 'Usuario Registrado',
    topic: 'user.created',
    payload: '{\n  "userId": "usr_7701",\n  "email": "alex@devforge.io",\n  "role": "developer"\n}',
    idempotencyKey: 'idem_usr_7701',
  },
]

function EventBusSimulator() {
  const { addToast } = useToast()
  const busRef = useRef(new DistributedEventBus({ maxRetries: 3 }))

  const [topic, setTopic] = useState('order.created')
  const [payloadText, setPayloadText] = useState(EVENT_PRESETS[0].payload)
  const [idempotencyKey, setIdempotencyKey] = useState(EVENT_PRESETS[0].idempotencyKey)
  const [stats, setStats] = useState(busRef.current.getStats())

  const syncState = () => {
    setStats(busRef.current.getStats())
  }

  useEffect(() => {
    syncState()
  }, [])

  const handlePublish = (e) => {
    e?.preventDefault()
    if (!topic.trim()) return

    let parsedPayload = payloadText
    try {
      parsedPayload = JSON.parse(payloadText)
    } catch {
      parsedPayload = { raw: payloadText }
    }

    const res = busRef.current.publish(topic.trim(), parsedPayload, {
      idempotencyKey: idempotencyKey.trim() || undefined,
    })

    if (res.status === 'DELIVERED') {
      addToast({
        type: 'success',
        title: 'Evento Publicado',
        message: `Despachado a ${res.matchedSubscribers.length} microservicios suscriptores.`,
      })
    } else if (res.status === 'DUPLICATE_IGNORED') {
      addToast({
        type: 'warning',
        title: 'Duplicado Ignorado (Idempotencia)',
        message: `La clave "${idempotencyKey}" ya fue procesada previamente.`,
      })
    } else if (res.status === 'PARTIAL_FAILURE') {
      addToast({
        type: 'danger',
        title: 'Fallo en Suscriptor -> Enviado a DLQ',
        message: `${res.dlqEntries.length} microservicio(s) fallaron y el evento fue aislado en la Dead Letter Queue.`,
      })
    }

    syncState()
  }

  const handleToggleSubscriberFail = (subId, currentFail) => {
    busRef.current.setSubscriberFailing(subId, !currentFail)
    syncState()
    addToast({
      type: currentFail ? 'success' : 'warning',
      title: 'Estado de Suscriptor Modificado',
      message: `Suscriptor ${subId} ahora está ${currentFail ? 'OPERATIVO (200 OK)' : 'FALLANDO (Simula DLQ)'}.`,
    })
  }

  const handleReplayDLQ = (dlqId) => {
    const ok = busRef.current.replayDLQEvent(dlqId)
    if (ok) {
      addToast({
        type: 'success',
        title: 'Evento Reintentado (DLQ Replay)',
        message: 'El evento fue re-publicado exitosamente en el bus.',
      })
    }
    syncState()
  }

  const handleClearDLQ = () => {
    busRef.current.clearDLQ()
    syncState()
    addToast({
      type: 'info',
      title: 'DLQ Vaciada',
      message: 'Todos los mensajes aislados en la Dead Letter Queue fueron eliminados.',
    })
  }

  const handleLoadPreset = (preset) => {
    setTopic(preset.topic)
    setPayloadText(preset.payload)
    setIdempotencyKey(preset.idempotencyKey)
    addToast({
      type: 'info',
      title: 'Preset Cargado',
      message: `Ejemplo "${preset.label}" listo para publicar.`,
    })
  }

  const handleReset = () => {
    busRef.current.reset()
    syncState()
    addToast({
      type: 'info',
      title: 'Event Bus Reiniciado',
      message: 'Contadores y logs restaurados a cero.',
    })
  }

  return (
    <section className="event-bus-section" aria-label="Simulador de Event Bus y Arquitectura Pub/Sub">
      {/* ── Encabezado ── */}
      <div className="event-bus-header">
        <div>
          <div className="eb-badge-wrapper">
            <span className="badge badge--brand">📡 Event-Driven Architecture (EDA)</span>
            <span className="badge badge--success">Pub/Sub & Dead Letter Queue</span>
          </div>
          <h2 className="event-bus-title">
            Simulador de Event Bus, Pub/Sub & Dead Letter Queue (DLQ)
          </h2>
          <p className="event-bus-subtitle">
            Simula el desacoplamiento de microservicios con enrutamiento por tópicos comodín (* y #), mitigación de fallos con Dead Letter Queue y deduplicación por claves de idempotencia.
          </p>
        </div>

        {/* Presets */}
        <div className="eb-header-actions">
          {EVENT_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="btn-secondary eb-btn-preset"
              onClick={() => handleLoadPreset(p)}
            >
              ⚡ {p.label}
            </button>
          ))}
          <button
            type="button"
            className="btn-danger eb-btn-reset"
            onClick={handleReset}
          >
            🧹 Reiniciar
          </button>
        </div>
      </div>

      {/* ── KPIs y Métricas ── */}
      <div className="eb-kpi-grid">
        <div className="eb-kpi-card eb-kpi-card--brand">
          <span className="eb-kpi-label">Eventos Publicados</span>
          <span className="eb-kpi-val">{stats.totalPublished}</span>
          <span className="eb-kpi-sub">Mensajes despachados</span>
        </div>

        <div className="eb-kpi-card">
          <span className="eb-kpi-label">Entregas Exitosas</span>
          <span className="eb-kpi-val text-success">{stats.totalDelivered}</span>
          <span className="eb-kpi-sub">Consumidos sin errores</span>
        </div>

        <div className="eb-kpi-card">
          <span className="eb-kpi-label">En Dead Letter Queue (DLQ)</span>
          <span className="eb-kpi-val text-danger">{stats.dlqCount}</span>
          <span className="eb-kpi-sub">Aislados por fallo</span>
        </div>

        <div className="eb-kpi-card">
          <span className="eb-kpi-label">Duplicados Bloqueados</span>
          <span className="eb-kpi-val text-warning">{stats.duplicatesIgnored}</span>
          <span className="eb-kpi-sub">Protección Idempotente</span>
        </div>
      </div>

      {/* ── Publicador y Topología de Microservicios ── */}
      <div className="eb-main-grid">
        {/* Formulario Publicador */}
        <div className="eb-card">
          <h3 className="eb-card-title">📢 Publicador de Eventos (Event Producer)</h3>
          <form onSubmit={handlePublish} className="eb-publish-form">
            <div className="eb-form-group">
              <label htmlFor="eb-topic-input" className="eb-label">Tópico del Evento (Routing Key):</label>
              <input
                id="eb-topic-input"
                type="text"
                className="eb-input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="ej. order.created"
                required
              />
            </div>

            <div className="eb-form-group">
              <label htmlFor="eb-idempotency-input" className="eb-label">Clave de Idempotencia (Opcional):</label>
              <input
                id="eb-idempotency-input"
                type="text"
                className="eb-input"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                placeholder="ej. idem_ord_990_v1"
              />
            </div>

            <div className="eb-form-group">
              <label htmlFor="eb-payload-input" className="eb-label">Payload del Mensaje (JSON):</label>
              <textarea
                id="eb-payload-input"
                className="eb-textarea"
                rows={5}
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary eb-btn-publish">
              🚀 Publicar en el Event Bus
            </button>
          </form>
        </div>

        {/* Microservicios Suscriptores */}
        <div className="eb-card">
          <h3 className="eb-card-title">🎧 Microservicios Suscriptores (Consumers)</h3>
          <div className="eb-subscribers-list">
            {stats.activeSubscribers.map((sub) => (
              <div
                key={sub.id}
                className={`eb-subscriber-item ${sub.shouldFail ? 'eb-subscriber-item--failing' : ''}`}
              >
                <div className="eb-sub-top">
                  <div>
                    <h4 className="eb-sub-name">{sub.serviceName}</h4>
                    <span className="eb-sub-pattern">Tópico suscrito: <code>{sub.topicPattern}</code></span>
                  </div>
                  <button
                    type="button"
                    className={`eb-sub-toggle ${sub.shouldFail ? 'eb-sub-toggle--fail' : 'eb-sub-toggle--ok'}`}
                    onClick={() => handleToggleSubscriberFail(sub.id, sub.shouldFail)}
                    title={sub.shouldFail ? 'Restaurar servicio' : 'Simular excepción para enviar a DLQ'}
                  >
                    {sub.shouldFail ? '🔴 FALLANDO (DLQ)' : '🟢 OPERATIVO'}
                  </button>
                </div>

                <div className="eb-sub-meta">
                  <span>Eventos recibidos: <strong>{sub.receivedCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Dead Letter Queue (DLQ) Inspector ── */}
      <div className="eb-dlq-card">
        <div className="eb-dlq-header">
          <div className="eb-dlq-title-box">
            <h3 className="eb-dlq-title">💀 Dead Letter Queue ({stats.dlqCount} Mensajes Aislados)</h3>
            <span className="eb-dlq-desc">Eventos que agotaron 3 reintentos y fueron resguardados para evitar pérdida de datos.</span>
          </div>
          {stats.dlqCount > 0 && (
            <button
              type="button"
              className="btn-danger eb-btn-clear-dlq"
              onClick={handleClearDLQ}
            >
              Vaciar DLQ
            </button>
          )}
        </div>

        {stats.dlq.length > 0 ? (
          <div className="eb-dlq-list">
            {stats.dlq.map((dlqItem) => (
              <div key={dlqItem.dlqId} className="eb-dlq-item">
                <div className="eb-dlq-item-top">
                  <div>
                    <span className="badge badge--danger">DLQ</span>
                    <strong>Tópico: {dlqItem.topic}</strong> → <em>{dlqItem.targetService}</em>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary eb-btn-replay"
                    onClick={() => handleReplayDLQ(dlqItem.dlqId)}
                  >
                    🔄 Replay Event
                  </button>
                </div>

                <p className="eb-dlq-reason">⚠️ {dlqItem.errorReason}</p>

                <div className="eb-dlq-payload-box">
                  <code>{JSON.stringify(dlqItem.payload, null, 2)}</code>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="eb-dlq-empty">
            <span>🛡️ La Dead Letter Queue está vacía. Todos los eventos han sido procesados correctamente.</span>
          </div>
        )}
      </div>

      {/* ── Timeline de Eventos Recientes ── */}
      {stats.logs.length > 0 && (
        <div className="eb-logs-card">
          <h3 className="eb-logs-title">📋 Registro en Vivo del Bus de Mensajería</h3>
          <div className="eb-logs-list">
            {stats.logs.slice(0, 6).map((log) => (
              <div key={log.id} className="eb-log-item">
                <div className="eb-log-meta">
                  <span className="eb-log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`badge badge--${log.status === 'DELIVERED' ? 'success' : log.status === 'DUPLICATE_IGNORED' ? 'warning' : 'danger'}`}>
                    {log.status}
                  </span>
                  <strong>{log.topic}</strong>
                  {log.idempotencyKey && <code className="eb-log-idem">key: {log.idempotencyKey}</code>}
                </div>
                {log.subscribersMatched && (
                  <span className="eb-log-subs">
                    Entregado a: {log.subscribersMatched.join(', ') || 'Ningún suscriptor'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default EventBusSimulator
