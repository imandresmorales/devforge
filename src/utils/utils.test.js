import { describe, it, expect } from 'vitest'
import { truncate, capitalize, isValidEmail, generateId, formatDate } from './index.js'

describe('Utilidades puras - utils/index.js', () => {
  describe('truncate', () => {
    it('debe devolver el mismo string si es más corto que maxLength', () => {
      expect(truncate('Hola', 10)).toBe('Hola')
    })

    it('debe truncar el string y añadir el carácter ellipsis (…)', () => {
      expect(truncate('DevForge Plataforma', 8)).toBe('DevForg…')
    })

    it('debe retornar string vacío si el argumento no es una cadena', () => {
      expect(truncate(null)).toBe('')
      expect(truncate(123)).toBe('')
    })

    // ── Edge cases Mejora 24 ─────────────────────────────────────
    it('debe funcionar con maxLength exactamente igual a la longitud del string', () => {
      expect(truncate('Hola', 4)).toBe('Hola')
    })

    it('maxLength de 0 o 1 debe retornar solo el ellipsis o vacío', () => {
      const result = truncate('DevForge', 1)
      expect(result.length).toBeLessThanOrEqual(2) // 1 char + ellipsis
    })

    it('debe funcionar con strings vacíos', () => {
      expect(truncate('', 10)).toBe('')
    })
  })

  describe('capitalize', () => {
    it('debe poner en mayúscula la primera letra', () => {
      expect(capitalize('devforge')).toBe('Devforge')
    })

    it('debe manejar cadenas vacías o no válidas sin lanzar errores', () => {
      expect(capitalize('')).toBe('')
      expect(capitalize(undefined)).toBe('')
    })

    // ── Edge cases Mejora 24 ─────────────────────────────────────
    it('no debe modificar el resto de la cadena (solo la primera letra)', () => {
      expect(capitalize('hELLO')).toBe('HELLO')
    })

    it('debe manejar strings de una sola letra', () => {
      expect(capitalize('a')).toBe('A')
    })

    it('no debe lanzar error con null', () => {
      expect(() => capitalize(null)).not.toThrow()
    })
  })

  describe('isValidEmail', () => {
    it('debe validar correos con formato correcto', () => {
      expect(isValidEmail('test@devforge.com')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
    })

    it('debe rechazar correos con formato inválido', () => {
      expect(isValidEmail('correo-invalido')).toBe(false)
      expect(isValidEmail('user@domain')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
    })

    // ── Edge cases Mejora 24 ─────────────────────────────────────
    it('debe rechazar strings vacíos', () => {
      expect(isValidEmail('')).toBe(false)
    })

    it('debe rechazar valores no-string', () => {
      expect(isValidEmail(null)).toBe(false)
      expect(isValidEmail(undefined)).toBe(false)
      expect(isValidEmail(123)).toBe(false)
    })

    it('debe rechazar emails con espacios', () => {
      expect(isValidEmail('user @domain.com')).toBe(false)
      expect(isValidEmail(' user@domain.com')).toBe(false)
    })

    it('debe aceptar emails con subdominios', () => {
      expect(isValidEmail('user@mail.devforge.com')).toBe(true)
    })
  })

  describe('generateId', () => {
    it('debe generar identificadores únicos', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
    })

    // ── Edge cases Mejora 24 ─────────────────────────────────────
    it('debe generar IDs de tipo string no vacíos', () => {
      const id = generateId()
      expect(id.length).toBeGreaterThan(0)
    })

    it('100 IDs generados deben ser todos únicos', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()))
      expect(ids.size).toBe(100)
    })
  })

  describe('formatDate', () => {
    // ── Tests nuevos Mejora 24 ───────────────────────────────────
    it('debe formatear una fecha ISO string correctamente', () => {
      const result = formatDate('2026-01-15T00:00:00Z')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('debe aceptar objetos Date', () => {
      const date = new Date('2026-06-25')
      const result = formatDate(date)
      expect(typeof result).toBe('string')
      expect(result).toContain('2026')
    })

    it('debe manejar fechas inválidas sin lanzar excepciones', () => {
      expect(() => formatDate('not-a-date')).not.toThrow()
    })
  })
})
