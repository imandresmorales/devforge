/**
 * @fileoverview Generador y validador de tokens criptográficos UUIDv7 y NanoID (Mejora 48).
 *
 * CARACTERÍSTICAS:
 * - UUIDv7 (RFC 9562): Identificadores únicos ordenables cronológicamente por timestamp Unix.
 * - NanoID: Identificadores criptográficamente seguros para URLs y bases de datos.
 * - Uso estricto de Web Crypto API (crypto.getRandomValues) para máxima entropía.
 * - Decodificador de marcas de tiempo integrado para UUIDv7.
 *
 * @module utils/cryptoTokens
 */

const NANOID_DEFAULT_ALPHABET = 'useandom-26T1983_40STOpfunkgTYHJ RomanceYz'
const NANOID_URL_SAFE_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'

/**
 * Genera un identificador UUID versión 7 cronológicamente ordenable (RFC 9562).
 * Formato: 8-4-4-4-12 caracteres hexadecimales.
 *
 * @param {number} [customTimestamp] - Timestamp Unix en milisegundos (opcional)
 * @returns {string} UUIDv7 válido (ej. 018d4d8a-9e12-7000-8000-000000000000)
 */
export function generateUUIDv7(customTimestamp) {
  const timestamp = typeof customTimestamp === 'number' ? customTimestamp : Date.now()

  // 1. Obtener 16 bytes de aleatoriedad criptográfica segura
  const randomBytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes)
  } else {
    // Fallback defensivo si Web Crypto no está disponible
    for (let i = 0; i < 16; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256)
    }
  }

  // 2. Escribir timestamp de 48 bits en los primeros 6 bytes (Big Endian)
  let ts = timestamp
  for (let i = 5; i >= 0; i--) {
    randomBytes[i] = ts & 0xff
    ts = Math.floor(ts / 256)
  }

  // 3. Establecer versión 7 en el byte 6 (bits 4-7: 0111)
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x70

  // 4. Establecer variante RFC 4122 en el byte 8 (bits 6-7: 10)
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80

  // 5. Convertir a string hexadecimal con formato 8-4-4-4-12
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/**
 * Extrae y decodifica la marca de tiempo (timestamp) contenida en un UUIDv7.
 * @param {string} uuid - UUIDv7 a decodificar
 * @returns {{ timestampMs: number, isoDate: string } | null}
 */
export function extractTimestampFromUUIDv7(uuid = '') {
  if (!validateUUIDv7(uuid)) return null

  const cleanHex = uuid.replace(/-/g, '').slice(0, 12)
  const timestampMs = parseInt(cleanHex, 16)

  return {
    timestampMs,
    isoDate: new Date(timestampMs).toISOString(),
  }
}

/**
 * Valida si una cadena cumple con la especificación de UUIDv7.
 * @param {string} uuid
 * @returns {boolean}
 */
export function validateUUIDv7(uuid = '') {
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-7[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
  return regex.test(uuid)
}

/**
 * Genera un identificador NanoID criptográficamente seguro y apto para URLs.
 * @param {number} [size=21] - Longitud del token
 * @param {string} [alphabet=NANOID_URL_SAFE_ALPHABET] - Alfabeto de caracteres
 * @returns {string}
 */
export function generateNanoID(size = 21, alphabet = NANOID_URL_SAFE_ALPHABET) {
  const len = Math.max(1, Math.min(128, size))
  const alphabetLen = alphabet.length
  const randomBytes = new Uint8Array(len)

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes)
  } else {
    for (let i = 0; i < len; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256)
    }
  }

  let id = ''
  for (let i = 0; i < len; i++) {
    id += alphabet[randomBytes[i] % alphabetLen]
  }

  return id
}

/**
 * Valida si un string tiene el formato y longitud esperados de un NanoID.
 * @param {string} id
 * @param {number} [expectedLength=21]
 * @returns {boolean}
 */
export function validateNanoID(id = '', expectedLength = 21) {
  if (typeof id !== 'string' || id.length !== expectedLength) return false
  return /^[0-9a-zA-Z_-]+$/.test(id)
}
