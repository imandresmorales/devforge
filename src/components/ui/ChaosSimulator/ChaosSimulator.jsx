/**
 * @fileoverview Componente ChaosSimulator — Simulador de Chaos Engineering y Resiliencia.
 *
 * MEJORA 98: Inyección de Caos Controlado en Sistemas Distribuidos (Netflix Chaos Monkey / Chaos Mesh).
 * Permite ejecutar experimentos de degradación (Picos de Latencia, Muerte de Pods, Pérdida de Paquetes,
 * Partición de Red) y contrastar la resiliencia automática (Circuit Breakers, Retries, Auto-Healing).
 *
 * @module components/ui/ChaosSimulator
 */
import { useState, useMemo } from 'react'
import {
  CHAOS_EXPERIMENTS,
  createChaosTopology,
  runChaosExperiment
} from '../../../utils/chaosEngine.js'
import './ChaosSimulator.css'

export default function ChaosSimulator() {
  const [selectedExperiment, setSelectedExperiment] = useState('LATENCY_SPIKE')
  const [withResilience, setWithResilience] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [experimentResult, setExperimentResult] = useState(null)
  const [topology, setTopology] = useState(() => createChaosTopology())

  const handleRunExperiment = () => {
    setIsRunning(true)
    setExperimentResult(null)

    setTimeout(() => {
      const result = runChaosExperiment(selectedExperiment, topology, { withResilience })
      setExperimentResult(result)
      setIsRunning(false)
    }, 450)
  }

  const handleReset = () => {
    setTopology(createChaosTopology())
    setExperimentResult(null)
  }

  const activeTopology = experimentResult ? experimentResult.affectedTopology : topology

  return (
    <section className="chaos-sim" aria-labelledby="chaos-title">
      <div className="chaos-header">
        <div className="chaos-header__badge">
          <span>MEJORA 98</span>
          <span className="chaos-badge-tag">Chaos Engineering & Resiliencia Cloud-Native</span>
        </div>
        <h2 id="chaos-title" className="chaos-header__title">
          Simulador de Chaos Engineering y Fallos Controlados en Sistemas Distribuidos
        </h2>
        <p className="chaos-header__desc">
          Evaluación de la robustez arquitectónica mediante inyección deliberada de turbulencias (Chaos Monkey). Mide el radio de impacto (Blast Radius), tiempo medio de recuperación (MTTR) y la efectividad de Circuit Breakers y Auto-Healing.
        </p>
      </div>

      {/* Selector de Experimentos y Opciones */}
      <div className="chaos-controls-grid">
        <div className="chaos-card">
          <label className="chaos-label" htmlFor="chaos-exp-select">
            Experimento de Caos a Inyectar:
          </label>
          <select
            id="chaos-exp-select"
            className="chaos-select"
            value={selectedExperiment}
            onChange={(e) => {
              setSelectedExperiment(e.target.value)
              setExperimentResult(null)
            }}
          >
            {Object.values(CHAOS_EXPERIMENTS).map((exp) => (
              <option key={exp.id} value={exp.id}>
                [{exp.severity}] {exp.name}
              </option>
            ))}
          </select>
          <p className="chaos-exp-desc">
            {CHAOS_EXPERIMENTS[selectedExperiment].desc}
          </p>
        </div>

        <div className="chaos-card">
          <label className="chaos-label">Configuración de Resiliencia:</label>
          <div className="chaos-toggle-row">
            <label className="chaos-switch-label">
              <input
                type="checkbox"
                checked={withResilience}
                onChange={(e) => {
                  setWithResilience(e.target.checked)
                  setExperimentResult(null)
                }}
              />
              <span>Habilitar Patrones de Resiliencia (Circuit Breaker + Retries + Auto-Healing)</span>
            </label>
          </div>

          <div className="chaos-actions-row">
            <button
              className="chaos-btn chaos-btn--primary"
              onClick={handleRunExperiment}
              disabled={isRunning}
            >
              {isRunning ? 'Inyectando Turbulencia...' : '🔥 Desatar Experimento de Caos'}
            </button>
            <button
              className="chaos-btn chaos-btn--secondary"
              onClick={handleReset}
              disabled={isRunning}
            >
              ↺ Resetear Topología
            </button>
          </div>
        </div>
      </div>

      {/* Topología de Microservicios Visual */}
      <div className="chaos-topology-panel">
        <h3 className="chaos-section-title">
          Topología de Microservicios en Tiempo Real
        </h3>
        <div className="chaos-services-grid">
          {activeTopology.map((srv) => {
            let statusClass = 'healthy'
            let statusText = 'Saludable (100% SLA)'
            if (srv.status === 'DEGRADED') {
              statusClass = 'degraded'
              statusText = 'Degradado (Alta Latencia)'
            } else if (srv.status === 'UNHEALTHY' || srv.status === 'CRASHED' || srv.status === 'ISOLATED') {
              statusClass = 'critical'
              statusText = 'Fallo Crítico / Aislado'
            } else if (srv.status === 'FAILOVER_STANDBY' || srv.status === 'RATE_LIMITED') {
              statusClass = 'mitigated'
              statusText = 'Mitigado / Failover Activo'
            }

            return (
              <div key={srv.id} className={`chaos-service-card chaos-service-card--${statusClass}`}>
                <div className="chaos-srv-header">
                  <span className="chaos-srv-name">{srv.name}</span>
                  <span className="chaos-srv-region">{srv.region}</span>
                </div>
                <div className="chaos-srv-metrics">
                  <div>Latencia: <strong>{srv.latencyMs}ms</strong></div>
                  <div>Pods: <strong>{srv.replicas}</strong></div>
                  <div>Error Rate: <strong>{(srv.errorRate * 100).toFixed(0)}%</strong></div>
                </div>
                <div className="chaos-srv-status-badge">
                  <span className="chaos-srv-dot" />
                  <span>{statusText}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Resultados y Métricas de Blast Radius */}
      {experimentResult && (
        <div className="chaos-results-panel">
          <div className="chaos-metrics-summary">
            <div className="chaos-metric-tile">
              <span className="chaos-tile-label">Disponibilidad del Sistema (SLA):</span>
              <strong className={`chaos-tile-value ${experimentResult.successRate > 90 ? 'green' : 'red'}`}>
                {experimentResult.successRate.toFixed(1)}%
              </strong>
            </div>
            <div className="chaos-metric-tile">
              <span className="chaos-tile-label">Radio de Impacto (Blast Radius):</span>
              <strong className="chaos-tile-value yellow">
                {experimentResult.blastRadiusPercent.toFixed(0)}% del clúster
              </strong>
            </div>
            <div className="chaos-metric-tile">
              <span className="chaos-tile-label">Tiempo Medio de Recuperación (MTTR):</span>
              <strong className="chaos-tile-value cyan">
                {experimentResult.mttrSeconds}
              </strong>
            </div>
          </div>

          {/* Bitácora de Eventos de Caos */}
          <div className="chaos-audit-card">
            <h4>Bitácora de Reacción del Clúster (Incident Response Log)</h4>
            <div className="chaos-log-list">
              {experimentResult.auditLogs.map((log, i) => (
                <div key={i} className="chaos-log-item">
                  <span className="chaos-log-event">{log.event}</span>
                  <span className="chaos-log-msg">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
