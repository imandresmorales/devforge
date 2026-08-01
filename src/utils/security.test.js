import { describe, it, expect } from 'vitest'
import { sanitizeInput, sanitizeHtml, evaluatePasswordStrength } from './security.js'

describe('Seguridad - Sanitización XSS (security.js)', () => {
  describe('sanitizeInput', () => {
    it('debe eliminar cualquier etiqueta <script> y código ejecutable', () => {
      const malicious = '<script>alert("xss")</script>Hola'
      expect(sanitizeInput(malicious)).toBe('Hola')
    })

    it('debe eliminar atributos de eventos como onload o onerror', () => {
      const imgXSS = '<img src="x" onerror="alert(1)" />Texto limpio'
      expect(sanitizeInput(imgXSS)).toBe('Texto limpio')
    })

    it('debe retornar string vacío si se pasa un valor no válido', () => {
      expect(sanitizeInput(null)).toBe('')
      expect(sanitizeInput(undefined)).toBe('')
    })
  })

  describe('sanitizeHtml', () => {
    it('debe permitir etiquetas HTML seguras como <strong> o <em>', () => {
      const safeHtml = '<strong>Hola</strong> <em>Mundo</em>'
      expect(sanitizeHtml(safeHtml)).toBe('<strong>Hola</strong> <em>Mundo</em>')
    })

    it('debe remover etiquetas peligrosas como <iframe/> o <script/>', () => {
      const iframeXSS = '<iframe src="javascript:alert(1)"></iframe><b>Seguro</b>'
      expect(sanitizeHtml(iframeXSS)).toBe('<b>Seguro</b>')
    })
  })

  describe('evaluatePasswordStrength', () => {
    it('debe devolver nivel "Muy débil" para contraseñas cortas o simples', () => {
      const res = evaluatePasswordStrength('123')
      expect(res.label).toBe('Muy débil')
      expect(res.percentage).toBeLessThanOrEqual(20)
    })

    it('debe devolver nivel "Excelente" para contraseñas largas con mayúsculas, símbolos y números', () => {
      const res = evaluatePasswordStrength('P@ssw0rdSecure2026!')
      expect(res.label).toBe('Excelente')
      expect(res.percentage).toBe(100)
    })
  })
})
