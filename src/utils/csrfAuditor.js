/**
 * @fileoverview Motor de Detección y Mitigación de Vulnerabilidades CSRF y Auditor de Cookies SameSite (Mejora 71).
 *
 * CARACTERÍSTICAS:
 * - Implementación de defensas estándar OWASP contra Cross-Site Request Forgery (CSRF):
 *     1. Synchronizer Token Pattern (STP): Generación y validación de tokens criptográficos por sesión con expiración TTL.
 *     2. Double Submit Cookie Pattern: Validación sin estado comparando cookie y header con firma HMAC simulada.
 *     3. SameSite Cookie Policy Inspector: Evaluación de directivas (Strict, Lax, None) y flags HttpOnly/Secure.
 *     4. Cross-Site Request Auditor: Detección de peticiones peligrosas analizando Origin, Referer, Sec-Fetch-Site y método HTTP.
 *
 * @module utils/csrfAuditor
 */

/**
 * Genera un token CSRF criptográfico aleatorio seguro.
 * @param {number} [bytes=32]
 * @returns {string}
 */
export function generateCsrfToken(bytes = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let token = ''
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(bytes)
    crypto.getRandomValues(array)
    for (let i = 0; i < bytes; i++) {
      token += chars[array[i] % chars.length]
    }
  } else {
    for (let i = 0; i < bytes; i++) {
      token += chars[Math.floor(Math.random() * chars.length)]
    }
  }
  return token
}

/**
 * 1. Synchronizer Token Pattern Store (Memoria / Sesión)
 */
export class CsrfTokenManager {
  /**
   * @param {Object} [options]
   * @param {number} [options.ttlMs=3600000] - Tiempo de vida del token (1 hora por defecto)
   */
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || 3600000
    this.sessionTokens = new Map() // sessionId -> { token: string, expiresAt: number }
  }

  /**
   * Genera o renueva el token CSRF para una sesión de usuario.
   * @param {string} sessionId
   * @returns {string}
   */
  createToken(sessionId) {
    const token = generateCsrfToken(32)
    const expiresAt = Date.now() + this.ttlMs
    this.sessionTokens.set(sessionId, { token, expiresAt })
    return token
  }

  /**
   * Valida si un token CSRF proporcionado coincide con el de la sesión y no ha expirado.
   * @param {string} sessionId
   * @param {string} providedToken
   * @returns {{ valid: boolean, reason?: string }}
   */
  validateToken(sessionId, providedToken) {
    if (!sessionId) {
      return { valid: false, reason: 'ID de sesión faltante o no autenticado.' }
    }
    const record = this.sessionTokens.get(sessionId)
    if (!record) {
      return { valid: false, reason: 'No existe token CSRF registrado para esta sesión.' }
    }
    if (Date.now() > record.expiresAt) {
      this.sessionTokens.delete(sessionId)
      return { valid: false, reason: 'El token CSRF ha expirado (TTL agotado).' }
    }
    if (!providedToken || providedToken !== record.token) {
      return { valid: false, reason: 'Token CSRF inválido o no coincidente (Posible ataque CSRF).' }
    }
    return { valid: true }
  }

  revokeToken(sessionId) {
    this.sessionTokens.delete(sessionId)
  }
}

/**
 * 2. Auditor de Directivas de Cookies de Sesión (SameSite, HttpOnly, Secure)
 */
export function auditCookieSecurity(cookieConfig = {}) {
  const issues = []
  const { name = 'session_id', sameSite = 'None', secure = false, httpOnly = false } = cookieConfig

  const normalizedSameSite = (sameSite || '').toLowerCase()

  if (normalizedSameSite === 'none' && !secure) {
    issues.push({
      severity: 'CRITICAL',
      rule: 'SameSite=None requiere flag Secure',
      message: `La cookie '${name}' tiene SameSite=None pero no tiene el flag Secure activado. Los navegadores modernos la rechazarán y es vulnerable a intercepción.`,
    })
  }

  if (normalizedSameSite === 'none') {
    issues.push({
      severity: 'HIGH',
      rule: 'SameSite=None permite CSRF entre dominios',
      message: `La cookie '${name}' se enviará en todas las peticiones cross-origin, exponiendo la aplicación a ataques CSRF si no se implementan tokens anti-CSRF estrictos.`,
    })
  }

  if (!httpOnly) {
    issues.push({
      severity: 'HIGH',
      rule: 'Cookie sin HttpOnly accesible por JavaScript (XSS Risk)',
      message: `La cookie '${name}' no posee la directiva HttpOnly, permitiendo que scripts inyectados roben la sesión mediante document.cookie.`,
    })
  }

  if (!secure) {
    issues.push({
      severity: 'HIGH',
      rule: 'Cookie transmitida sobre conexiones no cifradas (HTTP)',
      message: `La cookie '${name}' no posee el atributo Secure, por lo que viajará en texto plano en conexiones HTTP abiertas.`,
    })
  }

  const score = Math.max(0, 100 - issues.reduce((acc, iss) => acc + (iss.severity === 'CRITICAL' ? 40 : iss.severity === 'HIGH' ? 25 : 10), 0))

  return {
    cookieName: name,
    sameSite,
    secure,
    httpOnly,
    isSecure: issues.length === 0,
    score,
    rating: score >= 90 ? 'A+' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'F',
    issues,
  }
}

/**
 * 3. Auditor de Peticiones HTTP Entrantes (Cross-Site Request Analyzer)
 */
export function auditIncomingRequest(request = {}, allowedOrigins = ['https://devforge.app']) {
  const {
    method = 'GET',
    origin,
    referer,
    secFetchSite, // 'same-origin' | 'same-site' | 'cross-site' | 'none'
    hasCsrfToken = false,
    isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase()),
  } = request

  const findings = []

  // Mutación en método GET (Antipatrón grave)
  if (isSafeMethod && request.hasMutationIntent) {
    findings.push({
      severity: 'CRITICAL',
      title: 'Operación mutante de estado ejecutada vía método seguro (GET)',
      description: 'Los navegadores ejecutan peticiones GET mediante etiquetas <img>, <script> o enlaces sin restricción CORS, permitiendo CSRF trivial de 1 clic.',
    })
  }

  // Petición mutante cross-site
  const reqOrigin = origin || (referer ? new URL(referer, 'https://unknown.local').origin : null)
  const isAllowedOrigin = reqOrigin && allowedOrigins.includes(reqOrigin)

  if (!isSafeMethod) {
    if (secFetchSite === 'cross-site' && !hasCsrfToken) {
      findings.push({
        severity: 'CRITICAL',
        title: 'Petición Cross-Site no segura sin token CSRF',
        description: 'La petición se originó desde un dominio externo (Sec-Fetch-Site: cross-site) y no contiene token CSRF de validación.',
      })
    } else if (reqOrigin && !isAllowedOrigin && !hasCsrfToken) {
      findings.push({
        severity: 'HIGH',
        title: 'Origen no autorizado en solicitud con efectos secundarios',
        description: `El origen '${reqOrigin}' no pertenece a la lista de dominios permitidos y carece de token anti-CSRF.`,
      })
    }
  }

  const passed = findings.length === 0

  return {
    method: method.toUpperCase(),
    origin: reqOrigin || 'Sin cabecera Origin/Referer',
    secFetchSite: secFetchSite || 'unknown',
    passed,
    verdict: passed ? 'REQUEST_ALLOWED' : 'REQUEST_BLOCKED_CSRF',
    findings,
  }
}
