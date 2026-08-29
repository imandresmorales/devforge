/**
 * @fileoverview Componente PerformanceMonitor — Monitor flotante de Core Web Vitals en vivo (Mejora 39).
 *
 * CARACTERÍSTICAS:
 * - Indicador discreto con tiempo de carga y calificación de rendimiento.
 * - Panel expandible con métricas en tiempo real (TTFB, FCP, DOM Load, Page Load).
 * - Semáforo de salud (Verde 🟢, Amarillo 🟡, Rojo 🔴).
 * - Checklist de optimizaciones arquitectónicas activas.
 *
 * @module components/ui/PerformanceMonitor
 */
import { useState } from 'react'
import useWebVitals from '../../../hooks/useWebVitals'
import './PerformanceMonitor.css'

function PerformanceMonitor() {
  const [isOpen, setIsOpen] = useState(false)
  const vitals = useWebVitals()

  const ratingColor =
    vitals.rating === 'good'
      ? '#10b981'
      : vitals.rating === 'needs-improvement'
      ? '#f59e0b'
      : '#ef4444'

  return (
    <div className="perf-monitor">
      {/* Botón Indicador Flotante */}
      <button
        type="button"
        className="perf-badge"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Abrir monitor de rendimiento Core Web Vitals"
        title="Monitor de Rendimiento en Tiempo Real"
        style={{ borderColor: ratingColor }}
      >
        <span className="perf-badge__dot" style={{ backgroundColor: ratingColor }} />
        <span className="perf-badge__text">⚡ {vitals.pageLoad}ms</span>
      </button>

      {/* Panel Desplegable de Diagnóstico */}
      {isOpen && (
        <div className="perf-panel" role="dialog" aria-label="Diagnóstico de Rendimiento Web Vitals">
          <div className="perf-panel__header">
            <div className="perf-panel__title-box">
              <span className="perf-panel__icon">⚡</span>
              <h3 className="perf-panel__title">Core Web Vitals en Vivo</h3>
            </div>
            <button
              type="button"
              className="perf-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar monitor"
            >
              ✕
            </button>
          </div>

          {/* Puntaje Global */}
          <div className="perf-score-card">
            <div className="perf-score-num" style={{ color: ratingColor }}>
              {vitals.score}
              <small>/100</small>
            </div>
            <div className="perf-score-meta">
              <strong>Salud del Rendimiento: {vitals.rating === 'good' ? 'Excelente' : 'Aceptable'}</strong>
              <span>Basado en estándares de Google Lighthouse</span>
            </div>
          </div>

          {/* Métricas individuales */}
          <div className="perf-metrics-grid">
            <div className="perf-metric-item">
              <span className="perf-metric-name">TTFB</span>
              <span className="perf-metric-val">{vitals.ttfb} ms</span>
              <span className="perf-metric-sub">Respuesta Servidor</span>
            </div>
            <div className="perf-metric-item">
              <span className="perf-metric-name">FCP</span>
              <span className="perf-metric-val">{vitals.fcp} ms</span>
              <span className="perf-metric-sub">Primer Contenido</span>
            </div>
            <div className="perf-metric-item">
              <span className="perf-metric-name">DOM Load</span>
              <span className="perf-metric-val">{vitals.domLoad} ms</span>
              <span className="perf-metric-sub">Parseo HTML/JS</span>
            </div>
            <div className="perf-metric-item">
              <span className="perf-metric-name">Page Load</span>
              <span className="perf-metric-val">{vitals.pageLoad} ms</span>
              <span className="perf-metric-sub">Carga Completa</span>
            </div>
          </div>

          {/* Checklist de Optimizaciones */}
          <div className="perf-checklist">
            <span className="perf-checklist__title">Optimizaciones Activas:</span>
            <ul>
              <li><span className="perf-check">✓</span> Service Worker & Caché Offline (PWA)</li>
              <li><span className="perf-check">✓</span> Code Splitting con React.lazy (15+ chunks)</li>
              <li><span className="perf-check">✓</span> Sanitización XSS en memoria con DOMPurify</li>
              <li><span className="perf-check">✓</span> Gráficos vectoriales SVG nativos</li>
            </ul>
          </div>

          {/* Acciones */}
          <div className="perf-footer">
            <button
              type="button"
              className="perf-action-btn"
              onClick={vitals.remeasure}
            >
              🔄 Re-medir Rendimiento
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceMonitor
