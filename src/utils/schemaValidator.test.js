/**
 * @fileoverview Tests unitarios para el Validador de Schemas y Contratos.
 */
import { describe, it, expect } from 'vitest'
import { Contract } from './schemaValidator'

describe('Contract & Runtime Schema Validator', () => {
  describe('Primitivos y Reglas Básicas', () => {
    it('debe validar strings con min, max y email', () => {
      const emailSchema = Contract.string().email().min(5).max(50)

      expect(emailSchema.safeParse('dev@devforge.app').success).toBe(true)
      expect(emailSchema.safeParse('invalido').success).toBe(false)
      expect(emailSchema.safeParse('a@b.c').success).toBe(true)
      expect(emailSchema.safeParse(123).success).toBe(false)
    })

    it('debe validar números, enteros y rangos', () => {
      const ageSchema = Contract.number().int().min(18).max(99)

      expect(ageSchema.safeParse(25).success).toBe(true)
      expect(ageSchema.safeParse(17).success).toBe(false)
      expect(ageSchema.safeParse(25.5).success).toBe(false) // No entero
    })

    it('debe soportar optional() y nullable()', () => {
      const optString = Contract.string().optional()
      expect(optString.safeParse(undefined).success).toBe(true)
      expect(optString.safeParse('hola').success).toBe(true)
      expect(optString.safeParse(null).success).toBe(false)

      const nullString = Contract.string().nullable()
      expect(nullString.safeParse(null).success).toBe(true)
      expect(nullString.safeParse(undefined).success).toBe(false)
    })
  })

  describe('Objetos y Protección Anti-Mass Assignment (.strict())', () => {
    it('debe validar objetos anidados correctamente', () => {
      const userSchema = Contract.object({
        name: Contract.string().min(2),
        role: Contract.enum(['ADMIN', 'DEVELOPER', 'GUEST']),
        tags: Contract.array(Contract.string()).min(1),
      })

      const validUser = {
        name: 'Andres',
        role: 'DEVELOPER',
        tags: ['react', 'security'],
      }

      const res = userSchema.safeParse(validUser)
      expect(res.success).toBe(true)
      expect(res.data.name).toBe('Andres')
    })

    it('debe rechazar propiedades desconocidas en modo .strict() (Anti Mass-Assignment)', () => {
      const updateProfileSchema = Contract.object({
        bio: Contract.string().max(100),
      }).strict()

      // Intento de inyección de campo de privilegios
      const maliciousPayload = {
        bio: 'Senior Cloud Engineer',
        isAdmin: true, // Injected property!
        role: 'SUPERADMIN',
      }

      const res = updateProfileSchema.safeParse(maliciousPayload)
      expect(res.success).toBe(false)
      expect(res.errors[0].code).toBe('UNRECOGNIZED_KEYS')
      expect(res.errors[0].message).toContain('isAdmin')
    })

    it('debe exportar la especificación JSON Schema / OpenAPI', () => {
      const schema = Contract.object({
        title: Contract.string().min(3).describe('Título del artículo'),
        views: Contract.number().int().min(0),
        status: Contract.enum(['DRAFT', 'PUBLISHED']),
      })

      const jsonSchema = schema.toJSONSchema()
      expect(jsonSchema.type).toBe('object')
      expect(jsonSchema.properties.title.type).toBe('string')
      expect(jsonSchema.properties.views.type).toBe('integer')
      expect(jsonSchema.properties.status.enum).toEqual(['DRAFT', 'PUBLISHED'])
    })
  })
})
