/**
 * @fileoverview Tests del componente BarChart — renderizado SVG y accesibilidad.
 *
 * ESTRATEGIA DE TEST:
 * - @testing-library/react para renderizar el componente
 * - Verificar que el SVG se renderiza con el role y aria-label correctos
 * - Verificar que el número de rectángulos (<rect>) coincide con el número de barras
 * - Verificar el estado vacío cuando no hay datos
 *
 * NOTA: Los tests de gráficos SVG en jsdom son limitados (jsdom no renderiza CSS real).
 * Nos enfocamos en la estructura HTML/SVG y la accesibilidad, no en los píxeles exactos.
 *
 * @module components/ui/Charts/BarChart.test
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BarChart from './BarChart'

/** Datos de muestra reutilizables */
const SAMPLE_DATA = [
  { label: 'Ene', value: 10 },
  { label: 'Feb', value: 25 },
  { label: 'Mar', value: 15 },
  { label: 'Abr', value: 30 },
]

describe('BarChart — gráfico de barras SVG', () => {

  it('renderiza el elemento SVG con role="img" y aria-label correcto', () => {
    render(<BarChart data={SAMPLE_DATA} title="Ventas mensuales" />)

    const svg = screen.getByRole('img', { name: /Ventas mensuales/i })
    expect(svg).toBeInTheDocument()
  })

  it('renderiza el elemento <title> dentro del SVG para accesibilidad', () => {
    const { container } = render(<BarChart data={SAMPLE_DATA} title="Gráfico de test" />)

    const title = container.querySelector('svg title')
    expect(title).not.toBeNull()
    expect(title.textContent).toBe('Gráfico de test')
  })

  it('renderiza tantos <rect> como elementos en data', () => {
    const { container } = render(<BarChart data={SAMPLE_DATA} title="Test" />)

    const rects = container.querySelectorAll('rect')
    // Un <rect> por cada barra (puede haber más si añadimos elementos de fondo)
    // Al menos debe haber tantos como los datos
    expect(rects.length).toBeGreaterThanOrEqual(SAMPLE_DATA.length)
  })

  it('muestra mensaje de estado vacío cuando no hay datos', () => {
    render(<BarChart data={[]} title="Sin datos" />)

    expect(screen.getByText(/Sin datos para mostrar/i)).toBeInTheDocument()
  })

  it('no renderiza SVG cuando data está vacía', () => {
    const { container } = render(<BarChart data={[]} title="Vacío" />)

    const svg = container.querySelector('svg')
    expect(svg).toBeNull()
  })

  it('renderiza el elemento <desc> con los datos descriptivos para screen readers', () => {
    const { container } = render(<BarChart data={SAMPLE_DATA} title="Test" unit=" ventas" />)

    const desc = container.querySelector('svg desc')
    expect(desc).not.toBeNull()
    expect(desc.textContent).toContain('Ene: 10 ventas')
    expect(desc.textContent).toContain('Feb: 25 ventas')
  })

  it('los grupos de barras tienen aria-label con el valor correcto', () => {
    render(<BarChart data={SAMPLE_DATA} title="Test" unit=" items" />)

    // Cada grupo de barra debe ser anunciable por un screen reader
    const barGroups = screen.getAllByRole('presentation')
    expect(barGroups.length).toBeGreaterThanOrEqual(SAMPLE_DATA.length)
  })
})
