import { describe, it, expect } from 'vitest'
import { validateSchema, loginSchema, feedbackSchema } from './schemaValidator'

describe('Schema Validator (schemaValidator.js)', () => {
  it('debe validar un objeto correcto contra loginSchema', () => {
    const data = { email: 'admin@devforge.local', password: 'secretPassword123' }
    const res = validateSchema(data, loginSchema)
    expect(res.isValid).toBe(true)
    expect(Object.keys(res.errors).length).toBe(0)
  })

  it('debe fallar ante email inválido o contraseña corta', () => {
    const data = { email: 'not-an-email', password: '123' }
    const res = validateSchema(data, loginSchema)
    expect(res.isValid).toBe(false)
    expect(res.errors.email).toBeDefined()
    expect(res.errors.password).toBeDefined()
  })

  it('debe validar feedbackSchema con restricciones numéricas y enums', () => {
    const validFeedback = {
      rating: 5,
      category: 'performance',
      comments: 'Excelente velocidad y modularidad del código!',
    }
    const res = validateSchema(validFeedback, feedbackSchema)
    expect(res.isValid).toBe(true)

    const invalidCategory = {
      rating: 6,
      category: 'invalid_category',
      comments: 'Hi',
    }
    const resInvalid = validateSchema(invalidCategory, feedbackSchema)
    expect(resInvalid.isValid).toBe(false)
    expect(resInvalid.errors.rating).toBeDefined()
    expect(resInvalid.errors.category).toBeDefined()
    expect(resInvalid.errors.comments).toBeDefined()
  })
})
