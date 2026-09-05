/**
 * @fileoverview Componente ACIDSimulator — Simulador interactivo de Transacciones ACID y Niveles de Aislamiento SQL (Mejora 60).
 *
 * CARACTERÍSTICAS:
 * - Demostración visual paso a paso de anomalías de concurrencia (Dirty Read, Non-Repeatable Read, Phantom Read).
 * - Selector interactivo de los 4 niveles ANSI SQL (Read Uncommitted, Read Committed, Repeatable Read, Serializable).
 * - Monitor en vivo de estado de tablas y detección de anomalías de consistencia.
 * - Matriz comparativa de protección de motores de bases de datos (PostgreSQL, MySQL InnoDB, SQL Server).
 *
 * @module components/ui/ACIDSimulator
 */
import { useState, useRef, useEffect } from 'react'
import {
  DatabaseEngineSimulator,
  ISOLATION_LEVELS,
  ACID_SCENARIOS,
} from '../../../utils/acidSimulator'
import { useToast } from '../../../context/ToastContext'
import './ACIDSimulator.css'

function ACIDSimulator() {
  const { addToast } = useToast()
  const dbRef = useRef(new DatabaseEngineSimulator())

  const [scenarioId, setScenarioId] = useState('dirty_read')
  const [isolationLevel, setIsolationLevel] = useState('READ_COMMITTED')
  const [engineState, setEngineState] = useState(dbRef.current.getState())

  const syncState = () => {
    setEngineState(dbRef.current.getState())
  }

  useEffect(() => {
    syncState()
  }, [])

  const handleScenarioChange = (newScenario) => {
    setScenarioId(newScenario)
    dbRef.current.setScenario(newScenario)
    syncState()
    addToast({
      type: 'info',
      title: 'Escenario Seleccionado',
      message: `${ACID_SCENARIOS[newScenario].title} cargado en el simulador.`,
    })
  }

  const handleIsolationChange = (newLevel) => {
    setIsolationLevel(newLevel)
    dbRef.current.setIsolationLevel(newLevel)
    syncState()
    addToast({
      type: 'info',
      title: 'Nivel de Aislamiento Actualizado',
      message: `Aislamiento SQL cambiado a ${ISOLATION_LEVELS[newLevel].name}.`,
    })
  }

  const handleStepNext = () => {
    const res = dbRef.current.stepNext()
    syncState()

    if (res.logEntry?.anomaly?.includes('DETECTED')) {
      addToast({
        type: 'danger',
        title: 'Anomalía Detectada',
        message: dbRef.current.getState().detectedAnomaly,
      })
    } else if (res.logEntry?.anomaly?.includes('PREVENTED')) {
      addToast({
        type: 'success',
        title: 'Anomalía Mitigada',
        message: dbRef.current.getState().detectedAnomaly,
      })
    }
  }

  const handleRunAll = () => {
    while (!dbRef.current.getState().isFinished) {
      dbRef.current.stepNext()
    }
    syncState()
    addToast({
      type: 'info',
      title: 'Escenario Completado',
      message: 'Todos los pasos de la transacción fueron ejecutados.',
    })
  }

  const handleReset = () => {
    dbRef.current.reset()
    syncState()
    addToast({
      type: 'info',
      title: 'Simulación Reiniciada',
      message: 'Base de datos y transacciones restablecidas al estado inicial.',
    })
  }

  return (
    <section className="acid-simulator-section" aria-label="Simulador de Transacciones ACID y Niveles de Aislamiento">
      {/* ── Encabezado ── */}
      <div className="acid-simulator-header">
        <div>
          <div className="acid-badge-wrapper">
            <span className="badge badge--brand">🗄️ SQL ANSI/ISO Transactions</span>
            <span className="badge badge--success">ACID & MVCC Consistency</span>
          </div>
          <h2 className="acid-simulator-title">
            Simulador de Transacciones ACID y Niveles de Aislamiento SQL
          </h2>
          <p className="acid-simulator-subtitle">
            Observa cómo la concurrencia genera anomalías como Lecturas Sucias, Lecturas No Repetibles y Lecturas Fantasma, y cómo los niveles de aislamiento las neutralizan.
          </p>
        </div>

        {/* Acciones */}
        <div className="acid-header-actions">
          <button
            type="button"
            className="btn-primary acid-btn-action"
            onClick={handleStepNext}
            disabled={engineState.isFinished}
          >
            ▶️ Siguiente Paso ({engineState.currentStep}/{engineState.totalSteps})
          </button>
          <button
            type="button"
            className="btn-secondary acid-btn-action"
            onClick={handleRunAll}
            disabled={engineState.isFinished}
          >
            ⚡ Ejecutar Todo
          </button>
          <button
            type="button"
            className="btn-danger acid-btn-action"
            onClick={handleReset}
          >
            🔄 Reiniciar
          </button>
        </div>
      </div>

      {/* ── Controles de Escenario y Aislamiento ── */}
      <div className="acid-controls-grid">
        {/* Selector de Escenarios */}
        <div className="acid-card">
          <h3 className="acid-card-title">🧪 Escenarios de Concurrencia</h3>
          <div className="acid-scenarios-list">
            {Object.keys(ACID_SCENARIOS).map((key) => {
              const sc = ACID_SCENARIOS[key]
              return (
                <button
                  key={key}
                  type="button"
                  className={`acid-scenario-btn ${scenarioId === key ? 'acid-scenario-btn--active' : ''}`}
                  onClick={() => handleScenarioChange(key)}
                >
                  <div className="acid-scenario-name">{sc.title}</div>
                  <div className="acid-scenario-desc">{sc.description}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selector de Nivel de Aislamiento */}
        <div className="acid-card">
          <h3 className="acid-card-title">🛡️ Nivel de Aislamiento SQL Activo</h3>
          <div className="acid-isolation-list">
            {Object.keys(ISOLATION_LEVELS).map((key) => {
              const lvl = ISOLATION_LEVELS[key]
              return (
                <button
                  key={key}
                  type="button"
                  className={`acid-iso-btn ${isolationLevel === key ? 'acid-iso-btn--active' : ''}`}
                  onClick={() => handleIsolationChange(key)}
                >
                  <div className="acid-iso-name">{lvl.name}</div>
                  <div className="acid-iso-desc">{lvl.description}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Visualizador de Estado y Detección de Anomalías ── */}
      {engineState.detectedAnomaly && (
        <div className={`acid-anomaly-banner ${engineState.detectedAnomaly.includes('Detectada') ? 'acid-anomaly-banner--danger' : 'acid-anomaly-banner--success'}`}>
          <span>{engineState.detectedAnomaly.includes('Detectada') ? '🚨' : '🛡️'}</span>
          <strong>{engineState.detectedAnomaly}</strong>
        </div>
      )}

      {/* ── Datos en Memoria y Traza de Ejecución ── */}
      <div className="acid-execution-grid">
        {/* Estado de la Base de Datos */}
        <div className="acid-card">
          <h3 className="acid-card-title">💾 Registros en Base de Datos (Data Store)</h3>
          <div className="acid-data-list">
            {Object.keys(engineState.dataStore).map((key) => {
              const row = engineState.dataStore[key]
              return (
                <div key={key} className="acid-data-item">
                  <span className="acid-data-key">{key}</span>
                  <strong className="acid-data-name">{row.name}</strong>
                  <span className="acid-data-val">${row.balance} USD</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Historial Paso a Paso de Transacciones */}
        <div className="acid-card">
          <h3 className="acid-card-title">📋 Secuencia de Ejecución Concurrente</h3>
          <div className="acid-steps-timeline">
            {engineState.scenario.steps.map((step, idx) => {
              const isPast = idx < engineState.currentStep
              const isCurrent = idx === engineState.currentStep - 1

              return (
                <div
                  key={step.step}
                  className={`acid-timeline-item ${isCurrent ? 'acid-timeline-item--current' : isPast ? 'acid-timeline-item--past' : 'acid-timeline-item--future'}`}
                >
                  <div className="acid-timeline-top">
                    <span className={`badge badge--${step.tx === 'Tx 1' ? 'brand' : 'warning'}`}>
                      {step.tx}
                    </span>
                    <span className="acid-timeline-action">{step.action}</span>
                    <span className="acid-timeline-step-num">Paso {step.step}</span>
                  </div>
                  <p className="acid-timeline-desc">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Matriz de Aislamiento ANSI SQL ── */}
      <div className="acid-matrix-card">
        <h3 className="acid-matrix-title">📊 Matriz de Anomalías según el Estándar ANSI/ISO SQL</h3>
        <div className="acid-table-wrapper">
          <table className="acid-matrix-table">
            <thead>
              <tr>
                <th>Nivel de Aislamiento</th>
                <th>Lectura Sucia (Dirty Read)</th>
                <th>Lectura No Repetible</th>
                <th>Lectura Fantasma (Phantom)</th>
                <th>Uso Típico</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Read Uncommitted</strong></td>
                <td className="text-danger">⚠️ Permitida</td>
                <td className="text-danger">⚠️ Permitida</td>
                <td className="text-danger">⚠️ Permitida</td>
                <td>Lectura de estadísticas sin bloqueos</td>
              </tr>
              <tr>
                <td><strong>Read Committed</strong></td>
                <td className="text-success">🛡️ Prevenida</td>
                <td className="text-danger">⚠️ Permitida</td>
                <td className="text-danger">⚠️ Permitida</td>
                <td>Por defecto en PostgreSQL, Oracle, SQL Server</td>
              </tr>
              <tr>
                <td><strong>Repeatable Read</strong></td>
                <td className="text-success">🛡️ Prevenida</td>
                <td className="text-success">🛡️ Prevenida</td>
                <td className="text-danger">⚠️ Permitida (En ANSI)</td>
                <td>Por defecto en MySQL InnoDB (Usa Gap Locks)</td>
              </tr>
              <tr>
                <td><strong>Serializable</strong></td>
                <td className="text-success">🛡️ Prevenida</td>
                <td className="text-success">🛡️ Prevenida</td>
                <td className="text-success">🛡️ Prevenida</td>
                <td>Operaciones bancarias y de alta criticidad</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default ACIDSimulator
