/**
 * @fileoverview Componente UI para el Simulador del Patrón Outbox Transaccional (Mejora 82).
 *
 * Muestra:
 * - Demostración de resolución del problema de "Dual-Write".
 * - Tablas SQL en tiempo real: `orders` vs `outbox_events` (ACID Transactional Scope).
 * - Relé de Publicación CDC (Change Data Capture) enviando eventos hacia el Broker Kafka.
 * - Toggle para simular caída y recuperación del Broker Kafka.
 * - Consumo Idempotente con deduplicación de mensajes.
 *
 * @module components/ui/TransactionalOutboxSimulator/TransactionalOutboxSimulator
 */
import { useState, useRef } from 'react'
import { TransactionalOutboxEngine, OUTBOX_STATUS } from '../../../utils/transactionalOutbox'
import './TransactionalOutboxSimulator.css'

const PRESET_CUSTOMERS = [
  { name: 'Elena Rostova', amount: 145.00 },
  { name: 'Mateo Morales', amount: 89.90 },
  { name: 'Sofia Chen', amount: 320.50 },
  { name: 'David Beckham', amount: 550.00 },
]

export default function TransactionalOutboxSimulator() {
  const engineRef = useRef(null)
  if (!engineRef.current) {
    engineRef.current = new TransactionalOutboxEngine()
    // Precargar 2 pedidos
    engineRef.current.createOrderTransaction({ customer: 'Elena Rostova', amount: 145.00 })
    engineRef.current.createOrderTransaction({ customer: 'Mateo Morales', amount: 89.90 })
  }

  const [customerIdx, setCustomerIdx] = useState(0)
  const [activeTab, setActiveTab] = useState('outbox') // 'outbox' | 'dual_write'
  const [dualWriteLogs, setDualWriteLogs] = useState([])
  const [, setTick] = useState(0)

  const snapshot = engineRef.current.getStateSnapshot()
  const currentCustomer = PRESET_CUSTOMERS[customerIdx]

  const handleCreateOrder = (forceRollback = false) => {
    engineRef.current.createOrderTransaction(
      { customer: currentCustomer.name, amount: currentCustomer.amount },
      { simulateDbCrash: forceRollback }
    )
    setCustomerIdx((prev) => (prev + 1) % PRESET_CUSTOMERS.length)
    setTick((t) => t + 1)
  }

  const handleRunRelay = () => {
    engineRef.current.processPendingOutbox()
    setTick((t) => t + 1)
  }

  const handleToggleBroker = () => {
    engineRef.current.setBrokerHealth(!snapshot.isBrokerHealthy)
    setTick((t) => t + 1)
  }

  const handleDualWriteDemo = (brokerFails = false) => {
    const res = engineRef.current.simulateDualWrite(
      { customer: currentCustomer.name, amount: currentCustomer.amount },
      brokerFails
    )
    setDualWriteLogs((prev) => [
      {
        id: Date.now(),
        customer: currentCustomer.name,
        amount: currentCustomer.amount,
        ...res,
      },
      ...prev,
    ])
    setCustomerIdx((prev) => (prev + 1) % PRESET_CUSTOMERS.length)
    setTick((t) => t + 1)
  }

  const handleReset = () => {
    engineRef.current.reset()
    setDualWriteLogs([])
    setTick((t) => t + 1)
  }

  const pendingCount = snapshot.outboxEvents.filter((e) => e.status === OUTBOX_STATUS.PENDING).length

  return (
    <section className="transactional-outbox-simulator" aria-labelledby="tos-title">
      {/* ── Header ── */}
      <div className="tos-header">
        <div>
          <span className="badge badge--brand">Consistencia Transaccional & Event-Driven</span>
          <h2 id="tos-title" className="tos-title">
            Simulador del Patrón Outbox Transaccional & CDC Relay
          </h2>
          <p className="tos-desc">
            Resuelve el problema de <strong>Dual-Write</strong> en microservicios garantizando que los cambios en la base
            de datos relacional y los eventos enviados al broker (Kafka) ocurran de forma consistente sin pérdida ni desincronización.
          </p>
        </div>

        {/* Métricas */}
        <div className="tos-stats-box">
          <div className="tos-stat">
            <span>Transacciones SQL:</span>
            <strong>{snapshot.stats.transactionsCommitted}</strong>
          </div>
          <div className="tos-stat">
            <span>Eventos Publicados:</span>
            <strong style={{ color: '#4ade80' }}>{snapshot.stats.eventsPublished}</strong>
          </div>
          <div className="tos-stat">
            <span>Inconsistencias Evitadas:</span>
            <strong style={{ color: 'var(--color-brand-500)' }}>{snapshot.stats.inconsistenciesPrevented}</strong>
          </div>
        </div>
      </div>

      {/* ── Selector de Modo ── */}
      <div className="tos-tabs">
        <button
          type="button"
          className={`tos-tab-btn ${activeTab === 'outbox' ? 'tos-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('outbox')}
        >
          🛡️ Patrón Outbox Transaccional (Recomendado / Seguro)
        </button>
        <button
          type="button"
          className={`tos-tab-btn ${activeTab === 'dual_write' ? 'tos-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('dual_write')}
        >
          ⚠️ Dual-Write Clásico (Vulnerable a Inconsistencias)
        </button>
      </div>

      {/* ── Panel de Control y Acciones ── */}
      <div className="tos-action-bar">
        <div className="tos-customer-preview">
          <span>Próximo Pedido:</span>
          <strong>{currentCustomer.name}</strong> (${currentCustomer.amount.toFixed(2)})
        </div>

        <div className="tos-btn-group">
          {activeTab === 'outbox' ? (
            <>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleCreateOrder(false)}
              >
                💾 1. Crear Pedido (Transacción ACID)
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleCreateOrder(true)}
                title="Simular fallo en base de datos para probar atomicidad"
              >
                💥 Forzar Error SQL (Rollback)
              </button>
              <button
                type="button"
                className={`btn-xs ${snapshot.isBrokerHealthy ? 'btn-danger' : 'btn-success'}`}
                onClick={handleToggleBroker}
              >
                {snapshot.isBrokerHealthy ? '🔴 Caída de Broker Kafka' : '🟢 Restaurar Broker Kafka'}
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#8b5cf6' }}
                onClick={handleRunRelay}
                disabled={pendingCount === 0}
              >
                ⚡ 2. Ejecutar Polling / CDC Relay ({pendingCount} pendientes)
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleDualWriteDemo(false)}
              >
                📦 Dual-Write Normal (BD + Kafka)
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => handleDualWriteDemo(true)}
              >
                💥 Dual-Write con Fallo de Broker (Crea Inconsistencia)
              </button>
            </>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            style={{ marginLeft: 'auto' }}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* ── Tab: Patrón Outbox ── */}
      {activeTab === 'outbox' && (
        <div className="tos-tables-grid">
          {/* Tabla 1: orders */}
          <div className="tos-table-card">
            <div className="tos-table-head">
              <span className="tos-table-badge">DB Table: orders</span>
              <small>{snapshot.orders.length} filas</small>
            </div>
            <div className="tos-table-wrap">
              <table className="tos-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.orders.map((o) => (
                    <tr key={o.id}>
                      <td><code>{o.id}</code></td>
                      <td>{o.customer}</td>
                      <td>${o.amount.toFixed(2)}</td>
                      <td><span className="badge badge--success">{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla 2: outbox_events */}
          <div className="tos-table-card">
            <div className="tos-table-head">
              <span className="tos-table-badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>
                DB Table: outbox_events (Buffer ACID)
              </span>
              <small>{snapshot.outboxEvents.length} eventos</small>
            </div>
            <div className="tos-table-wrap">
              <table className="tos-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Aggregate ID</th>
                    <th>Estado</th>
                    <th>Reintentos</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.outboxEvents.map((e) => (
                    <tr key={e.id}>
                      <td><code>{e.id.substring(0, 14)}...</code></td>
                      <td><code>{e.aggregateId}</code></td>
                      <td>
                        <span className={`badge badge--${e.status === OUTBOX_STATUS.PUBLISHED ? 'success' : 'warning'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td>{e.retryCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla 3: Message Broker (Kafka) */}
          <div className="tos-table-card">
            <div className="tos-table-head">
              <span className="tos-table-badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                Message Broker: Kafka Topic [orders.events]
              </span>
              <span className={`badge badge--${snapshot.isBrokerHealthy ? 'success' : 'danger'}`}>
                {snapshot.isBrokerHealthy ? '🟢 ONLINE' : '🔴 OFFLINE'}
              </span>
            </div>
            <div className="tos-table-wrap">
              <table className="tos-table">
                <thead>
                  <tr>
                    <th>Message ID</th>
                    <th>Topic</th>
                    <th>Payload Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.brokerEvents.map((be, i) => (
                    <tr key={i}>
                      <td><code>{be.messageId.substring(0, 14)}...</code></td>
                      <td><span className="badge badge--neutral">{be.topic}</span></td>
                      <td><strong>{be.payload.customer}</strong> (${be.payload.amount})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Demostración Dual-Write Falla ── */}
      {activeTab === 'dual_write' && (
        <div className="tos-dual-write-section">
          <div className="tos-explanation-alert">
            <strong>¿Por qué falla el Dual-Write tradicional?</strong>
            <p>
              Si guardas primero en la Base de Datos y luego llamas a <code>kafka.send()</code> por red,
              cualquier caída momentánea del broker, timeout de red o reinicio del contenedor provoca que el pedido
              exista en tu base de datos pero <strong>los microservicios downstream (pagos, inventario, emails) NUNCA se enteren</strong>.
            </p>
          </div>

          <div className="tos-dual-write-logs">
            <h4>Bitácora de Intentos Dual-Write</h4>
            {dualWriteLogs.length === 0 ? (
              <p className="tos-empty-text">Presiona los botones superiores para simular llamadas Dual-Write.</p>
            ) : (
              dualWriteLogs.map((log) => (
                <div key={log.id} className={`tos-log-item ${log.isInconsistent ? 'tos-log-item--danger' : 'tos-log-item--ok'}`}>
                  <div className="tos-log-top">
                    <span>Pedido: <strong>{log.customer}</strong> (${log.amount.toFixed(2)})</span>
                    <span className={`badge badge--${log.isInconsistent ? 'danger' : 'success'}`}>
                      {log.isInconsistent ? '🚨 INCONSISTENCIA CRÍTICA' : '✅ Consistente'}
                    </span>
                  </div>
                  <div className="tos-log-details">
                    <span>DB Guardado: {log.dbSaved ? '✅ SI' : '❌ NO'}</span>
                    <span>Broker Kafka: {log.brokerSent ? '✅ SI' : '❌ NO'}</span>
                  </div>
                  {log.isInconsistent && (
                    <p className="tos-inconsistent-msg">
                      ⚠️ El pedido está en la base de datos pero el broker nunca recibió el evento. ¡Inventario y envíos no sincronizados!
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  )
}
