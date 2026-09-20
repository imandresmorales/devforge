/**
 * @fileoverview Tests unitarios para contrastDaltonismEngine.js (Mejora 114).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  hexToRgb,
  getRelativeLuminance,
  calculateContrastRatio,
  evaluateWcagCompliance,
  applyVisionMode,
  DALTONISM_MODES,
} from './contrastDaltonismEngine'

describe('contrastDaltonismEngine (Mejora 114)', () => {
  beforeEach(() => {
    document.documentElement.className = ''
  })

  it('debe convertir correctamente colores HEX a componentes RGB numéricos', () => {
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255])
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
    expect(hexToRgb('#fff')).toEqual([255, 255, 255])
    expect(hexToRgb('invalid')).toEqual([0, 0, 0])
  })

  it('debe calcular luminancias relativas conforme al estándar W3C', () => {
    const whiteLum = getRelativeLuminance(255, 255, 255)
    const blackLum = getRelativeLuminance(0, 0, 0)
    expect(whiteLum).toBe(1)
    expect(blackLum).toBe(0)
  })

  it('debe calcular ratio de contraste exacto entre blanco y negro (21:1)', () => {
    const ratio = calculateContrastRatio('#ffffff', '#000000')
    expect(ratio).toBe(21)
  })

  it('debe evaluar correctamente el cumplimiento WCAG para diferentes ratios', () => {
    const aaaResult = evaluateWcagCompliance(7.5)
    expect(aaaResult.level).toBe('AAA')
    expect(aaaResult.wcagAAANormal).toBe(true)

    const aaResult = evaluateWcagCompliance(4.8)
    expect(aaResult.level).toBe('AA')
    expect(aaResult.wcagAANormal).toBe(true)
    expect(aaResult.wcagAAANormal).toBe(false)

    const failResult = evaluateWcagCompliance(2.1)
    expect(failResult.level).toBe('Fail')
    expect(failResult.wcagAANormal).toBe(false)
  })

  it('debe aplicar y alternar clases de filtro visual en document.documentElement', () => {
    expect(DALTONISM_MODES.length).toBeGreaterThanOrEqual(6)
    applyVisionMode('deuteranopia')
    expect(document.documentElement.classList.contains('a11y-filter-deuteranopia')).toBe(true)

    applyVisionMode('protanopia')
    expect(document.documentElement.classList.contains('a11y-filter-deuteranopia')).toBe(false)
    expect(document.documentElement.classList.contains('a11y-filter-protanopia')).toBe(true)

    applyVisionMode('normal')
    expect(document.documentElement.classList.contains('a11y-filter-protanopia')).toBe(false)
  })
})
