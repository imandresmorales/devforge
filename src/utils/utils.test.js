import { describe, it, expect } from 'vitest'
import { truncate, capitalize, isValidEmail, generateId } from './index.js'

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
  })

  describe('capitalize', () => {
    it('debe poner en mayúscula la primera letra', () => {
      expect(capitalize('devforge')).toBe('Devforge')
    })

    it('debe manejar cadenas vacías o no válidas sin lanzar errores', () => {
      expect(capitalize('')).toBe('')
      expect(capitalize(undefined)).toBe('')
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
  })

  describe('generateId', () => {
    it('debe generar identificadores únicos', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
    })
  })
})
