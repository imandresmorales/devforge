/**
 * @fileoverview LineChart — gráfico de línea SVG puro con puntos interactivos.
 *
 * TÉCNICA SVG:
 * - Puntos normalizados al viewBox usando interpolación lineal (lerp)
 * - Línea: elemento <polyline> con puntos calculados dinámicamente
 * - Área bajo la curva: <polygon> con opacidad reducida
 * - Animación de trazado: stroke-dasharray / stroke-dashoffset con CSS
 * - Grid: líneas horizontales y verticales para lectura de valores
 * - Tooltips: estado local con posición calculada del punto bajo cursor
 *
 * @module components/ui/Charts/LineChart
 */
import { useState, useRef } from 'react'
import './LineChart.css'

/**
 * @typedef {Object} LineDatum
 * @property {string} label  - Label del eje X
 * @property {number} value  - Valor del punto
 */

/**
 * Gráfico de línea SVG accesible con puntos interactivos y área sombreada.
 *
 * @param {Object}     props
 * @param {LineDatum[]} props.data       - Puntos del gráfico
 * @param {string}     props.title      - Título accesible
 * @param {string}     [props.color]    - Color de la línea y puntos
 * @param {string}     [props.unit]     - Unidad del tooltip (ej: 'commits')
 * @returns {JSX.Element}
 */
function LineChart({ data = [], title = 'Gráfico de línea', color = 'var(--color-brand-500)', unit = '' }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  if (!data.length) {
    return <p className="chart-empty">Sin datos para mostrar.</p>
  }

  // ── Dimensiones internas ────────────────────────────────────
  const W       = 400
  const H       = 200
  const PAD     = { top: 20, right: 20, bottom: 36, left: 44 }
  const chartW  = W - PAD.left - PAD.right
  const chartH  = H - PAD.top  - PAD.bottom
  const maxVal  = Math.max(...data.map((d) => d.value), 1)
  const minVal  = 0

  // ── Normalización de coordenadas ─────────────────────────────
  function toX(i) {
    return PAD.left + (i / (data.length - 1)) * chartW
  }
  function toY(val) {
    return PAD.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH
  }

  // Puntos para <polyline>
  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')

  // Puntos para el área (polygon cerrado)
  const areaPoints = [
    `${PAD.left},${PAD.top + chartH}`,
    ...data.map((d, i) => `${toX(i)},${toY(d.value)}`),
    `${PAD.left + chartW},${PAD.top + chartH}`,
  ].join(' ')

  // ── Grid lines ──────────────────────────────────────────────
  const GRID_LINES = 4
  const gridVals = Array.from({ length: GRID_LINES + 1 }, (_, i) =>
    Math.round((maxVal / GRID_LINES) * i)
  )

  return (
    <div className="line-chart-wrapper">
      <svg
        ref={svgRef}
        className="line-chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={title}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <title>{title}</title>
        <desc>{data.map((d) => `${d.label}: ${d.value}${unit}`).join(', ')}</desc>

        {/* ── Área sombreada ── */}
        <polygon
          points={areaPoints}
          className="line-chart__area"
          style={{ fill: color, opacity: 0.12 }}
          aria-hidden="true"
        />

        {/* ── Grid horizontal ── */}
        <g aria-hidden="true">
          {gridVals.map((val) => {
            const y = toY(val)
            return (
              <g key={val}>
                <line
                  x1={PAD.left} y1={y}
                  x2={PAD.left + chartW} y2={y}
                  className="line-chart__grid"
                />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" className="line-chart__axis-label">
                  {val}
                </text>
              </g>
            )
          })}
        </g>

        {/* ── Línea ── */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="line-chart__line"
          aria-hidden="true"
        />

        {/* ── Puntos interactivos ── */}
        {data.map((d, i) => {
          const cx = toX(i)
          const cy = toY(d.value)
          return (
            <g key={d.label}>
              {/* Área de captura de hover más grande que el punto visible */}
              <circle
                cx={cx} cy={cy} r={12}
                fill="transparent"
                className="line-chart__hit-area"
                onMouseEnter={() => setTooltip({ i, x: cx, y: cy, ...d })}
                onMouseLeave={() => setTooltip(null)}
                onFocus={() => setTooltip({ i, x: cx, y: cy, ...d })}
                onBlur={() => setTooltip(null)}
                tabIndex={0}
                aria-label={`${d.label}: ${d.value}${unit}`}
              />
              {/* Punto visible */}
              <circle
                cx={cx} cy={cy} r={tooltip?.i === i ? 5 : 3.5}
                fill={tooltip?.i === i ? 'white' : color}
                stroke={color}
                strokeWidth="2"
                className="line-chart__dot"
                style={{ transition: 'r 0.15s ease' }}
                aria-hidden="true"
              />
              {/* Label eje X */}
              <text
                x={cx} y={PAD.top + chartH + 22}
                textAnchor="middle"
                className="line-chart__axis-label"
                aria-hidden="true"
              >
                {d.label}
              </text>
            </g>
          )
        })}

        {/* ── Tooltip ── */}
        {tooltip && (
          <g className="line-chart__tooltip" aria-hidden="true">
            <rect
              x={tooltip.x - 30}
              y={tooltip.y - 32}
              width={60} height={22}
              rx={4} ry={4}
              fill="var(--color-bg-secondary)"
              stroke={color}
              strokeWidth="1"
              filter="url(#shadow)"
            />
            <text
              x={tooltip.x}
              y={tooltip.y - 16}
              textAnchor="middle"
              className="line-chart__tooltip-text"
            >
              {tooltip.value}{unit}
            </text>
          </g>
        )}

        {/* ── Eje base ── */}
        <line
          x1={PAD.left} y1={PAD.top + chartH}
          x2={PAD.left + chartW} y2={PAD.top + chartH}
          className="line-chart__axis-base"
          aria-hidden="true"
        />
      </svg>
    </div>
  )
}

export default LineChart
