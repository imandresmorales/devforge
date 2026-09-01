import { describe, it, expect } from 'vitest'
import {
  generateUUIDv7,
  extractTimestampFromUUIDv7,
  validateUUIDv7,
  generateNanoID,
  validateNanoID,
} from './cryptoTokens'

describe('Cryptographic Token Generator UUIDv7 & NanoID (cryptoTokens.js)', () => {
  it('debe generar un UUIDv7 válido con la versión 7 y variante RFC 4122', () => {
    const uuid = generateUUIDv7()
    expect(validateUUIDv7(uuid)).toBe(true)
    expect(uuid.charAt(14)).toBe('7') // Versión 7
    expect(['8', '9', 'a', 'b']).toContain(uuid.charAt(19).toLowerCase()) // Variante
  })

  it('debe preservar y decodificar correctamente el timestamp en UUIDv7', () => {
    const fixedTime = 1700000000000 // Fri Nov 17 2023 22:13:20 GMT
    const uuid = generateUUIDv7(fixedTime)
    const decoded = extractTimestampFromUUIDv7(uuid)

    expect(decoded).not.toBeNull()
    expect(decoded.timestampMs).toBe(fixedTime)
    expect(decoded.isoDate).toBe(new Date(fixedTime).toISOString())
  })

  it('debe generar NanoID de longitud personalizada y caracteres seguros', () => {
    const nano12 = generateNanoID(12)
    const nano21 = generateNanoID(21)

    expect(nano12.length).toBe(12)
    expect(validateNanoID(nano12, 12)).toBe(true)

    expect(nano21.length).toBe(21)
    expect(validateNanoID(nano21, 21)).toBe(true)
  })

  it('debe rechazar tokens inválidos en la validación', () => {
    expect(validateUUIDv7('invalid-uuid')).toBe(false)
    expect(validateUUIDv7('123e4567-e89b-12d3-a456-426614174000')).toBe(false) // UUIDv1, no v7
    expect(validateNanoID('token con espacios!', 21)).toBe(false)
  })
})
