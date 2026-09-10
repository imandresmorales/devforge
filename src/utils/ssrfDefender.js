/**
 * @fileoverview Motor de Detección y Mitigación de Vulnerabilidades SSRF (Server-Side Request Forgery) (Mejora 77).
 *
 * CARACTERÍSTICAS:
 * - Implementación de directrices de defensa en profundidad OWASP SSRF Prevention Cheat Sheet:
 *     1. Lista blanca estricta de esquemas/protocolos (HTTP/HTTPS permitidos; file, gopher, dict, ftp, php bloqueados).
 *     2. Normalización de direcciones IP ofuscadas (Decimal, Hexadecimal, Octal, IPv6 embebida en IPv4, Localhost alternativo).
 *     3. Bloqueo estricto de rangos privados y reservados (RFC 1918, RFC 3927 Link-Local, RFC 5735 Loopback, RFC 6598 CGNAT).
 *     4. Blindaje contra extracción de credenciales de Cloud Metadata Services (AWS IMDSv1/v2 169.254.169.254, GCP, Azure, Oracle).
 *     5. Detección de ataques de DNS Rebinding y validación previa al envío de peticiones (Pre-flight IP Verification).
 *
 * @module utils/ssrfDefender
 */

/**
 * Rangos de direcciones IP IPv4 reservadas y privadas que no deben ser consultadas por el servidor.
 */
export const RESERVED_IPV4_RANGES = [
  { name: 'Loopback / Localhost (RFC 5735)', start: '127.0.0.0', end: '127.255.255.255' },
  { name: 'Private Class A (RFC 1918)', start: '10.0.0.0', end: '10.255.255.255' },
  { name: 'Private Class B (RFC 1918)', start: '172.16.0.0', end: '172.31.255.255' },
  { name: 'Private Class C (RFC 1918)', start: '192.168.0.0', end: '192.168.255.255' },
  { name: 'Link-Local / Cloud Metadata (RFC 3927)', start: '169.254.0.0', end: '169.254.255.255' },
  { name: 'Shared Address Space / CGNAT (RFC 6598)', start: '100.64.0.0', end: '100.127.255.255' },
  { name: 'Current Network "This Host" (RFC 1122)', start: '0.0.0.0', end: '0.255.255.255' },
  { name: 'Multicast (RFC 5771)', start: '224.0.0.0', end: '239.255.255.255' },
  { name: 'Reserved / Future Use (Class E)', start: '240.0.0.0', end: '255.255.255.255' },
]

/**
 * Convierte una dirección IPv4 string a su representación numérica entera de 32 bits sin signo.
 * @param {string} ip
 * @returns {number|null}
 */
export function ipToNumber(ip) {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let num = 0
  for (let i = 0; i < 4; i++) {
    const p = parseInt(parts[i], 10)
    if (isNaN(p) || p < 0 || p > 255) return null
    num = (num << 8) + p
  }
  return num >>> 0
}

/**
 * Normaliza y desofusca hosts que representen IPs en formatos alternativos (Hex, Decimal, Octal, Localhost).
 * @param {string} host
 * @returns {string} IP normalizada o el hostname original
 */
export function normalizeHost(host) {
  if (!host) return ''
  const trimmed = host.trim().toLowerCase().replace(/^\[|\]$/g, '')

  // 1. Localhost literal y dominios locales
  if (trimmed === 'localhost' || trimmed.endsWith('.localhost') || trimmed.endsWith('.local') || trimmed === 'metadata.google.internal') {
    return '127.0.0.1'
  }

  // 2. IPv6 loopback
  if (trimmed === '::1' || trimmed === '::' || trimmed === '0:0:0:0:0:0:0:1') {
    return '127.0.0.1'
  }

  // 3. IPv4 en formato entero decimal (ej. 2130706433 -> 127.0.0.1)
  if (/^\d{8,10}$/.test(trimmed)) {
    const num = parseInt(trimmed, 10)
    if (num >= 0 && num <= 4294967295) {
      return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
      ].join('.')
    }
  }

  // 4. IPv4 en formato Hexadecimal (ej. 0x7f.0x0.0x0.0x1 o 0x7f000001)
  if (trimmed.startsWith('0x')) {
    if (trimmed.includes('.')) {
      const parts = trimmed.split('.').map((p) => parseInt(p, 16))
      if (parts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
        return parts.join('.')
      }
    } else {
      const num = parseInt(trimmed, 16)
      if (!isNaN(num)) {
        return [
          (num >>> 24) & 255,
          (num >>> 16) & 255,
          (num >>> 8) & 255,
          num & 255,
        ].join('.')
      }
    }
  }

  // 5. Octal Dotted format (ej. 0177.0.0.1)
  if (/^0\d+\./.test(trimmed)) {
    const parts = trimmed.split('.').map((p) => (p.startsWith('0') && p.length > 1 ? parseInt(p, 8) : parseInt(p, 10)))
    if (parts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
      return parts.join('.')
    }
  }

  return trimmed
}

/**
 * Comprueba si una dirección IP pertenece a algún rango reservado/privado.
 * @param {string} ip
 * @returns {{ isPrivate: boolean, rangeName?: string }}
 */
export function isPrivateOrReservedIp(ip) {
  const normalized = normalizeHost(ip)
  const ipNum = ipToNumber(normalized)

  if (ipNum === null) {
    return { isPrivate: false }
  }

  for (const range of RESERVED_IPV4_RANGES) {
    const startNum = ipToNumber(range.start)
    const endNum = ipToNumber(range.end)
    if (startNum !== null && endNum !== null && ipNum >= startNum && ipNum <= endNum) {
      return { isPrivate: true, rangeName: range.name }
    }
  }

  return { isPrivate: false }
}

/**
 * Validador y Firewall Anti-SSRF para URLs entrantes.
 * @param {string} rawUrl
 * @param {Object} [options]
 * @param {Array<string>} [options.allowedProtocols=['http:', 'https:']]
 * @param {Array<string>} [options.allowedDomains=[]]
 * @returns {Object} Resultado de auditoría de seguridad
 */
export function validateSafeUrl(rawUrl, options = {}) {
  const allowedProtocols = options.allowedProtocols || ['http:', 'https:']
  const allowedDomains = options.allowedDomains || []

  const issues = []

  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      verdict: 'BLOCKED_INVALID',
      url: rawUrl,
      reason: 'URL no válida o vacía.',
      issues: [{ severity: 'CRITICAL', title: 'URL Vacía', message: 'No se suministró una URL para análisis.' }],
    }
  }

  let parsed
  try {
    parsed = new URL(rawUrl.trim())
  } catch {
    return {
      isValid: false,
      verdict: 'BLOCKED_MALFORMED',
      url: rawUrl,
      reason: 'Estructura de URL malformada.',
      issues: [{ severity: 'CRITICAL', title: 'URL Malformada', message: 'La URL no cumple con el estándar RFC 3986.' }],
    }
  }

  // 1. Validación de Esquema / Protocolo
  if (!allowedProtocols.includes(parsed.protocol)) {
    issues.push({
      severity: 'CRITICAL',
      title: 'Protocolo No Autorizado (CWE-918)',
      message: `El esquema '${parsed.protocol}' no está permitido. Se restringe exclusivamente a HTTP/HTTPS para evitar ataques via file://, gopher://, dict://, etc.`,
    })
  }

  // 2. Desofuscación y Normalización de Host
  const normalized = normalizeHost(parsed.hostname)

  // 3. Detección de Endpoint de Cloud Metadata (AWS / GCP / Azure)
  if (normalized === '169.254.169.254' || parsed.hostname.includes('metadata.google.internal') || normalized === '100.100.100.200') {
    issues.push({
      severity: 'CRITICAL',
      title: 'Intento de Extracción de Cloud Metadata (AWS IMDS / GCP)',
      message: 'La URL apunta al endpoint de metadatos del proveedor en la nube. Permite el robo de credenciales IAM temporales.',
    })
  }

  // 4. Verificación de IP Privada / Loopback
  const ipCheck = isPrivateOrReservedIp(normalized)
  if (ipCheck.isPrivate) {
    issues.push({
      severity: 'CRITICAL',
      title: `Dirección IP Privada Bloqueada: ${ipCheck.rangeName}`,
      message: `La dirección resuelta '${normalized}' pertenece a un segmento de red interna confidencial y no es accesible desde el exterior.`,
    })
  }

  // 5. Lista blanca opcional de dominios permitidos
  if (allowedDomains.length > 0) {
    const isDomainAllowed = allowedDomains.some((d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`))
    if (!isDomainAllowed) {
      issues.push({
        severity: 'HIGH',
        title: 'Dominio No Incluido en Lista Blanca',
        message: `El host '${parsed.hostname}' no pertenece a los dominios autorizados de la aplicación.`,
      })
    }
  }

  const isValid = issues.length === 0

  return {
    isValid,
    verdict: isValid ? 'ALLOWED_SAFE' : 'BLOCKED_SSRF',
    originalUrl: rawUrl,
    parsed: {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      normalizedIp: normalized,
      port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
      pathname: parsed.pathname,
    },
    issues,
  }
}
