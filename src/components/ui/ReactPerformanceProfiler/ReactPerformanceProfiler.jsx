/**
 * @fileoverview Componente UI para el Profiler de Rendimiento React y Detector de Fugas de Memoria (Mejora 73).
 *
 * Muestra:
 * - Flamegraph / Árbol de Renderizado de componentes en vivo.
 * - Simulador de Rerenders innecesarios (Props inestables vs Props memoizadas con React.memo / useMemo).
 * - Detector interactivo de fugas de memoria (Memory Leaks en useEffect timers y event listeners).
 * - Métricas de telemetría: Render time (ms), Renders desperdiciados (Wasted Renders), Score de eficiencia (A+ a F).
 *
 * @module components/ui/ReactPerformanceProfiler/ReactPerformanceProfiler
 */
import { useState, useRef } from 'react'
import {
  ReactProfilerEngine,
  MemoryLeakTracker,
} from '../../../utils/reactProfilerHelper'
import './ReactPerformanceProfiler.css'

export default function ReactPerformanceProfiler() {
  const engineRef = useRef(new ReactProfilerEngine())
  const trackerRef = useRef(new MemoryLeakTracker())

  // Initial populate
  if (engineRef.current.renderLogs.length === 0) {
    engineRef.current.recordRender('AppRoot', 'mount', 18.4, 25.0)
    engineRef.current.recordRender('DashboardGrid', 'mount', 12.1, 15.0)
    engineRef.current.recordRender('DataTable', 'mount', 8.5, 10.0)
    engineRef.current.recordRender('HeavyChartsWidget', 'mount', 22.0, 28.0)
  }

  const [, setTick] = useState(0)
  const [mountedWidgets, setMountedWidgets] = useState({
    chatWidget: true,
    analyticsWidget: true,
  })
  const [leakReports, setLeakReports] = useState([])

  // State update simulation
  const [primitiveCount, setPrimitiveCount] = useState(0)
  const [useOptimization, setUseOptimization] = useState(false)

  const handleSimulateRender = (type) => {
    const engine = engineRef.current
    const duration = 2 + Math.random() * 8

    if (type === 'unstable') {
      // Pasa nuevo objeto literal no memoizado
      const prevProps = { config: { theme: 'dark', sort: 'asc' } }
      const nextProps = { config: { theme: 'dark', sort: 'asc' } }
      engine.recordRender('HeavyChartsWidget', 'update', duration, 15.0, prevProps, nextProps)
    } else if (type === 'memoized') {
      // Props estables
      const stableObj = { theme: 'dark', sort: 'asc' }
      engine.recordRender('DataTable', 'update', duration * 0.3, 10.0, { config: stableObj }, { config: stableObj })
    }

    setTick((t) => t + 1)
  }

  const handleToggleWidget = (widgetName) => {
    const isCurrentlyMounted = mountedWidgets[widgetName]

    if (isCurrentlyMounted) {
      // Desmontar: verificar si dejó fugas
      if (widgetName === 'chatWidget') {
        // ChatWidget simulado tiene bug: no limpia su socket listener
        trackerRef.current.registerResource('socket_listener_chat', 'ChatWidget', 'socket')
      }
      const leaks = trackerRef.current.inspectUnmountedComponent(widgetName === 'chatWidget' ? 'ChatWidget' : 'AnalyticsWidget')
      setLeakReports(leaks)
    } else {
      // Montar de nuevo
      setLeakReports([])
    }

    setMountedWidgets((prev) => ({ ...prev, [widgetName]: !prev[widgetName] }))
  }

  const summary = engineRef.current.getSummary()

  return (
    <section className="react-profiler" aria-labelledby="profiler-title">
      <div className="react-profiler__header">
        <div>
          <span className="badge badge--brand">React 18/19 & Rendimiento Frontend</span>
          <h2 id="profiler-title" className="react-profiler__title">
            Monitor y Profiler de Rendimiento React & Memory Leaks
          </h2>
          <p className="react-profiler__desc">
            Inspecciona en tiempo real los ciclos de renderizado, detecta <strong>Wasted Renders</strong> causados por
            referencias inestables en props y diagnostica fugas de memoria en hooks <code>useEffect</code>.
          </p>
        </div>

        <div className="profiler-score-card">
          <span className="profiler-score-label">Eficiencia de Render:</span>
          <div className="profiler-score-val">
            <span className={`profiler-badge profiler-badge--${summary.score.toLowerCase()}`}>
              {summary.score}
            </span>
            <span>{summary.efficiencyPercent}%</span>
          </div>
        </div>
      </div>

      {/* ── Métricas Globales del Profiler ── */}
      <div className="profiler-metrics-row">
        <div className="profiler-metric-box">
          <span className="profiler-metric-title">Total Renders</span>
          <span className="profiler-metric-number">{summary.totalRenders}</span>
        </div>
        <div className="profiler-metric-box">
          <span className="profiler-metric-title">Wasted Renders (Desperdiciados)</span>
          <span className="profiler-metric-number profiler-text-danger">{summary.totalWasted}</span>
        </div>
        <div className="profiler-metric-box">
          <span className="profiler-metric-title">Componentes Monitorizados</span>
          <span className="profiler-metric-number">{summary.components.length}</span>
        </div>
        <div className="profiler-metric-box">
          <span className="profiler-metric-title">Fugas de Memoria Activas</span>
          <span className={`profiler-metric-number ${leakReports.length > 0 ? 'profiler-text-danger' : 'profiler-text-success'}`}>
            {leakReports.length}
          </span>
        </div>
      </div>

      {/* ── Grid Principal: Simulador y Logs ── */}
      <div className="profiler-grid">
        {/* Panel 1: Controles de Simulación de Render & Fugas */}
        <div className="profiler-panel">
          <h3 className="profiler-panel-title">⚡ Laboratorio de Renderizado & Memoria</h3>

          <div className="profiler-actions-group">
            <label className="profiler-label">Simular Re-renders:</label>
            <div className="profiler-btn-grid">
              <button
                type="button"
                className="btn-danger btn-sm"
                onClick={() => handleSimulateRender('unstable')}
              >
                💥 Re-render Inestable (Prop Objeto Nuevo)
              </button>
              <button
                type="button"
                className="btn-success btn-sm"
                onClick={() => handleSimulateRender('memoized')}
              >
                ✨ Re-render Optimizado (React.memo)
              </button>
            </div>
          </div>

          <div className="profiler-actions-group">
            <label className="profiler-label">Ciclo de Vida y Detección de Fugas de Memoria:</label>
            <div className="profiler-widgets-toggle">
              <div className="profiler-widget-row">
                <span>💬 ChatWidget (Tiene listener sin cleanup)</span>
                <button
                  type="button"
                  className={`btn-xs ${mountedWidgets.chatWidget ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => handleToggleWidget('chatWidget')}
                >
                  {mountedWidgets.chatWidget ? 'Desmontar' : 'Montar'}
                </button>
              </div>

              <div className="profiler-widget-row">
                <span>📊 AnalyticsWidget (Cleanup correcto)</span>
                <button
                  type="button"
                  className={`btn-xs ${mountedWidgets.analyticsWidget ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => handleToggleWidget('analyticsWidget')}
                >
                  {mountedWidgets.analyticsWidget ? 'Desmontar' : 'Montar'}
                </button>
              </div>
            </div>
          </div>

          {leakReports.length > 0 && (
            <div className="profiler-leak-alert">
              <strong>🚨 ALERTA DE MEMORY LEAK:</strong>
              {leakReports.map((leak, idx) => (
                <div key={idx} className="profiler-leak-item">
                  <span>Recurso huérfano: <code>{leak.id}</code> ({leak.type}) en {leak.componentName}.</span>
                  <p>{leak.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2: Flamegraph / Historial de Renders del Profiler */}
        <div className="profiler-panel">
          <div className="profiler-panel-header">
            <h3 className="profiler-panel-title">🔥 Registro de Renders (Telemetry Logs)</h3>
            <button
              type="button"
              className="btn-xs btn-secondary"
              onClick={() => {
                engineRef.current.reset()
                setTick((t) => t + 1)
              }}
            >
              Limpiar
            </button>
          </div>

          <div className="profiler-logs-container">
            {engineRef.current.renderLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className={`profiler-log-item ${log.isWasted ? 'profiler-log-item--wasted' : ''}`}
              >
                <div className="profiler-log-header">
                  <strong>{log.componentName}</strong>
                  <span className="profiler-phase-tag">{log.phase}</span>
                  <span className="profiler-duration-tag">{log.actualDuration} ms</span>
                </div>
                {log.isWasted && (
                  <div className="profiler-wasted-warning">
                    ⚠️ Wasted Render: Props inestables recreadas: <code>{log.unstableProps.join(', ')}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
