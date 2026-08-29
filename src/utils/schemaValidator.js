/**
 * @fileoverview Motor de validación de esquemas en tiempo de ejecución (Mejora 36).
 *
 * CARACTERÍSTICAS:
 * - Validador seguro y ultra-ligero sin dependencias externas.
 * - Soporte para validación de tipos, rangos, expresiones regulares, enums y campos requeridos.
 * - Esquemas preconstruidos para autenticación, contacto y feedback.
 *
 * @module utils/schemaValidator
 */
import { isValidEmail } from './index'

/**
 * Valida un objeto de datos contra una definición de esquema.
 *
 * @param {Record<string, unknown>} data - Objeto a validar
 * @param {Record<string, Object>} schema - Definición del esquema
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 *
 * @example
 * const schema = {
 *   email: { type: 'email', required: true },
 *   age: { type: 'number', min: 18 }
 * }
 * const result = validateSchema({ email: 'test@example.com', age: 20 }, schema)
 */
export function validateSchema(data = {}, schema = {}) {
  const errors = {}

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]
    const hasValue = value !== undefined && value !== null && value !== ''

    // 1. Campo requerido
    if (rules.required && !hasValue) {
      errors[field] = rules.requiredMessage || `El campo ${field} es obligatorio.`
      continue
    }

    // Si no es requerido y no tiene valor, saltar validaciones adicionales
    if (!hasValue) continue

    // 2. Validación de Tipo
    if (rules.type === 'string') {
      if (typeof value !== 'string') {
        errors[field] = `El campo ${field} debe ser un texto.`
        continue
      }
      if (rules.minLength && value.trim().length < rules.minLength) {
        errors[field] = `Debe tener al menos ${rules.minLength} caracteres.`
        continue
      }
      if (rules.maxLength && value.trim().length > rules.maxLength) {
        errors[field] = `No debe exceder ${rules.maxLength} caracteres.`
        continue
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors[field] = rules.patternMessage || `El formato de ${field} no es válido.`
        continue
      }
    } else if (rules.type === 'number') {
      const num = Number(value)
      if (isNaN(num)) {
        errors[field] = `El campo ${field} debe ser un número válido.`
        continue
      }
      if (rules.min !== undefined && num < rules.min) {
        errors[field] = `El valor mínimo es ${rules.min}.`
        continue
      }
      if (rules.max !== undefined && num > rules.max) {
        errors[field] = `El valor máximo es ${rules.max}.`
        continue
      }
    } else if (rules.type === 'boolean') {
      if (typeof value !== 'boolean') {
        errors[field] = `El campo ${field} debe ser verdadero o falso.`
        continue
      }
    } else if (rules.type === 'email') {
      if (typeof value !== 'string' || !isValidEmail(value.trim())) {
        errors[field] = `Introduce una dirección de correo electrónico válida.`
        continue
      }
    } else if (rules.type === 'url') {
      try {
        new URL(value)
      } catch {
        errors[field] = `Introduce una URL válida con protocolo (http:// o https://).`
        continue
      }
    }

    // 3. Enum (Valores permitidos)
    if (rules.enum && Array.isArray(rules.enum)) {
      if (!rules.enum.includes(value)) {
        errors[field] = `Valor no permitido. Opciones: ${rules.enum.join(', ')}.`
        continue
      }
    }

    // 4. Validador personalizado
    if (typeof rules.custom === 'function') {
      const customError = rules.custom(value, data)
      if (customError) {
        errors[field] = customError
        continue
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Esquema de validación para inicio de sesión.
 */
export const loginSchema = {
  email: { type: 'email', required: true },
  password: { type: 'string', required: true, minLength: 6 },
}

/**
 * Esquema de validación para retroalimentación y NPS.
 */
export const feedbackSchema = {
  rating: { type: 'number', required: true, min: 1, max: 5 },
  category: { type: 'string', required: true, enum: ['usability', 'performance', 'security', 'features'] },
  comments: { type: 'string', required: true, minLength: 5, maxLength: 500 },
}
