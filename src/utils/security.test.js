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

    // ── Edge cases añadidos en Mejora 24 ────────────────────────
    it('debe manejar números sin lanzar errores (retorna string vacío)', () => {
      expect(sanitizeInput(123)).toBe('')
      expect(sanitizeInput(0)).toBe('')
    })

    it('debe mantener texto plano sin modificaciones', () => {
      expect(sanitizeInput('Texto normal sin HTML')).toBe('Texto normal sin HTML')
    })

    it('debe eliminar payloads XSS avanzados (svg/onload)', () => {
      const svgXSS = '<svg onload="alert(1)">contenido</svg>seguro'
      expect(sanitizeInput(svgXSS)).toBe('seguro')
    })

    it('debe eliminar javascript: en atributos href', () => {
      const jsHref = '<a href="javascript:alert(1)">click</a>link'
      expect(sanitizeInput(jsHref)).toBe('clicklink')
    })

    it('debe hacer trim del resultado', () => {
      expect(sanitizeInput('  texto  ')).toBe('texto')
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

    // ── Edge cases añadidos en Mejora 24 ────────────────────────
    it('debe retornar string vacío para inputs no string', () => {
      expect(sanitizeHtml(null)).toBe('')
      expect(sanitizeHtml(undefined)).toBe('')
    })

    it('debe preservar texto plano dentro de etiquetas permitidas', () => {
      expect(sanitizeHtml('<p>Texto de prueba</p>')).toContain('Texto de prueba')
    })

    it('debe eliminar atributos no permitidos (onclick, style) de etiquetas seguras', () => {
      const withEvent = '<p onclick="alert()">texto</p>'
      const result = sanitizeHtml(withEvent)
      expect(result).not.toContain('onclick')
      expect(result).toContain('texto')
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

    // ── Edge cases añadidos en Mejora 24 ────────────────────────
    it('estado vacío: retorna score=0 y checks todos en false', () => {
      const res = evaluatePasswordStrength('')
      expect(res.score).toBe(0)
      expect(res.checks.length).toBe(false)
      expect(res.checks.upper).toBe(false)
      expect(res.checks.lower).toBe(false)
      expect(res.checks.number).toBe(false)
      expect(res.checks.special).toBe(false)
    })

    it('el objeto retornado siempre incluye score, label, color, percentage y checks', () => {
      const res = evaluatePasswordStrength('TestPass1!')
      expect(res).toHaveProperty('score')
      expect(res).toHaveProperty('label')
      expect(res).toHaveProperty('color')
      expect(res).toHaveProperty('percentage')
      expect(res).toHaveProperty('checks')
    })

    it('contraseña con solo minúsculas de 8+ chars: score mínimo de longitud', () => {
      const res = evaluatePasswordStrength('abcdefgh')
      expect(res.checks.length).toBe(true)
      expect(res.checks.upper).toBe(false)
      expect(res.checks.special).toBe(false)
    })

    it('contraseña con >= 12 chars obtiene un punto extra', () => {
      const res12 = evaluatePasswordStrength('AbcDef123456')
      const res8  = evaluatePasswordStrength('AbcDef12')
      expect(res12.score).toBeGreaterThan(res8.score)
    })

    it('percentage siempre es un número entre 0 y 100', () => {
      const passwords = ['', 'abc', 'AbcD1!', 'SuperLongP@ssword2026!']
      passwords.forEach((pwd) => {
        const { percentage } = evaluatePasswordStrength(pwd)
        expect(percentage).toBeGreaterThanOrEqual(0)
        expect(percentage).toBeLessThanOrEqual(100)
      })
    })
  })
})
