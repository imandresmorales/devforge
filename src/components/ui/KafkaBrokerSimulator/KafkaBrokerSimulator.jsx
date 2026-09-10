/**
 * @fileoverview Componente UI para el Simulador de Message Broker y Streaming de Eventos Kafka (Mejora 76).
 *
 * Muestra:
 * - Publicador de eventos (Producer) con particionamiento determinista por clave.
 * - Registro inmutable de confirmación (Commit Log) visualizado por partición con offsets y high watermark.
 * - Gestión de Grupos de Consumidores (Consumer Groups) con rebalanceo en caliente y cálculo de Lag de consumo.
 * - Simulación de procesamiento y confirmación de offsets (Commit Offset) en tiempo real.
 *
 * @module components/ui/KafkaBrokerSimulator/KafkaBrokerSimulator
 */
import { useState, useRef, useEffect } from 'react'
import { KafkaClusterBroker } from '../../../utils/kafkaBroker'
import './KafkaBrokerSimulator.css'

const INITIAL_MESSAGES = [
  { key: 'user:101', val: { event: 'USER_REGISTERED', email: 'alex@devforge.app' } },
  { key: 'user:102', val: { event: 'USER_LOGIN', ip: '192.168.1.1' } },
  { key: 'order:884', val: { event: 'ORDER_CREATED', total: 149.99 } },
  { key: 'user:101', val: { event: 'PROFILE_UPDATED', role: 'ADMIN' } },
  { key: 'order:884', val: { event: 'PAYMENT_CAPTURED', status: 'SUCCESS' } },
]

export default function KafkaBrokerSimulator() {
  const brokerRef = useRef(null)
  if (!brokerRef.current) {
    brokerRef.current = new KafkaClusterBroker()
    const topic = brokerRef.current.createTopic('ecommerce-events', 3)
    INITIAL_MESSAGES.forEach((m) => topic.produce(m.key, m.val))

    brokerRef.current.joinConsumerGroup('billing-service', 'worker-1', 'ecommerce-events')
    brokerRef.current.joinConsumerGroup('billing-service', 'worker-2', 'ecommerce-events')
  }

  const [snapshot, setSnapshot] = useState(() => brokerRef.current.getSnapshot())
  const [producerKey, setProducerKey] = useState('user:101')
  const [producerValue, setProducerValue] = useState('{"event":"CART_CHECKOUT","items":3}')
  const [lastProduced, setLastProduced] = useState(null)
  const [consumedLogs, setConsumedLogs] = useState([])

  const refresh = () => {
    setSnapshot(brokerRef.current.getSnapshot())
  }

  const handleProduce = () => {
    let parsedVal = producerValue
    try {
      parsedVal = JSON.parse(producerValue)
    } catch {
      // Usar string si no es JSON
    }

    const topic = brokerRef.current.getTopic('ecommerce-events')
    const result = topic.produce(producerKey.trim() || null, parsedVal)
    setLastProduced(result)
    refresh()
  }

  const handleAddConsumer = () => {
    const group = snapshot.consumerGroups[0]
    const nextId = `worker-${(group?.members?.length || 0) + 1}`
    brokerRef.current.joinConsumerGroup('billing-service', nextId, 'ecommerce-events')
    refresh()
  }

  const handleRemoveConsumer = (consumerId) => {
    brokerRef.current.leaveConsumerGroup('billing-service', consumerId)
    refresh()
  }

  const handlePollAndCommit = (consumerId) => {
    const batches = brokerRef.current.poll('billing-service', consumerId, 3)
    const logs = []

    batches.forEach((batch) => {
      batch.messages.forEach((msg) => {
        logs.push({
          id: `${batch.partitionId}-${msg.offset}-${Date.now()}`,
          consumerId,
          partitionId: batch.partitionId,
          offset: msg.offset,
          key: msg.key,
          value: msg.value,
          time: new Date(msg.timestamp).toISOString().substring(11, 19),
        })
      })
      // Commit offset
      brokerRef.current.commitOffset('billing-service', 'ecommerce-events', batch.partitionId, batch.lastOffset + 1)
    })

    if (logs.length > 0) {
      setConsumedLogs((prev) => [...logs, ...prev].slice(0, 15))
    }
    refresh()
  }

  const topicData = snapshot.topics.find((t) => t.name === 'ecommerce-events') || snapshot.topics[0]
  const groupData = snapshot.consumerGroups[0]

  return (
    <section className="kafka-simulator" aria-labelledby="kafka-title">
      <div className="kafka-simulator__header">
        <div>
          <span className="badge badge--brand">Streaming de Eventos & Message Brokers</span>
          <h2 id="kafka-title" className="kafka-simulator__title">
            Simulador de Apache Kafka: Commit Log & Consumer Groups
          </h2>
          <p className="kafka-simulator__desc">
            Explora la arquitectura de registro inmutable distribuido. Publica eventos particionados por clave,
            rebalancea consumidores en tiempo real y rastrea el Lag de consumo de offsets.
          </p>
        </div>

        <div className="kafka-quick-stats">
          <div className="kafka-stat-badge">
            <span>Lag Total de Grupo:</span>
            <strong className={groupData?.totalLag > 0 ? 'kafka-lag--warn' : 'kafka-lag--clean'}>
              {groupData?.totalLag || 0} msgs
            </strong>
          </div>
        </div>
      </div>

      <div className="kafka-grid">
        {/* ── Panel 1: Publicador de Eventos (Producer) ── */}
        <div className="kafka-panel">
          <h3 className="kafka-panel-title">📤 Publicador de Mensajes (Kafka Producer)</h3>

          <div className="kafka-field">
            <label>Clave de Particionamiento (Partition Key):</label>
            <div className="kafka-preset-keys">
              {['user:101', 'user:102', 'order:884', 'device:iot_9'].map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`btn-xs ${producerKey === k ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setProducerKey(k)}
                >
                  {k}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={producerKey}
              onChange={(e) => setProducerKey(e.target.value)}
              className="kafka-input"
              placeholder="Clave (o dejar vacío para Round-Robin)"
            />
          </div>

          <div className="kafka-field">
            <label>Carga Útil del Evento (JSON Payload):</label>
            <textarea
              value={producerValue}
              onChange={(e) => setProducerValue(e.target.value)}
              className="kafka-textarea"
              rows={3}
            />
          </div>

          <button type="button" className="btn-primary kafka-produce-btn" onClick={handleProduce}>
            ⚡ Publicar Evento en Tópico
          </button>

          {lastProduced && (
            <div className="kafka-produce-success">
              <span>✅ Evento emitido a <code>{lastProduced.topic}</code></span>
              <span>Partición Asignada: <strong>P-{lastProduced.partition}</strong> | Offset: <code>#{lastProduced.offset}</code></span>
            </div>
          )}
        </div>

        {/* ── Panel 2: Particiones del Tópico (Commit Logs Inmutables) ── */}
        <div className="kafka-panel">
          <h3 className="kafka-panel-title">📚 Tópico: <code>ecommerce-events</code> (Particiones)</h3>

          <div className="kafka-partitions-list">
            {topicData?.partitions.map((part) => {
              const partStat = groupData?.partitionStats.find((s) => s.partitionId === part.id)
              const committed = partStat?.committed || 0
              const lag = partStat?.lag || 0

              return (
                <div key={part.id} className="kafka-partition-card">
                  <div className="kafka-partition-header">
                    <span className="kafka-part-tag">Partición {part.id}</span>
                    <span className="kafka-part-meta">
                      High Watermark: <code>#{part.highWatermark}</code> | Lag: <strong className={lag > 0 ? 'kafka-lag--warn' : ''}>{lag}</strong>
                    </span>
                  </div>

                  <div className="kafka-offsets-stream">
                    {part.messages.length === 0 ? (
                      <span className="kafka-empty-hint">Sin mensajes en log</span>
                    ) : (
                      part.messages.map((m) => {
                        const isCommitted = m.offset < committed
                        return (
                          <div
                            key={m.offset}
                            className={`kafka-offset-box ${isCommitted ? 'kafka-offset-box--committed' : 'kafka-offset-box--uncommitted'}`}
                            title={`Clave: ${m.key || 'null'} | Valor: ${JSON.stringify(m.value)}`}
                          >
                            <span className="kafka-offset-num">#{m.offset}</span>
                            <span className="kafka-offset-key">{m.key || 'null'}</span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Sección de Consumer Groups & Rebalanceo ── */}
      <div className="kafka-consumers-section">
        <div className="kafka-panel-header">
          <div>
            <h3 className="kafka-panel-title">👥 Consumer Group: <code>billing-service</code></h3>
            <p className="kafka-panel-desc">
              Cada partición es consumida por exactamente un trabajador dentro del grupo para procesamiento paralelo ordenado.
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={handleAddConsumer}>
            ➕ Añadir Consumidor (Rebalancear)
          </button>
        </div>

        <div className="kafka-consumers-grid">
          {groupData?.members.map((cId) => {
            const assignedPartitions = groupData.assignments[cId] || []

            return (
              <div key={cId} className="kafka-consumer-card">
                <div className="kafka-consumer-header">
                  <div>
                    <span className="kafka-consumer-icon">⚙️</span>
                    <strong>{cId}</strong>
                  </div>
                  {groupData.members.length > 1 && (
                    <button
                      type="button"
                      className="btn-xs btn-danger"
                      onClick={() => handleRemoveConsumer(cId)}
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="kafka-assigned-parts">
                  <span className="kafka-meta-label">Particiones Asignadas:</span>
                  <div className="kafka-badges-row">
                    {assignedPartitions.length === 0 ? (
                      <span className="badge badge--neutral">Inactivo (Idle)</span>
                    ) : (
                      assignedPartitions.map((pId) => (
                        <span key={pId} className="badge badge--brand">
                          Partición {pId}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary btn-sm kafka-poll-btn"
                  onClick={() => handlePollAndCommit(cId)}
                  disabled={assignedPartitions.length === 0}
                >
                  📥 Poll & Commit Offsets
                </button>
              </div>
            )
          })}
        </div>

        {/* Registro de Eventos Consumidos */}
        {consumedLogs.length > 0 && (
          <div className="kafka-consumed-feed">
            <span className="kafka-meta-label">📥 Registro de Eventos Procesados en Tiempo Real:</span>
            <div className="kafka-logs-list">
              {consumedLogs.map((log) => (
                <div key={log.id} className="kafka-log-row">
                  <span className="kafka-log-time">[{log.time}]</span>
                  <span className="badge badge--neutral">{log.consumerId}</span>
                  <span>P-{log.partitionId} @ offset #{log.offset}</span>
                  <strong>{log.key}:</strong>
                  <code>{JSON.stringify(log.value)}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
