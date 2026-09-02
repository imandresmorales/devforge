/**
 * @fileoverview Componente SagaSimulator — Simulador visual de transacciones distribuidas y patrón Saga (Mejora 52).
 *
 * CARACTERÍSTICAS:
 * - Diagrama de etapas distribuidas (Inventario 📦, Pago 💳, Envíos 🚚).
 * - Conmutadores para inyectar fallos simulados en cualquier microservicio.
 * - Animación visual de ejecución hacia adelante y transacciones de compensación (Rollback) en orden inverso.
 * - Registro de auditoría de eventos de consistencia eventual.
 *
 * @module components/ui/SagaSimulator
 */
import { useState } from 'react'
import { SagaOrchestrator, DEFAULT_SAGA_STEPS } from '../../../utils/sagaOrchestrator'
import './SagaSimulator.css'

function SagaSimulator() {
  const [failInventory, setFailInventory] = useState(false)
  const [failPayment, setFailPayment] = useState(false)
  const [failShipping, setFailShipping] = useState(false)

  const [isRunning, setIsRunning] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const [logs, setLogs] = useState([])

  const handleRunSaga = async () => {
    setIsRunning(true)
    setExecutionResult(null)

    const orchestrator = new SagaOrchestrator()
    const flags = {
      inventory: failInventory,
      payment: failPayment,
      shipping: failShipping,
    }

    // Pequeño retardo para dar efecto de procesamiento distribuido
    await new Promise((r) => setTimeout(r, 300))

    const res = await orchestrator.execute(flags)
    setExecutionResult(res)
    setIsRunning(false)

    // Unir pasos ejecutados y compensaciones para el log
    const combined = [
      ...res.executedSteps.map((s) => ({ ...s, phase: 'FORWARD' })),
      ...res.compensationSteps.map((s) => ({ ...s, phase: 'COMPENSATION' })),
    ]
    setLogs((prev) => [...combined.reverse(), ...prev].slice(0, 10))
  }

  const handleReset = () => {
    setFailInventory(false)
    setFailPayment(false)
    setFailShipping(false)
    setExecutionResult(null)
    setLogs([])
  }

  return (
    <section className="saga-section" aria-label="Simulador del Patrón Saga">
      <div className="saga-header">
        <div>
          <h2 className="saga-title">🔄 Patrón Saga (Transacciones Distribuidas & Compensación)</h2>
          <p className="saga-subtitle">
            Garantiza la consistencia eventual entre microservicios ejecutando transacciones de compensación en reversa ante fallos.
          </p>
        </div>
      </div>

      <div className="saga-container">
        {/* Panel Superior: Diagrama de Etapas */}
        <div className="saga-pipeline">
          {DEFAULT_SAGA_STEPS.map((step, idx) => {
            const execStep = executionResult?.executedSteps.find((s) => s.stepId === step.id)
            const compStep = executionResult?.compensationSteps.find((s) => s.stepId === step.id)

            let statusClass = 'saga-node--idle'
            let statusBadge = 'Pendiente'

            if (execStep) {
              if (execStep.status === 'SUCCESS') {
                statusClass = 'saga-node--success'
                statusBadge = '✅ Exitoso'
              } else {
                statusClass = 'saga-node--error'
                statusBadge = '❌ Fallo 500'
              }
            }

            if (compStep) {
              statusClass = 'saga-node--compensated'
              statusBadge = '↩️ Compensado'
            }

            return (
              <div key={step.id} className="saga-node-wrapper">
                <div className={`saga-node ${statusClass}`}>
                  <div className="saga-node-top">
                    <span className="saga-node-idx">Paso {idx + 1}</span>
                    <span className="saga-node-status">{statusBadge}</span>
                  </div>
                  <h4 className="saga-node-title">{step.title}</h4>
                  <span className="saga-node-service">{step.service}</span>
                  <div className="saga-node-actions">
                    <small>Acción: <code>{step.actionName}</code></small>
                    <small>Compensación: <code>{step.compensationName}</code></small>
                  </div>
                </div>
                {idx < DEFAULT_SAGA_STEPS.length - 1 && (
                  <div className="saga-connector">
                    <span>➡️</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Panel Medio: Inyección de Fallos y Controles */}
        <div className="saga-controls-bar">
          <div className="saga-toggles-group">
            <span className="saga-toggles-title">Simular Fallos:</span>
            <label className="saga-toggle-label">
              <input
                type="checkbox"
                checked={failInventory}
                onChange={(e) => setFailInventory(e.target.checked)}
              />
              Fallo en Inventario
            </label>
            <label className="saga-toggle-label">
              <input
                type="checkbox"
                checked={failPayment}
                onChange={(e) => setFailPayment(e.target.checked)}
              />
              Fallo en Pago (Reembolso)
            </label>
            <label className="saga-toggle-label">
              <input
                type="checkbox"
                checked={failShipping}
                onChange={(e) => setFailShipping(e.target.checked)}
              />
              Fallo en Envío (Cancelación)
            </label>
          </div>

          <div className="saga-actions-group">
            <button
              type="button"
              className="btn-primary"
              disabled={isRunning}
              onClick={handleRunSaga}
            >
              {isRunning ? 'Orquestando…' : '🚀 Ejecutar Transacción Saga'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleReset}>
              🔄 Limpiar
            </button>
          </div>
        </div>

        {/* Panel Inferior: Resultado y Log de Compensación */}
        {executionResult && (
          <div
            className={`saga-result-banner${
              executionResult.success ? ' saga-result-banner--success' : ' saga-result-banner--failed'
            }`}
          >
            {executionResult.success ? (
              <span>
                🎉 <strong>Transacción Distribuida Completada:</strong> Todos los microservicios procesaron el pedido sin necesidad de compensación.
              </span>
            ) : (
              <span>
                ⚠️ <strong>Transacción Fallida con Rollback Distribuido:</strong> Se ejecutaron {executionResult.compensationSteps.length} transacciones de compensación para revertir el estado global a consistente.
              </span>
            )}
          </div>
        )}

        {/* Registro de Auditoría */}
        <div className="saga-logs-pane">
          <div className="saga-logs-header">
            <span className="saga-logs-title">Registro de Eventos del Orquestador Saga</span>
            <span className="badge badge--brand">{logs.length} eventos</span>
          </div>

          {logs.length === 0 ? (
            <div className="saga-logs-empty">
              <span>Ejecuta la transacción para observar la traza de llamadas y compensaciones.</span>
            </div>
          ) : (
            <div className="saga-logs-list">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`saga-log-item${
                    log.phase === 'COMPENSATION'
                      ? ' saga-log-item--comp'
                      : log.status === 'ERROR'
                      ? ' saga-log-item--err'
                      : ''
                  }`}
                >
                  <div className="saga-log-meta">
                    <span
                      className={`badge badge--${
                        log.phase === 'COMPENSATION'
                          ? 'warning'
                          : log.status === 'SUCCESS'
                          ? 'success'
                          : 'error'
                      }`}
                    >
                      {log.phase === 'COMPENSATION' ? '↩️ COMPENSACIÓN' : `➡️ ${log.status}`}
                    </span>
                    <span className="saga-log-service">{log.service}</span>
                    <span className="saga-log-time">{log.time}</span>
                  </div>
                  <div className="saga-log-msg">
                    <code>{log.action}</code> — {log.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default SagaSimulator
