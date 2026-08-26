/**
 * @fileoverview DonutChart — gráfico circular (donut) SVG puro.
 *
 * TÉCNICA SVG:
 * - Cada segmento es un <circle> con stroke-dasharray para simular un arco
 * - stroke-dashoffset controla el punto de inicio de cada segmento
 * - El "agujero" del donut se logra con strokeWidth grande + fill none
 * - Animación: stroke-dasharray de 0 al valor final con CSS keyframes
 * - viewBox cuadrado centrado en (cx, cy) = (50, 50) → simplifica cálculos
 *
 * ACCESIBILIDAD:
 * - role="img" con aria-label y <desc> con todos los porcentajes
 * - Leyenda externa con semántica apropiada
 *
 * @module components/ui/Charts/DonutChart
 */
import { useState } from 'react'
import './DonutChart.css'

/**
 * @typedef {Object} DonutSegment
 * @property {string} label      - Nombre del segmento
 * @property {number} value      - Valor numérico
 * @property {string} color      - Color CSS del segmento
 */

const CIRCUMFERENCE = 2 * Math.PI * 38  // radio = 38 (viewBox 100x100, centro 50,50)

/**
 * Gráfico donut SVG accesible y animado.
 *
 * @param {Object}        props
 * @param {DonutSegment[]} props.segments  - Segmentos del gráfico
 * @param {string}        props.title     - Título accesible
 * @param {string|number} [props.centerLabel] - Texto central (opcional)
 * @returns {JSX.Element}
 */
function DonutChart({ segments = [], title = 'Gráfico circular', centerLabel = '' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  if (!segments.length) {
    return <p className="chart-empty">Sin datos para mostrar.</p>
  }

  const total = segments.reduce((sum, s) => sum + s.value, 0)

  // Calcular stroke-dasharray y stroke-dashoffset para cada segmento
  let cumulativeOffset = 0
  const segmentData = segments.map((seg) => {
    const percentage = seg.value / total
    const dash       = percentage * CIRCUMFERENCE
    const offset     = CIRCUMFERENCE - cumulativeOffset
    cumulativeOffset += dash
    return { ...seg, dash, offset, percentage }
  })

  const hoveredSeg = hoveredIndex !== null ? segmentData[hoveredIndex] : null

  return (
    <div className="donut-chart-layout">
      {/* ── SVG ── */}
      <div className="donut-chart-wrapper">
        <svg
          className="donut-chart"
          viewBox="0 0 100 100"
          role="img"
          aria-label={title}
          style={{ width: '100%', maxWidth: '200px', height: 'auto', display: 'block' }}
        >
          <title>{title}</title>
          <desc>
            {segmentData
              .map((s) => `${s.label}: ${Math.round(s.percentage * 100)}%`)
              .join(', ')}
          </desc>

          {/* Anillo de fondo */}
          <circle
            cx="50" cy="50" r="38"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="12"
            aria-hidden="true"
          />

          {/* Segmentos */}
          {segmentData.map((seg, i) => (
            <circle
              key={seg.label}
              cx="50" cy="50" r="38"
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredIndex === i ? 14 : 12}
              strokeDasharray={`${seg.dash} ${CIRCUMFERENCE}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="round"
              className="donut-chart__segment"
              style={{
                '--donut-dash':   seg.dash,
                '--donut-offset': seg.offset,
                '--donut-delay':  `${i * 80}ms`,
                opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.45 : 1,
                transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              aria-label={`${seg.label}: ${Math.round(seg.percentage * 100)}%`}
            />
          ))}

          {/* Texto central */}
          <text x="50" y="46" textAnchor="middle" className="donut-chart__center-value">
            {hoveredSeg
              ? `${Math.round(hoveredSeg.percentage * 100)}%`
              : centerLabel || `${total}`}
          </text>
          <text x="50" y="58" textAnchor="middle" className="donut-chart__center-label">
            {hoveredSeg ? hoveredSeg.label : 'Total'}
          </text>
        </svg>
      </div>

      {/* ── Leyenda ── */}
      <ul className="donut-chart__legend" aria-label="Leyenda del gráfico">
        {segmentData.map((seg, i) => (
          <li
            key={seg.label}
            className={`donut-chart__legend-item${hoveredIndex === i ? ' donut-chart__legend-item--active' : ''}`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span
              className="donut-chart__legend-dot"
              style={{ backgroundColor: seg.color }}
              aria-hidden="true"
            />
            <span className="donut-chart__legend-label">{seg.label}</span>
            <span className="donut-chart__legend-pct">
              {Math.round(seg.percentage * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DonutChart
