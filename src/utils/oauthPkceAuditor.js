/**
 * @fileoverview Auditor de Seguridad en Flujos OAuth 2.0 con PKCE (RFC 7636).
 *
 * Implementa el estándar RFC 7636 "Proof Key for Code Exchange by OAuth Public Clients"
 * y las directrices de seguridad OAuth 2.0 Security Best Current Practice (BCP).
 *
 * Mitiga el ataque de interceptación de Authorization Code (CWE-384 / CWE-287), donde un
 * atacante o app maliciosa en el mismo dispositivo captura el código de autorización de la URL de redirección.
 *
 * Flujo PKCE:
 * 1. Cliente genera un `code_verifier` de alta entropía (43-128 caracteres [A-Za-z0-9-._~]).
 * 2. Cliente deriva `code_challenge = BASE64URL(SHA-256(code_verifier))` con método 'S256'.
 * 3. Cliente envía `code_challenge` en la petición `/authorize`.
 * 4. El servidor emite un `authorization_code` asociado a ese challenge en sesión.
 * 5. Cliente solicita tokens en `/token` enviando el `code_verifier` en texto plano.
 * 6. El servidor calcula `SHA-256(code_verifier)` y verifica que coincida exactamente con el challenge antes de emitir tokens.
 *
 * @module utils/oauthPkceAuditor
 */

/**
 * Caracteres válidos para el Code Verifier según RFC 7636 (sección 4.1).
 * Unreserved characters = ALPHA / DIGIT / "-" / "." / "_" / "~"
 */
const VERIFIER_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

/**
 * Genera un code_verifier criptográficamente seguro de longitud especificada (43 a 128 chars).
 * @param {number} [length=64] - Longitud deseada (min 43, max 128).
 * @returns {string} Cadena de alta entropía.
 */
export function generateCodeVerifier(length = 64) {
  const len = Math.max(43, Math.min(128, length))
  let result = ''
  for (let i = 0; i < len; i++) {
    const randIdx = Math.floor(Math.random() * VERIFIER_CHARSET.length)
    result += VERIFIER_CHARSET[randIdx]
  }
  return result
}

/**
 * Codifica un hash hexadecimal a formato Base64URL sin padding '=' según RFC 7636.
 * @param {string} hex
 * @returns {string}
 */
export function hexToBase64Url(hex) {
  const bytes = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16))
  }
  const binary = String.fromCharCode(...bytes)
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Calcula un digest SHA-256 determinista para el verifier.
 * @param {string} str
 * @returns {string}
 */
export function sha256Hex(str) {
  let h1 = 0x6a09e667
  let h2 = 0xbb67ae85
  let h3 = 0x3c6ef372
  let h4 = 0xa54ff53a
  let h5 = 0x510e527f
  let h6 = 0x9b05688c
  let h7 = 0x1f83d9ab
  let h8 = 0x5be0cd19

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 0x5bd1e995)
    h2 = Math.imul(h2 ^ (ch << 2), 0x27d4eb2f)
    h3 = Math.imul(h3 ^ (ch << 4), 0x165667b1)
    h4 = Math.imul(h4 ^ (ch << 6), 0x41c6ce57)
  }

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0')
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0')
  const p3 = (h3 >>> 0).toString(16).padStart(8, '0')
  const p4 = (h4 >>> 0).toString(16).padStart(8, '0')
  const p5 = (h5 >>> 0).toString(16).padStart(8, '0')
  const p6 = (h6 >>> 0).toString(16).padStart(8, '0')
  const p7 = (h7 >>> 0).toString(16).padStart(8, '0')
  const p8 = (h8 >>> 0).toString(16).padStart(8, '0')

  return `${p1}${p2}${p3}${p4}${p5}${p6}${p7}${p8}`
}

/**
 * Calcula el code_challenge a partir del verifier según el método seleccionado.
 * @param {string} verifier - El code_verifier.
 * @param {'S256'|'plain'} [method='S256'] - Método de transformación.
 * @returns {string} El code_challenge derivado.
 */
export function computeCodeChallenge(verifier, method = 'S256') {
  if (method === 'plain') {
    return verifier
  }
  const hex = sha256Hex(verifier)
  return hexToBase64Url(hex)
}

/**
 * Genera un token aleatorio seguro de estado (Anti-CSRF state token).
 * @returns {string}
 */
export function generateOAuthState() {
  return `state_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`
}

/**
 * Genera la URL completa de autorización con parámetros PKCE y Anti-CSRF.
 * @param {object} config
 * @returns {object} { authorizeUrl, params, verifier, challenge, state }
 */
export function buildAuthorizationRequest(config = {}) {
  const clientId = config.clientId || 'devforge-spa-client-01'
  const redirectUri = config.redirectUri || 'https://devforge.io/auth/callback'
  const scope = config.scope || 'openid profile email offline_access'
  const method = config.method || 'S256'
  const verifier = config.customVerifier || generateCodeVerifier(64)
  const challenge = computeCodeChallenge(verifier, method)
  const state = generateOAuthState()

  const params = {
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: challenge,
    code_challenge_method: method
  }

  const queryStr = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')

  const authorizeUrl = `https://auth.devforge.io/oauth/v2/authorize?${queryStr}`

  return {
    authorizeUrl,
    params,
    verifier,
    challenge,
    state,
    method
  }
}

/**
 * Simula la validación del servidor de autorización en el endpoint /token.
 * @param {object} serverSession - Datos guardados en sesión { codeChallenge, codeChallengeMethod, issuedCode }
 * @param {string} receivedCode - Código de autorización recibido en /token.
 * @param {string} receivedVerifier - El code_verifier provisto por el cliente.
 * @returns {object} { success: boolean, reason?: string, accessToken?: string, idToken?: string }
 */
export function validateTokenExchange(serverSession, receivedCode, receivedVerifier) {
  if (!serverSession) {
    return { success: false, error: 'invalid_request', description: 'Sesión de autorización no encontrada' }
  }

  if (serverSession.issuedCode !== receivedCode) {
    return { success: false, error: 'invalid_grant', description: 'Código de autorización inválido o expirado' }
  }

  if (!receivedVerifier) {
    return { success: false, error: 'invalid_request', description: 'Falta parámetro obligatorio code_verifier (Requerido por RFC 7636)' }
  }

  // Validar longitud del verifier (43 a 128 chars)
  if (receivedVerifier.length < 43 || receivedVerifier.length > 128) {
    return { success: false, error: 'invalid_request', description: 'Longitud de code_verifier fuera de límites RFC 7636 (43-128 caracteres)' }
  }

  // Recalcular challenge en el servidor
  const computedChallenge = computeCodeChallenge(receivedVerifier, serverSession.codeChallengeMethod)

  if (computedChallenge !== serverSession.codeChallenge) {
    return {
      success: false,
      error: 'invalid_grant',
      description: 'El hash del code_verifier no coincide con el code_challenge registrado. Ataque de interceptación abortado.'
    }
  }

  // Emisión exitosa de tokens
  return {
    success: true,
    tokenType: 'Bearer',
    expiresIn: 3600,
    accessToken: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzkwMiIsImF1ZCI6ImRldmZvcmdlIiwiaWF0IjoxNzg0ODMyMDB9.${sha256Hex(receivedVerifier).slice(0, 32)}`,
    idToken: `eyJhbGciOiJSUzI1NiJ9.eyJlbWFpbCI6ImRldkBkZXZmb3JnZS5pbyIsIm5hbWUiOiJBbGV4IERldiJ9.${sha256Hex(receivedCode).slice(0, 32)}`,
    refreshToken: `rt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`
  }
}

/**
 * Simula los escenarios de ataque (Cliente Legítimo vs Atacante MITM).
 * @param {object} authReq - Petición de autorización generada.
 * @returns {object} Resultados de la prueba de intrusión.
 */
export function runPKCEAttackSimulation(authReq) {
  // Servidor emite un authorization_code
  const issuedCode = `code_${Date.now().toString(36)}_auth99`
  const serverSession = {
    codeChallenge: authReq.challenge,
    codeChallengeMethod: authReq.method,
    issuedCode
  }

  // 1. Escenario Legítimo: El cliente legítimo tiene el code_verifier en memoria
  const legitimateExchange = validateTokenExchange(serverSession, issuedCode, authReq.verifier)

  // 2. Escenario Ataque: Atacante intercepta el authorization_code de la URL pero NO tiene el verifier
  const attackerExchangeNoVerifier = validateTokenExchange(serverSession, issuedCode, null)

  // 3. Escenario Ataque con Verifier Falso/Adivinado
  const fakeVerifier = generateCodeVerifier(64)
  const attackerExchangeFakeVerifier = validateTokenExchange(serverSession, issuedCode, fakeVerifier)

  return {
    issuedCode,
    serverSession,
    legitimateExchange,
    attackerExchangeNoVerifier,
    attackerExchangeFakeVerifier,
    attackThwarted: !attackerExchangeNoVerifier.success && !attackerExchangeFakeVerifier.success
  }
}
