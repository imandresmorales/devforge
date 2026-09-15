/**
 * @fileoverview Componente OpenTelemetryExplorer — Observabilidad y Trazabilidad Distribuida (Mejora 93).
 *
 * Muestra la propagación de contexto W3C traceparent, el árbol de Spans jerárquico
 * en formato gráfico Gantt/Waterfall y la inspección de atributos OpenTelemetry.
 *
 * @module components/ui/OpenTelemetryExplorer
 */
import { useState, useMemo } from 'react'
import {
  TRACE_SCENARIOS,
  formatTraceParent,
} from '../../../utils/openTelemetryEngine'
import './OpenTelemetryExplorer.css'

const SERVICE_COLORS = {
  'api-gateway': '#38bdf8',
  'auth-service': '#818cf8',
  'payment-service': '#f59e0b',
  'inventory-db': '#34d399',
  'kafka-broker': '#ec4899',
}

export default function OpenTelemetryExplorer() {
  const [injectFailure, setInjectFailure] = useState(false)
  const [injectLatency, setInjectLatency] = useState(false)
  const [selectedSpanIndex, setSelectedSpanIndex] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  // Generar traza distribuida
  const spans = useMemo(() => {
    return TRACE_SCENARIOS.CHECKOUT_FLOW.generateTrace({
      injectFailure,
      injectLatency,
    })
  }, [injectFailure, injectLatency, refreshKey])

  const rootSpan = spans[0]
  const totalDuration = useMemo(() => {
    const ends = spans.map((s) => s.startTime + s.durationMs)
    return Math.max(...ends, 1)
  }, [spans])

  const selectedSpan = spans[selectedSpanIndex] || rootSpan

  const w3cHeader = useMemo(() => {
    return formatTraceParent(rootSpan.traceId, rootSpan.spanId)
  }, [rootSpan])

  return (
    <section className="otel-explorer" aria-labelledby="otel-title">
      {/* ── Encabezado ── */}
      <div className="otel-explorer__header">
        <div className="otel-explorer__title-row">
          <h2 id="otel-title" className="otel-explorer__title">
            <span>🔭</span> Motor de Observabilidad OpenTelemetry & Trazabilidad Distribuida
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span className="badge badge--brand">Mejora 93</span>
            <span className="badge badge--success">W3C TraceContext</span>
            <span className="badge badge--neutral">CNCF OpenTelemetry</span>
            <span className="badge badge--warning">Span Waterfall</span>
          </div>
        </div>
        <p className="otel-explorer__desc">
          Trazabilidad distribuida de microservicios con <strong>OpenTelemetry (OTel)</strong>.
          Permite seguir el ciclo de vida de una petición HTTP que atraviesa múltiples servicios mediante la cabecera estándar <strong>W3C <code>traceparent</code></strong>,
          identificando cuellos de botella de latencia y fallos en cascada.
        </p>
      </div>

      {/* ── Barra de Controles ── */}
      <div className="otel-controls">
        <button
          type="button"
          className="otel-btn otel-btn--primary"
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          ⚡ Nueva Traza (Simular Petición)
        </button>

        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--text-xs)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={injectFailure}
              onChange={(e) => setInjectFailure(e.target.checked)}
            />
            <span>Inyectar Error en Pagos (HTTP 500)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={injectLatency}
              onChange={(e) => setInjectLatency(e.target.checked)}
            />
            <span>Inyectar Latencia en BD (Cuello de Botella)</span>
          </label>
        </div>
      </div>

      {/* ── HUD de Cabecera W3C TraceContext ── */}
      <div className="otel-w3c-box">
        <div>
          <span style={{ color: 'var(--color-text-muted)', marginRight: '6px' }}>W3C traceparent:</span>
          <code style={{ color: '#38bdf8' }}>{w3cHeader}</code>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <span>Duración Total: <strong style={{ color: '#fff' }}>{totalDuration}ms</strong></span>
          <span>Spans: <strong style={{ color: '#fff' }}>{spans.length}</strong></span>
          <span className={`badge ${rootSpan.status === 'OK' ? 'badge--success' : 'badge--error'}`}>
            Status: {rootSpan.status}
          </span>
        </div>
      </div>

      {/* ── Gráfico Waterfall (Gantt Chart de Spans) ── */}
      <div className="otel-waterfall">
        <h4 style={{ margin: '0 0 var(--space-3) 0', color: '#fff', fontSize: 'var(--text-xs)' }}>
          Árbol de Spans & Cascada de Latencia (Timeline 0ms → {totalDuration}ms):
        </h4>

        {spans.map((span, idx) => {
          const leftPercent = (span.startTime / totalDuration) * 100
          const widthPercent = (span.durationMs / totalDuration) * 100
          const color = SERVICE_COLORS[span.serviceName] || '#818cf8'

          return (
            <div
              key={span.spanId}
              className={`otel-waterfall__row ${selectedSpanIndex === idx ? 'otel-waterfall__row--selected' : ''}`}
              onClick={() => setSelectedSpanIndex(idx)}
            >
              <div className="otel-waterfall__span-info">
                <span
                  className="otel-service-badge"
                  style={{ background: `${color}25`, color }}
                >
                  {span.serviceName}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#fff' }}>{span.name}</span>
              </div>

              <div className="otel-waterfall__track">
                <div
                  className="otel-waterfall__bar"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${Math.max(2, widthPercent)}%`,
                    background: span.status === 'ERROR' ? '#ef4444' : color,
                  }}
                />
              </div>

              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textAlign: 'right', color: span.status === 'ERROR' ? '#f87171' : '#cbd5e1' }}>
                {span.durationMs}ms
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Inspector de Span Seleccionado ── */}
      <div className="otel-inspector">
        <h4 style={{ margin: '0 0 var(--space-2) 0', color: '#fff', fontSize: 'var(--text-xs)' }}>
          🔍 Detalles del Span Seleccionado: <strong>{selectedSpan.name}</strong>
        </h4>

        <div className="otel-inspector__grid">
          <div>Trace ID: <code style={{ color: '#38bdf8' }}>{selectedSpan.traceId}</code></div>
          <div>Span ID: <code style={{ color: '#a78bfa' }}>{selectedSpan.spanId}</code></div>
          <div>Parent Span ID: <code style={{ color: '#94a3b8' }}>{selectedSpan.parentSpanId || 'None (Root Span)'}</code></div>
          <div>Span Kind: <span className="badge badge--neutral">{selectedSpan.kind}</span></div>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
          <strong>Atributos OTel:</strong>
          <pre style={{ margin: '4px 0 0 0', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', color: '#34d399', fontFamily: 'monospace' }}>
            {JSON.stringify(selectedSpan.attributes, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  )
}
