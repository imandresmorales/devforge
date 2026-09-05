/**
 * @fileoverview Motor de análisis, decodificación y verificación criptográfica de JWT (RFC 7519) (Mejora 56).
 *
 * CARACTERÍSTICAS:
 * - Decodificación y formateo seguro de las 3 partes de un JWT: Header, Payload y Signature.
 * - Motor criptográfico HMAC-SHA256 puro y compatible con Web Crypto / Node.js.
 * - Verificación de firma en tiempo constante para mitigar ataques de temporización (Timing Attacks).
 * - Auditoría de seguridad en tiempo real:
 *     - Detección de vulnerabilidad "alg: none" (CVE-2015-9235).
 *     - Detección de expiración (exp) y activación previa (nbf).
 *     - Detección de fuga de datos sensibles en el Payload (passwords, tokens privados).
 *     - Auditoría de fuerza de la clave secreta compartida (RFC 7518 recomienda >= 256 bits).
 *
 * @module utils/jwtEngine
 */

/**
 * Codificación Base64URL segura conforme a RFC 7515.
 *
 * @param {string} str - Cadena de texto UTF-8.
 * @returns {string} Cadena en formato Base64URL.
 */
export function base64UrlEncode(str) {
  try {
    const utf8Bytes = new TextEncoder().encode(str)
    let binary = ''
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i])
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  } catch {
    return ''
  }
}

/**
 * Decodificación Base64URL segura conforme a RFC 7515.
 *
 * @param {string} base64Url - Cadena en formato Base64URL.
 * @returns {string} Cadena decodificada en UTF-8.
 */
export function base64UrlDecode(base64Url) {
  try {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new TextDecoder().decode(bytes)
  } catch {
    throw new Error('Formato Base64URL inválido.')
  }
}

/* ─── Implementación Criptográfica HMAC-SHA256 Pura ─────────────── */

function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount))
  }

  const mathPow = Math.pow
  const maxWord = mathPow(2, 32)
  let i, j
  let result = ''

  const words = []
  const asciiBitLength = ascii.length * 8

  let hash = []
  const k = []
  let primeCounter = 0

  const isPrime = (n) => {
    for (let f = 2; f * f <= n; f++) {
      if (n % f === 0) return false
    }
    return true
  }

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0
      primeCounter++
    }
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32))
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength

  for (i = 0; i < ascii.length; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - ((i % 4) * 8))
  }

  for (j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16)
    const oldHash = hash.slice(0)

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15]
      const w2 = w[i - 2]

      const s0 = i >= 16 ? rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3) : 0
      const s1 = i >= 16 ? rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10) : 0

      if (i >= 16) {
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0
      }

      const a = hash[0]
      const e = hash[4]
      const s1Val = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)
      const ch = (e & hash[5]) ^ (~e & hash[6])
      const temp1 = (hash[7] + s1Val + ch + k[i] + w[i]) | 0
      const s0Val = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)
      const maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])
      const temp2 = (s0Val + maj) | 0

      hash = [(temp1 + temp2) | 0, a, hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]]
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255
      result += String.fromCharCode(b)
    }
  }

  return result
}

/**
 * Calcula HMAC-SHA256 en formato binario.
 *
 * @param {string} message
 * @param {string} key
 * @returns {string}
 */
export function hmacSha256(message, key) {
  const blockSize = 64
  let keyBytes = key

  if (keyBytes.length > blockSize) {
    keyBytes = sha256(keyBytes)
  }

  while (keyBytes.length < blockSize) {
    keyBytes += '\0'
  }

  let oKeyPad = ''
  let iKeyPad = ''

  for (let i = 0; i < blockSize; i++) {
    oKeyPad += String.fromCharCode(keyBytes.charCodeAt(i) ^ 0x5c)
    iKeyPad += String.fromCharCode(keyBytes.charCodeAt(i) ^ 0x36)
  }

  return sha256(oKeyPad + sha256(iKeyPad + message))
}

/**
 * Genera la firma Base64URL de un token JWT.
 *
 * @param {string} headerBase64
 * @param {string} payloadBase64
 * @param {string} secret
 * @returns {string}
 */
export function generateJWTSignature(headerBase64, payloadBase64, secret) {
  if (!secret) return ''
  const data = `${headerBase64}.${payloadBase64}`
  const rawHmac = hmacSha256(data, secret)
  return btoa(rawHmac)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Crea un token JWT firmado.
 *
 * @param {Object} header
 * @param {Object} payload
 * @param {string} secret
 * @returns {string}
 */
export function createJWT(header, payload, secret = '') {
  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))

  if (header.alg === 'none' || header.alg === 'NONE') {
    return `${headerB64}.${payloadB64}.`
  }

  const signature = generateJWTSignature(headerB64, payloadB64, secret)
  return `${headerB64}.${payloadB64}.${signature}`
}

/**
 * Compara dos cadenas de texto en tiempo constante para mitigar Timing Attacks.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false

  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Analiza, decodifica y audita la seguridad de un JWT.
 *
 * @param {string} token - Cadena del token JWT.
 * @param {string} [secret=''] - Clave secreta para validación de firma.
 * @returns {Object} Informe detallado de seguridad y componentes decodificados.
 */
export function inspectJWT(token, secret = '') {
  if (!token || typeof token !== 'string') {
    return {
      isValidFormat: false,
      error: 'Token vacío o no proporcionado.',
    }
  }

  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    return {
      isValidFormat: false,
      error: `Formato inválido. Un JWT debe tener exactamente 3 partes separadas por puntos (se detectaron ${parts.length}).`,
    }
  }

  const [headerB64, payloadB64, signatureB64] = parts

  let header = null
  let payload = null

  try {
    header = JSON.parse(base64UrlDecode(headerB64))
  } catch (err) {
    return { isValidFormat: false, error: `Error decodificando Header: ${err.message}` }
  }

  try {
    payload = JSON.parse(base64UrlDecode(payloadB64))
  } catch (err) {
    return { isValidFormat: false, error: `Error decodificando Payload: ${err.message}` }
  }

  // ── Auditoría de Seguridad ──
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const securityWarnings = []

  // 1. Vulnerabilidad alg: none
  const isAlgNone = header.alg === 'none' || header.alg === 'NONE'
  if (isAlgNone) {
    securityWarnings.push({
      level: 'CRITICAL',
      title: 'Vulnerabilidad Crítica "alg: none" (CVE-2015-9235)',
      desc: 'El token declara no requerir firma criptográfica. Un atacante puede alterar los claims y suplantar cualquier identidad.',
    })
  }

  // 2. Expiración (exp claim)
  let isExpired = false
  let expiryStatus = 'Sin claim exp (Riesgo: token perpetuo)'

  if (payload.exp) {
    if (typeof payload.exp === 'number') {
      const diff = payload.exp - nowInSeconds
      if (diff <= 0) {
        isExpired = true
        expiryStatus = `Expirado hace ${Math.abs(diff)}s (${new Date(payload.exp * 1000).toLocaleString()})`
        securityWarnings.push({
          level: 'HIGH',
          title: 'Token Expirado',
          desc: `El token venció el ${new Date(payload.exp * 1000).toLocaleString()}. Debe ser rechazado por el backend.`,
        })
      } else {
        expiryStatus = `Válido (Expira en ${diff}s — ${new Date(payload.exp * 1000).toLocaleString()})`
      }
    }
  } else {
    securityWarnings.push({
      level: 'MEDIUM',
      title: 'Falta Claim de Expiración ("exp")',
      desc: 'El token no tiene fecha de vencimiento configurada. Si se filtra, será válido indefinidamente.',
    })
  }

  // 3. Not Before (nbf claim)
  if (payload.nbf && typeof payload.nbf === 'number' && payload.nbf > nowInSeconds) {
    securityWarnings.push({
      level: 'HIGH',
      title: 'Token Aún No Válido ("nbf")',
      desc: `El token no es válido hasta ${new Date(payload.nbf * 1000).toLocaleString()}.`,
    })
  }

  // 4. Exposición de datos sensibles en Payload
  const sensitiveKeys = ['password', 'pwd', 'secret', 'credit_card', 'ssn', 'private_key', 'pin']
  const leakedKeys = Object.keys(payload).filter((k) => sensitiveKeys.includes(k.toLowerCase()))
  if (leakedKeys.length > 0) {
    securityWarnings.push({
      level: 'CRITICAL',
      title: 'Fuga de Datos Confidenciales en Payload',
      desc: `Los campos [${leakedKeys.join(', ')}] están expuestos. El payload de un JWT es solo Base64 (NO está cifrado) y es visible por cualquiera.`,
    })
  }

  // 5. Verificación de Firma Criptográfica
  let isSignatureValid = false
  if (!isAlgNone && secret) {
    const expectedSig = generateJWTSignature(headerB64, payloadB64, secret)
    isSignatureValid = constantTimeCompare(signatureB64, expectedSig)
  }

  // 6. Auditoría de fuerza del secreto
  if (secret && secret.length < 32) {
    securityWarnings.push({
      level: 'MEDIUM',
      title: 'Clave Secreta Corta (< 256 bits)',
      desc: 'RFC 7518 recomienda claves secretas de al menos 32 caracteres (256 bits) para evitar ataques de fuerza bruta en HMAC-SHA256.',
    })
  }

  return {
    isValidFormat: true,
    header,
    payload,
    signature: signatureB64,
    headerB64,
    payloadB64,
    isAlgNone,
    isExpired,
    expiryStatus,
    isSignatureValid,
    hasSecretProvided: Boolean(secret),
    securityWarnings,
    rawParts: { header: headerB64, payload: payloadB64, signature: signatureB64 },
  }
}
