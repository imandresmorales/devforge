/**
 * @fileoverview Motor de Verificación Formal de Contratos y Validación de Schemas en Runtime (estilo Zod / JSON Schema).
 *
 * Implementa validación estricta de tipos, protección contra Mass Assignment (OWASP API3)
 * e inyección de propiedades, y generación automática de especificaciones OpenAPI 3.0:
 * - Tipos primitivos y compuestos: string, number, boolean, object, array, enum.
 * - Modificadores y reglas: min, max, email, url, regex, optional, nullable, refine.
 * - Modo estricto (`.strict()`): rechaza o depura propiedades no declaradas.
 * - Función `.safeParse(data)` con desglose detallado de errores (ruta, código, mensaje).
 * - Exportador de contratos a OpenAPI 3.0 / JSON Schema v7.
 *
 * @module utils/schemaValidator
 */

/**
 * Clase base para todos los tipos de Schema.
 */
class BaseSchema {
  constructor() {
    this._isOptional = false
    this._isNullable = false
    this._description = ''
    this._refinements = []
  }

  optional() {
    const clone = this._clone()
    clone._isOptional = true
    return clone
  }

  nullable() {
    const clone = this._clone()
    clone._isNullable = true
    return clone
  }

  describe(desc) {
    const clone = this._clone()
    clone._description = desc
    return clone
  }

  refine(fn, message = 'Validación personalizada fallida') {
    const clone = this._clone()
    clone._refinements.push({ fn, message })
    return clone
  }

  _checkNullish(val) {
    if (val === undefined) {
      if (this._isOptional) return { ok: true, value: undefined }
      return { ok: false, error: 'El valor es requerido (recibido undefined)' }
    }
    if (val === null) {
      if (this._isNullable) return { ok: true, value: null }
      return { ok: false, error: 'El valor no puede ser null' }
    }
    return null
  }

  safeParse(val, path = []) {
    const nullishCheck = this._checkNullish(val)
    if (nullishCheck) {
      if (nullishCheck.ok) return { success: true, data: nullishCheck.value }
      return {
        success: false,
        errors: [{ path: path.join('.'), message: nullishCheck.error, code: 'REQUIRED_FIELD' }],
      }
    }

    const result = this._parse(val, path)
    if (!result.success) return result

    // Ejecutar refinamientos
    for (const ref of this._refinements) {
      try {
        if (!ref.fn(result.data)) {
          return {
            success: false,
            errors: [{ path: path.join('.'), message: ref.message, code: 'CUSTOM_REFINE' }],
          }
        }
      } catch (err) {
        return {
          success: false,
          errors: [{ path: path.join('.'), message: err.message || ref.message, code: 'CUSTOM_REFINE' }],
        }
      }
    }

    return { success: true, data: result.data }
  }

  parse(val) {
    const res = this.safeParse(val)
    if (!res.success) {
      const err = new Error(`Error de validación de contrato: ${res.errors.map((e) => `[${e.path || 'root'}]: ${e.message}`).join(', ')}`)
      err.errors = res.errors
      throw err
    }
    return res.data
  }
}

/**
 * Schema String
 */
class StringSchema extends BaseSchema {
  constructor() {
    super()
    this._min = null
    this._max = null
    this._isEmail = false
    this._isUrl = false
    this._regex = null
  }

  _clone() {
    const c = new StringSchema()
    Object.assign(c, this)
    c._refinements = [...this._refinements]
    return c
  }

  min(length, message) {
    const clone = this._clone()
    clone._min = { val: length, msg: message || `La cadena debe tener al menos ${length} caracteres` }
    return clone
  }

  max(length, message) {
    const clone = this._clone()
    clone._max = { val: length, msg: message || `La cadena no puede superar ${length} caracteres` }
    return clone
  }

  email(message = 'Formato de correo electrónico inválido') {
    const clone = this._clone()
    clone._isEmail = message
    return clone
  }

  url(message = 'Formato de URL inválido') {
    const clone = this._clone()
    clone._isUrl = message
    return clone
  }

  regex(pattern, message = 'El formato no cumple con el patrón requerido') {
    const clone = this._clone()
    clone._regex = { pattern, message }
    return clone
  }

  _parse(val, path) {
    if (typeof val !== 'string') {
      return {
        success: false,
        errors: [{ path: path.join('.'), message: `Se esperaba string, recibido ${typeof val}`, code: 'INVALID_TYPE' }],
      }
    }

    if (this._min && val.length < this._min.val) {
      return { success: false, errors: [{ path: path.join('.'), message: this._min.msg, code: 'TOO_SHORT' }] }
    }
    if (this._max && val.length > this._max.val) {
      return { success: false, errors: [{ path: path.join('.'), message: this._max.msg, code: 'TOO_LONG' }] }
    }
    if (this._isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(val)) {
        return { success: false, errors: [{ path: path.join('.'), message: this._isEmail, code: 'INVALID_EMAIL' }] }
      }
    }
    if (this._isUrl) {
      try {
        new URL(val)
      } catch {
        return { success: false, errors: [{ path: path.join('.'), message: this._isUrl, code: 'INVALID_URL' }] }
      }
    }
    if (this._regex && !this._regex.pattern.test(val)) {
      return { success: false, errors: [{ path: path.join('.'), message: this._regex.message, code: 'REGEX_MISMATCH' }] }
    }

    return { success: true, data: val }
  }

  toJSONSchema() {
    const schema = { type: 'string' }
    if (this._min) schema.minLength = this._min.val
    if (this._max) schema.maxLength = this._max.val
    if (this._isEmail) schema.format = 'email'
    if (this._isUrl) schema.format = 'uri'
    if (this._description) schema.description = this._description
    return schema
  }
}

/**
 * Schema Number
 */
class NumberSchema extends BaseSchema {
  constructor() {
    super()
    this._min = null
    this._max = null
    this._isInteger = false
  }

  _clone() {
    const c = new NumberSchema()
    Object.assign(c, this)
    c._refinements = [...this._refinements]
    return c
  }

  min(val, message) {
    const clone = this._clone()
    clone._min = { val, msg: message || `El número debe ser >= ${val}` }
    return clone
  }

  max(val, message) {
    const clone = this._clone()
    clone._max = { val, msg: message || `El número debe ser <= ${val}` }
    return clone
  }

  int(message = 'El número debe ser un entero') {
    const clone = this._clone()
    clone._isInteger = message
    return clone
  }

  _parse(val, path) {
    if (typeof val !== 'number' || isNaN(val)) {
      return {
        success: false,
        errors: [{ path: path.join('.'), message: `Se esperaba number, recibido ${typeof val}`, code: 'INVALID_TYPE' }],
      }
    }
    if (this._isInteger && !Number.isInteger(val)) {
      return { success: false, errors: [{ path: path.join('.'), message: this._isInteger, code: 'NOT_INTEGER' }] }
    }
    if (this._min && val < this._min.val) {
      return { success: false, errors: [{ path: path.join('.'), message: this._min.msg, code: 'TOO_SMALL' }] }
    }
    if (this._max && val > this._max.val) {
      return { success: false, errors: [{ path: path.join('.'), message: this._max.msg, code: 'TOO_BIG' }] }
    }
    return { success: true, data: val }
  }

  toJSONSchema() {
    const schema = { type: this._isInteger ? 'integer' : 'number' }
    if (this._min) schema.minimum = this._min.val
    if (this._max) schema.maximum = this._max.val
    if (this._description) schema.description = this._description
    return schema
  }
}

/**
 * Schema Boolean
 */
class BooleanSchema extends BaseSchema {
  _clone() {
    const c = new BooleanSchema()
    Object.assign(c, this)
    c._refinements = [...this._refinements]
    return c
  }

  _parse(val, path) {
    if (typeof val !== 'boolean') {
      return {
        success: false,
        errors: [{ path: path.join('.'), message: `Se esperaba boolean, recibido ${typeof val}`, code: 'INVALID_TYPE' }],
      }
    }
    return { success: true, data: val }
  }

  toJSONSchema() {
    return { type: 'boolean', description: this._description || undefined }
  }
}

/**
 * Schema Enum
 */
class EnumSchema extends BaseSchema {
  constructor(values) {
    super()
    this._values = values
  }

  _clone() {
    const c = new EnumSchema(this._values)
    Object.assign(c, this)
    c._refinements = [...this._refinements]
    return c
  }

  _parse(val, path) {
    if (!this._values.includes(val)) {
      return {
        success: false,
        errors: [{ path: path.join('.'), message: `Valor inválido. Permitidos: [${this._values.join(', ')}]`, code: 'INVALID_ENUM_VALUE' }],
      }
    }
    return { success: true, data: val }
  }

  toJSONSchema() {
    return { type: 'string', enum: this._values, description: this._description || undefined }
  }
}

/**
 * Schema Array
 */
class ArraySchema extends BaseSchema {
  constructor(elementSchema) {
    super()
    this._elementSchema = elementSchema
    this._min = null
    this._max = null
  }

  _clone() {
    const c = new ArraySchema(this._elementSchema)
    Object.assign(c, this)
    c._refinements = [...this._refinements]
    return c
  }

  min(length, message) {
    const clone = this._clone()
    clone._min = { val: length, msg: message || `El arreglo debe tener al menos ${length} elementos` }
    return clone
  }

  max(length, message) {
    const clone = this._clone()
    clone._max = { val: length, msg: message || `El arreglo no puede superar ${length} elementos` }
    return clone
  }

  _parse(val, path) {
    if (!Array.isArray(val)) {
      return {
        success: false,
        errors: [{ path: path.join('.'), message: `Se esperaba Array, recibido ${typeof val}`, code: 'INVALID_TYPE' }],
      }
    }

    if (this._min && val.length < this._min.val) {
      return { success: false, errors: [{ path: path.join('.'), message: this._min.msg, code: 'ARRAY_TOO_SHORT' }] }
    }
    if (this._max && val.length > this._max.val) {
      return { success: false, errors: [{ path: path.join('.'), message: this._max.msg, code: 'ARRAY_TOO_LONG' }] }
    }

    const errors = []
    const parsedData = []

    val.forEach((item, idx) => {
      const itemRes = this._elementSchema.safeParse(item, [...path, `[${idx}]`])
      if (!itemRes.success) {
        errors.push(...itemRes.errors)
      } else {
        parsedData.push(itemRes.data)
      }
    })

    if (errors.length > 0) {
      return { success: false, errors }
    }

    return { success: true, data: parsedData }
  }

  toJSONSchema() {
    return {
      type: 'array',
      items: this._elementSchema.toJSONSchema(),
      minItems: this._min?.val,
      maxItems: this._max?.val,
      description: this._description || undefined,
    }
  }
}

/**
 * Schema Object con soporte para .strict() (Anti Mass-Assignment)
 */
class ObjectSchema extends BaseSchema {
  constructor(shape) {
    super()
    this._shape = shape
    this._isStrict = false
  }

  _clone() {
    const c = new ObjectSchema(this._shape)
    Object.assign(c, this)
    c._refinements = [...this._refinements]
    return c
  }

  strict(message = 'Propiedades no reconocidas detectadas (Bloqueo de Mass Assignment)') {
    const clone = this._clone()
    clone._isStrict = message
    return clone
  }

  _parse(val, path) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) {
      return {
        success: false,
        errors: [{ path: path.join('.'), message: `Se esperaba Object, recibido ${typeof val}`, code: 'INVALID_TYPE' }],
      }
    }

    const errors = []
    const parsedData = {}
    const declaredKeys = Object.keys(this._shape)
    const incomingKeys = Object.keys(val)

    // Validar Mass Assignment en modo strict
    if (this._isStrict) {
      const unknownKeys = incomingKeys.filter((k) => !declaredKeys.includes(k))
      if (unknownKeys.length > 0) {
        errors.push({
          path: path.join('.'),
          message: `${this._isStrict}: [${unknownKeys.join(', ')}]`,
          code: 'UNRECOGNIZED_KEYS',
        })
      }
    }

    // Validar cada propiedad declarada
    declaredKeys.forEach((key) => {
      const fieldSchema = this._shape[key]
      const fieldVal = val[key]
      const fieldPath = [...path, key]

      const fieldRes = fieldSchema.safeParse(fieldVal, fieldPath)
      if (!fieldRes.success) {
        errors.push(...fieldRes.errors)
      } else if (fieldRes.data !== undefined) {
        parsedData[key] = fieldRes.data
      }
    })

    if (errors.length > 0) {
      return { success: false, errors }
    }

    return { success: true, data: parsedData }
  }

  toJSONSchema() {
    const properties = {}
    const required = []

    Object.entries(this._shape).forEach(([key, schema]) => {
      properties[key] = schema.toJSONSchema()
      if (!schema._isOptional) {
        required.push(key)
      }
    })

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: !this._isStrict,
      description: this._description || undefined,
    }
  }
}

/**
 * Fábrica pública de esquemas (DSL declarativo tipo Zod)
 */
export const Contract = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  enum: (values) => new EnumSchema(values),
  array: (elementSchema) => new ArraySchema(elementSchema),
  object: (shape) => new ObjectSchema(shape),
}
