/**
 * @fileoverview Tests unitarios para altTextOcrEngine.js (Mejora 117).
 */
import { describe, it, expect } from 'vitest'
import {
  evaluateAltText,
  generateSuggestedAlt,
} from './altTextOcrEngine'

describe('altTextOcrEngine (Mejora 117)', () => {
  it('debe aprobar imágenes decorativas marcadas explícitamente', () => {
    const res = evaluateAltText('', true)
    expect(res.valid).toBe(true)
    expect(res.isDecorative).toBe(true)
    expect(res.score).toBe(100)
    expect(res.quality).toBe('perfect')
  })

  it('debe detectar error si falta alt en imagen informativa', () => {
    const res = evaluateAltText('', false)
    expect(res.valid).toBe(false)
    expect(res.score).toBe(0)
    expect(res.quality).toBe('error')
    expect(res.issues.length).toBeGreaterThan(0)
  })

  it('debe advertir ante frases redundantes como "foto de" o nombres de archivo .png', () => {
    const resRedundant = evaluateAltText('Foto de la interfaz de usuario')
    expect(resRedundant.valid).toBe(false)
    expect(resRedundant.issues[0]).toContain('Evita usar frases redundantes')

    const resFile = evaluateAltText('dashboard-screenshot.png')
    expect(resFile.valid).toBe(false)
    expect(resFile.issues.some((i) => i.includes('nombre de archivo'))).toBe(true)
  })

  it('debe generar texto alternativo sugerido coherente a partir del nombre y contexto', () => {
    const suggested = generateSuggestedAlt('grafico-ventas-q3.svg', 'Diagrama de barras con ingresos mensuales')
    expect(suggested).toBe('grafico ventas q3: Diagrama de barras con ingresos mensuales')

    const simple = generateSuggestedAlt('hero-banner.jpg')
    expect(simple).toBe('Hero banner')
  })
})
