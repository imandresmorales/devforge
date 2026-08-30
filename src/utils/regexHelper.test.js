import { describe, it, expect } from 'vitest'
import { testRegex, REGEX_PRESETS } from './regexHelper'

describe('Regex Tester & Anti-ReDoS Engine (regexHelper.js)', () => {
  it('debe detectar coincidencias globales y extraer índices', () => {
    const text = 'Emails: alex@devforge.io, test@example.com y no-valido'
    const pattern = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
    const result = testRegex(pattern, 'g', text)

    expect(result.isValidRegex).toBe(true)
    expect(result.isMatch).toBe(true)
    expect(result.matches.length).toBe(2)
    expect(result.matches[0].text).toBe('alex@devforge.io')
    expect(result.matches[1].text).toBe('test@example.com')
  })

  it('debe manejar errores de sintaxis sin lanzar excepciones', () => {
    const invalidPattern = '[a-z' // Falta corchete de cierre
    const result = testRegex(invalidPattern, 'g', 'texto')

    expect(result.isValidRegex).toBe(false)
    expect(result.error).toContain('Error de sintaxis')
  })

  it('debe rechazar patrones que exceden límites de seguridad anti-ReDoS', () => {
    const longPattern = 'a'.repeat(350)
    const result = testRegex(longPattern, 'g', 'texto')

    expect(result.isValidRegex).toBe(false)
    expect(result.error).toContain('anti-ReDoS')
  })

  it('debe evaluar correctamente los presets del catálogo', () => {
    const preset = REGEX_PRESETS.find((p) => p.id === 'hex_color')
    const result = testRegex(preset.pattern, preset.flags, preset.sample)

    expect(result.isValidRegex).toBe(true)
    expect(result.matches.some((m) => m.text === '#4f46e5')).toBe(true)
  })
})
