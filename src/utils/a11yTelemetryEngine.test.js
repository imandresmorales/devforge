/**
 * @fileoverview Tests unitarios para a11yTelemetryEngine.js (Mejora 120).
 */
import { describe, it, expect } from 'vitest'
import {
  generateA11yTelemetry,
  exportA11yReportJson,
} from './a11yTelemetryEngine'

describe('a11yTelemetryEngine (Mejora 120)', () => {
  it('debe generar el scorecard de telemetría con los 6 pilares de accesibilidad', () => {
    const telemetry = generateA11yTelemetry()
    expect(telemetry).toBeDefined()
    expect(telemetry.pillars.length).toBe(6)
    expect(telemetry.overallScore).toBeGreaterThanOrEqual(95)
    expect(telemetry.conformanceLevel).toBe('WCAG 2.2 AAA')
  })

  it('debe calcular correctamente el nivel de conformidad según los puntajes de los pilares', () => {
    const customTelemetry = generateA11yTelemetry({
      contrastScore: 70,
      altTextScore: 65,
      focusScore: 60,
      rovingScore: 60,
      ariaScore: 70,
      motionScore: 60,
    })
    expect(customTelemetry.overallScore).toBeLessThan(75)
    expect(customTelemetry.conformanceLevel).toBe('WCAG 2.0 A')
  })

  it('debe exportar el informe completo en formato JSON válido', () => {
    const telemetry = generateA11yTelemetry()
    const jsonStr = exportA11yReportJson(telemetry)
    const parsed = JSON.parse(jsonStr)

    expect(parsed.overallScore).toBe(telemetry.overallScore)
    expect(parsed.auditorVersion).toContain('DevForge')
  })
})
