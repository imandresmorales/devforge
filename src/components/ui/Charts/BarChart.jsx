/**
 * @fileoverview BarChart — gráfico de barras SVG puro, sin librerías externas.
 *
 * TÉCNICA SVG:
 * - viewBox responsivo: escala sin perder calidad en cualquier resolución
 * - Barras: elementos <rect> con altura calculada proporcional al valor máximo
 * - Labels: <text> posicionados relativos a cada barra
 * - Tooltips: estado local + <title> SVG nativo (accesible con screen readers)
 * - Animación: @keyframes CSS + stroke-dasharray para entrada suave
 *
 * ACCESIBILIDAD:
 * - role="img" con aria-label descriptivo
 * - <title> y <desc> dentro del SVG para screen readers
 * - Cada barra tiene aria-label con su valor exacto
 *
 * @module components/ui/Charts/BarChart
 */
import { useState } from 'react'
import './BarChart.css'

/**
 * @typedef {Object} BarDatum
 * @property {string} label   - Etiqueta del eje X
 * @property {number} value   - Valor numérico de la barra
 * @property {string} [color] - Color de la barra (sobreescribe barColor global)
 */

/**
 * Gráfico de barras SVG accesible y animado.
 *
 * @param {Object}     props
 * @param {BarDatum[]} props.data       - Datos del gráfico
 * @param {string}     props.title      - Título accesible (aria-label + <title>)
 * @param {string}     [props.barColor] - Color base de las barras (CSS color)
 * @param {string}     [props.unit]     - Unidad a mostrar en el tooltip (ej: '%', 'commits')
 * @param {number}     [props.height]   - Altura del viewBox en px (default: 200)
 * @returns {JSX.Element}
 */
function BarChart({ data = [], title = 'Gráfico de barras', barColor = 'var(--color-brand-500)', unit = '', height = 200 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  if (!data.length) {
    return <p className="chart-empty">Sin datos para mostrar.</p>
  }

  // ── Dimensiones internas del viewBox ────────────────────────
  const W          = 400   // ancho interno del viewBox
  const H          = height
  const PADDING    = { top: 20, right: 10, bottom: 40, left: 40 }
  const chartW     = W - PADDING.left - PADDING.right
  const chartH     = H - PADDING.top  - PADDING.bottom
  const maxValue   = Math.max(...data.map((d) => d.value), 1)
  const barWidth   = chartW / data.length
  const barPadding = barWidth * 0.25

  // ── Líneas guía del eje Y ────────────────────────────────────
  const GRID_LINES = 4
  const gridValues = Array.from({ length: GRID_LINES + 1 }, (_, i) =>
    Math.round((maxValue / GRID_LINES) * i)
  )

  return (
    <div className="bar-chart-wrapper">
      <svg
        className="bar-chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={title}
        aria-describedby="bar-chart-desc"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <title>{title}</title>
        <desc id="bar-chart-desc">
          {data.map((d) => `${d.label}: ${d.value}${unit}`).join(', ')}
        </desc>

        {/* ── Líneas de guía horizontales ── */}
        <g aria-hidden="true">
          {gridValues.map((val) => {
            const y = PADDING.top + chartH - (val / maxValue) * chartH
            return (
              <g key={val}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + chartW}
                  y2={y}
                  className="bar-chart__grid-line"
                />
                <text
                  x={PADDING.left - 6}
                  y={y + 4}
                  className="bar-chart__axis-label"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            )
          })}
        </g>

        {/* ── Barras ── */}
        <g>
          {data.map((d, i) => {
            const barH    = Math.max((d.value / maxValue) * chartH, 2)
            const x       = PADDING.left + i * barWidth + barPadding / 2
            const y       = PADDING.top + chartH - barH
            const w       = barWidth - barPadding
            const color   = d.color || barColor
            const isHover = hoveredIndex === i

            return (
              <g
                key={d.label}
                className={`bar-chart__bar-group${isHover ? ' bar-chart__bar-group--hover' : ''}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(i)}
                onBlur={() => setHoveredIndex(null)}
                tabIndex={0}
                role="presentation"
                aria-label={`${d.label}: ${d.value}${unit}`}
              >
                {/* Barra */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={barH}
                  rx={4}
                  ry={4}
                  fill={color}
                  opacity={hoveredIndex !== null && !isHover ? 0.4 : 1}
                  className="bar-chart__bar"
                  style={{ '--bar-delay': `${i * 60}ms` }}
                />

                {/* Valor encima de la barra */}
                {isHover && (
                  <text
                    x={x + w / 2}
                    y={y - 6}
                    className="bar-chart__value-label"
                    textAnchor="middle"
                  >
                    {d.value}{unit}
                  </text>
                )}

                {/* Label del eje X */}
                <text
                  x={x + w / 2}
                  y={PADDING.top + chartH + 18}
                  className="bar-chart__axis-label"
                  textAnchor="middle"
                >
                  {d.label}
                </text>
              </g>
            )
          })}
        </g>

        {/* ── Eje X base ── */}
        <line
          x1={PADDING.left}
          y1={PADDING.top + chartH}
          x2={PADDING.left + chartW}
          y2={PADDING.top + chartH}
          className="bar-chart__axis-line"
          aria-hidden="true"
        />
      </svg>
    </div>
  )
}

export default BarChart
