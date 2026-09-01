/**
 * @fileoverview Componente CircuitBreakerSimulator — Simulador interactivo de resiliencia Circuit Breaker (Mejora 49).
 *
 * CARACTERÍSTICAS:
 * - Diagrama animado de máquina de estados (CLOSED 🟢, OPEN 🔴, HALF-OPEN 🟡).
 * - Conmutador para simular degradación o caída del microservicio (Error 500).
 * - Disparador de peticiones individuales y ráfagas con ejecución de contingencia (Fallback).
 * - Temporizador en cuenta regresiva para el período de enfriamiento (Cooldown).
 *
 * @module components/ui/CircuitBreakerSimulator
 */
import { useState, useEffect, useRef } from 'react'
import { CircuitBreaker, CB_STATE } from '../../../utils/circuitBreaker'
import './CircuitBreakerSimulator.css'

function CircuitBreakerSimulator() {
  const [shouldFailService, setShouldFailService] = useState(false)
  const cbRef = useRef(
    new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 4000,
      successThreshold: 2,
    })
  )

  const [metrics, setMetrics] = useState(cbRef.current.getMetrics())
  const [logs, setLogs] = useState([])

  // Polling para actualizar estados temporizados y cuenta regresiva de cooldown
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics(cbRef.current.getMetrics())
    }, 250)
    return () => clearInterval(timer)
  }, [])

  const handleCallService = async () => {
    const res = await cbRef.current.execute(
      async () => {
        // Simular latencia de red
        await new Promise((r) => setTimeout(r, 60))
        if (shouldFailService) {
          throw new Error('500 Microservice Down')
        }
        return { data: 'Respuesta OK de Microservicio de Pagos', status: 200 }
      },
      (err) => {
        return { data: `[FALLBACK] Caché local / Degradación grácil (${err.message})`, status: 503 }
      }
    )

    const newLog = {
      id: `cb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      endpoint: '/api/v1/payments/process',
      state: res.state,
      fromFallback: res.fromFallback,
      status: res.result.status,
      message: res.result.data,
      time: new Date().toLocaleTimeString(),
    }

    setLogs((prev) => [newLog, ...prev].slice(0, 8))
    setMetrics(cbRef.current.getMetrics())
  }

  const handleBurst = async (count = 4) => {
    for (let i = 0; i < count; i++) {
      await handleCallService()
    }
  }

  const handleReset = () => {
    cbRef.current.reset()
    setMetrics(cbRef.current.getMetrics())
    setLogs([])
  }

  return (
    <section className="cb-section" aria-label="Simulador de Circuit Breaker">
      <div className="cb-header">
        <div>
          <h2 className="cb-title">🛡️ Patrón Circuit Breaker (Resiliencia Microservicios)</h2>
          <p className="cb-subtitle">
            Previene fallos en cascada en arquitecturas distribuidas mediante detección de fallos y aislamiento rápido.
          </p>
        </div>

        <button
          type="button"
          className={`cb-service-toggle${shouldFailService ? ' cb-service-toggle--failing' : ''}`}
          onClick={() => setShouldFailService((prev) => !prev)}
        >
          {shouldFailService ? '💥 Microservicio con Fallo 500' : '🟢 Microservicio Saludable'}
        </button>
      </div>

      <div className="cb-container">
        {/* Panel Superior: Diagrama de Estados */}
        <div className="cb-fsm-diagram">
          {[
            { key: CB_STATE.CLOSED, label: 'CLOSED', desc: 'Tráfico Normal', icon: '🟢' },
            { key: CB_STATE.OPEN, label: 'OPEN', desc: 'Fallo Rápido (Fail-Fast)', icon: '🔴' },
            { key: CB_STATE.HALF_OPEN, label: 'HALF-OPEN', desc: 'Prueba de Recuperación', icon: '🟡' },
          ].map(({ key, label, desc, icon }) => {
            const isActive = metrics.state === key
            return (
              <div
                key={key}
                className={`cb-state-node${isActive ? ' cb-state-node--active' : ''} cb-state-node--${key.toLowerCase()}`}
              >
                <div className="cb-state-top">
                  <span className="cb-state-icon">{icon}</span>
                  <span className="cb-state-label">{label}</span>
                </div>
                <span className="cb-state-desc">{desc}</span>
                {isActive && key === CB_STATE.OPEN && metrics.cooldownRemainingMs > 0 && (
                  <span className="cb-state-timer">
                    Enfriamiento: {(metrics.cooldownRemainingMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Panel Inferior: Controles y Registro */}
        <div className="cb-body-grid">
          {/* Métricas y Acciones */}
          <div className="cb-controls-pane">
            <div className="cb-stats-card">
              <div className="cb-stat-row">
                <span>Fallos Consecutivos:</span>
                <strong>{metrics.consecutiveFailures} / {metrics.failureThreshold}</strong>
              </div>
              <div className="cb-stat-row">
                <span>Peticiones Totales:</span>
                <strong>{metrics.totalCalls}</strong>
              </div>
              <div className="cb-stat-row">
                <span>Bloqueadas por Circuito (Fail-Fast):</span>
                <strong style={{ color: metrics.rejectedCalls > 0 ? '#ef4444' : 'inherit' }}>
                  {metrics.rejectedCalls}
                </strong>
              </div>
            </div>

            <div className="cb-buttons-row">
              <button type="button" className="btn-primary" onClick={handleCallService}>
                🚀 Invocar Microservicio
              </button>
              <button type="button" className="btn-secondary" onClick={() => handleBurst(4)}>
                ⚡ Ráfaga (4 reqs)
              </button>
              <button type="button" className="btn-secondary" onClick={handleReset}>
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Registro de Auditoría de Llamadas */}
          <div className="cb-logs-pane">
            <div className="cb-logs-header">
              <span className="cb-logs-title">Registro de Peticiones y Fallbacks</span>
              <span className="badge badge--brand">{logs.length} eventos</span>
            </div>

            {logs.length === 0 ? (
              <div className="cb-logs-empty">
                <span>Pulsa "Invocar Microservicio" para observar las transiciones de estado.</span>
              </div>
            ) : (
              <div className="cb-logs-list">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`cb-log-item${log.fromFallback ? ' cb-log-item--fallback' : ''}`}
                  >
                    <div className="cb-log-meta">
                      <span className={`badge badge--${log.status === 200 ? 'success' : 'warning'}`}>
                        HTTP {log.status} {log.fromFallback ? '(Fallback Activado)' : '(Directo)'}
                      </span>
                      <span className="cb-log-time">{log.time}</span>
                    </div>
                    <div className="cb-log-msg">{log.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CircuitBreakerSimulator
