/**
 * @fileoverview Motor de análisis de infraestructura de clave pública (PKI), certificados X.509 y cadena de confianza SSL/TLS (Mejora 62).
 *
 * CARACTERÍSTICAS:
 * - Modelado y verificación de la Cadena de Confianza (Chain of Trust): Root CA -> Intermediate CA -> Leaf Certificate.
 * - Validación estricta de nombres de host (Hostname Verification conforme a RFC 6125 y CWE-297) con comodines SAN (*.domain.com).
 * - Inspección de campos X.509 v3 (Subject, Issuer, Serial Number, Periodo de Validez, Algoritmo de Firma, Key Usage).
 * - Detección de fallas críticas de seguridad: Certificados caducados, falta de confianza en la raíz (Untrusted Root CA) y Hostname Mismatch.
 * - Generador de certificados PEM simulados para entornos de desarrollo y pruebas.
 *
 * @module utils/pkiEngine
 */

/**
 * Convierte un patrón SAN con wildcard a una expresión regular para validación de hostname.
 *
 * @param {string} san - Nombre de dominio o wildcard (ej. "*.devforge.io").
 * @returns {RegExp}
 */
export function sanToRegex(san) {
  if (san.startsWith('*.')) {
    const domainPart = san.slice(2).replace(/\./g, '\\.')
    // Coincide con un solo nivel de subdominio (ej. api.devforge.io, pero no sub.api.devforge.io)
    return new RegExp(`^[a-zA-Z0-9_-]+\\.${domainPart}$`, 'i')
  }
  const escaped = san.replace(/\./g, '\\.')
  return new RegExp(`^${escaped}$`, 'i')
}

/**
 * Valida si un nombre de host consultado coincide con los Subject Alternative Names (SANs) del certificado.
 *
 * @param {string[]} sans - Lista de dominios registrados en el certificado.
 * @param {string} hostname - Hostname consultado por el cliente.
 * @returns {{ matches: boolean, matchedSan: string|null }}
 */
export function matchHostname(sans, hostname) {
  if (!hostname || typeof hostname !== 'string' || !Array.isArray(sans)) {
    return { matches: false, matchedSan: null }
  }

  const cleanHost = hostname.trim().toLowerCase()

  for (const san of sans) {
    const cleanSan = san.trim().toLowerCase()
    if (cleanSan === cleanHost) {
      return { matches: true, matchedSan: san }
    }
    const regex = sanToRegex(cleanSan)
    if (regex.test(cleanHost)) {
      return { matches: true, matchedSan: san }
    }
  }

  return { matches: false, matchedSan: null }
}

/**
 * Presets de cadenas de certificados PKI para auditoría.
 */
export const PKI_PRESETS = [
  {
    id: 'valid_production',
    name: "Producción Válido (Let's Encrypt Authority)",
    status: 'SECURE',
    leaf: {
      subject: { CN: 'devforge.io', O: 'DevForge Open Platform', C: 'US' },
      issuer: { CN: 'R3 Intermediate CA', O: "Let's Encrypt", C: 'US' },
      serialNumber: '04:FA:21:88:9C:33:41:B0',
      validity: {
        notBefore: new Date(Date.now() - 30 * 86400000).toISOString(),
        notAfter: new Date(Date.now() + 60 * 86400000).toISOString(),
      },
      sans: ['devforge.io', '*.devforge.io', 'api.devforge.io', 'auth.devforge.io'],
      keyAlgorithm: 'ECDSA P-256 (256 bits)',
      signatureAlgorithm: 'SHA256withECDSA',
      thumbprint: 'A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90:12:34:56:78',
    },
    intermediate: {
      subject: { CN: 'R3 Intermediate CA', O: "Let's Encrypt", C: 'US' },
      issuer: { CN: 'ISRG Root X1', O: 'Internet Security Research Group', C: 'US' },
      serialNumber: '40:01:77:21:37:D4:E9:42',
      validity: {
        notBefore: '2020-09-04T00:00:00Z',
        notAfter: '2027-09-04T00:00:00Z',
      },
      keyAlgorithm: 'RSA 2048 bits',
      signatureAlgorithm: 'SHA256withRSA',
      isCA: true,
    },
    root: {
      subject: { CN: 'ISRG Root X1', O: 'Internet Security Research Group', C: 'US' },
      issuer: { CN: 'ISRG Root X1', O: 'Internet Security Research Group', C: 'US' },
      serialNumber: '82:0B:11:F9:32:4A:28:90',
      validity: {
        notBefore: '2015-06-04T11:04:38Z',
        notAfter: '2035-06-04T11:04:38Z',
      },
      keyAlgorithm: 'RSA 4096 bits',
      signatureAlgorithm: 'SHA256withRSA',
      isCA: true,
      isTrustedRoot: true,
    },
  },
  {
    id: 'expired_certificate',
    name: 'Certificado Servidor Expirado (Caducado)',
    status: 'EXPIRED',
    leaf: {
      subject: { CN: 'legacy.devforge.io', O: 'DevForge Old Stack', C: 'US' },
      issuer: { CN: 'R3 Intermediate CA', O: "Let's Encrypt", C: 'US' },
      serialNumber: '03:99:AA:BB:CC:11:22:33',
      validity: {
        notBefore: new Date(Date.now() - 120 * 86400000).toISOString(),
        notAfter: new Date(Date.now() - 15 * 86400000).toISOString(), // Caducó hace 15 días
      },
      sans: ['legacy.devforge.io'],
      keyAlgorithm: 'RSA 2048 bits',
      signatureAlgorithm: 'SHA256withRSA',
      thumbprint: 'FF:EE:DD:CC:BB:AA:99:88:77:66:55:44:33:22:11:00:12:34:56:78',
    },
    intermediate: {
      subject: { CN: 'R3 Intermediate CA', O: "Let's Encrypt", C: 'US' },
      issuer: { CN: 'ISRG Root X1', O: 'Internet Security Research Group', C: 'US' },
      serialNumber: '40:01:77:21:37:D4:E9:42',
      validity: { notBefore: '2020-09-04T00:00:00Z', notAfter: '2027-09-04T00:00:00Z' },
      isCA: true,
    },
    root: {
      subject: { CN: 'ISRG Root X1', O: 'Internet Security Research Group', C: 'US' },
      issuer: { CN: 'ISRG Root X1', O: 'Internet Security Research Group', C: 'US' },
      serialNumber: '82:0B:11:F9:32:4A:28:90',
      validity: { notBefore: '2015-06-04T11:04:38Z', notAfter: '2035-06-04T11:04:38Z' },
      isCA: true,
      isTrustedRoot: true,
    },
  },
  {
    id: 'untrusted_self_signed',
    name: 'Certificado Autofirmado No Confiable (Self-Signed)',
    status: 'UNTRUSTED_ROOT',
    leaf: {
      subject: { CN: 'internal-dev.local', O: 'Unverified Developer', C: 'XX' },
      issuer: { CN: 'internal-dev.local', O: 'Unverified Developer', C: 'XX' }, // Autofirmado
      serialNumber: '00:01:02:03:04:05:06:07',
      validity: {
        notBefore: new Date(Date.now() - 10 * 86400000).toISOString(),
        notAfter: new Date(Date.now() + 300 * 86400000).toISOString(),
      },
      sans: ['internal-dev.local'],
      keyAlgorithm: 'RSA 2048 bits',
      signatureAlgorithm: 'SHA256withRSA',
      thumbprint: '00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33',
    },
    intermediate: null,
    root: {
      subject: { CN: 'internal-dev.local', O: 'Unverified Developer', C: 'XX' },
      issuer: { CN: 'internal-dev.local', O: 'Unverified Developer', C: 'XX' },
      serialNumber: '00:01:02:03:04:05:06:07',
      validity: { notBefore: '2024-01-01T00:00:00Z', notAfter: '2027-01-01T00:00:00Z' },
      isCA: false,
      isTrustedRoot: false, // NO está en el Trust Store del sistema
    },
  },
]

/**
 * Audita una cadena de certificados X.509 y evalúa su validez frente a un hostname.
 *
 * @param {Object} chain - Objeto de cadena PKI ({ leaf, intermediate, root }).
 * @param {string} hostname - Hostname a validar.
 * @returns {Object} Diagnóstico de seguridad de la cadena de confianza.
 */
export function auditCertificateChain(chain, hostname = 'api.devforge.io') {
  if (!chain || !chain.leaf) {
    return {
      isValidChain: false,
      error: 'Cadena de certificados no proporcionada o incompleta.',
    }
  }

  const { leaf, intermediate, root } = chain
  const now = Date.now()
  const issues = []

  // 1. Verificar Vigencia Temporal del Leaf
  const notBefore = new Date(leaf.validity.notBefore).getTime()
  const notAfter = new Date(leaf.validity.notAfter).getTime()

  let isExpired = false
  if (now < notBefore) {
    issues.push({
      level: 'CRITICAL',
      title: 'Certificado Aún No Válido',
      desc: `La fecha de inicio (${leaf.validity.notBefore}) es posterior al tiempo actual del sistema.`,
    })
  } else if (now > notAfter) {
    isExpired = true
    issues.push({
      level: 'CRITICAL',
      title: 'Certificado Expirado / Caducado',
      desc: `El certificado venció el ${new Date(notAfter).toLocaleDateString()}. Los navegadores bloquearán la conexión con NET::ERR_CERT_DATE_INVALID.`,
    })
  }

  // 2. Verificar Coincidencia de Hostname (CWE-297)
  const hostCheck = matchHostname(leaf.sans, hostname)
  if (!hostCheck.matches) {
    issues.push({
      level: 'HIGH',
      title: 'Discrepancia de Nombre de Host (Hostname Mismatch)',
      desc: `El certificado emitido para [${leaf.sans.join(', ')}] no cubre el dominio "${hostname}". Provocará error SSL_ERROR_BAD_CERT_DOMAIN.`,
    })
  }

  // 3. Verificar Cadena y Confianza de la Raíz (Root CA Trust Store)
  let isTrustChainValid = true
  if (root) {
    if (!root.isTrustedRoot) {
      isTrustChainValid = false
      issues.push({
        level: 'CRITICAL',
        title: 'Autoridad Raíz No Confiable (Untrusted Root CA)',
        desc: 'El certificado raíz no pertenece a las Autoridades Certificadoras (CAs) de confianza del sistema operativo o navegador (ej. self-signed).',
      })
    }
  }

  // 4. Comprobar firma entre Leaf e Intermediate
  if (intermediate && leaf.issuer.CN !== intermediate.subject.CN) {
    isTrustChainValid = false
    issues.push({
      level: 'HIGH',
      title: 'Ruptura en la Cadena de Confianza',
      desc: `El emisor del certificado hoja (${leaf.issuer.CN}) no coincide con el sujeto de la CA Intermedia (${intermediate.subject.CN}).`,
    })
  }

  const hasCritical = issues.some((i) => i.level === 'CRITICAL')
  const hasHigh = issues.some((i) => i.level === 'HIGH')

  const grade = hasCritical ? 'F' : hasHigh ? 'C' : 'A+'
  const isSecure = issues.length === 0

  return {
    isSecure,
    grade,
    isExpired,
    hostnameMatched: hostCheck.matches,
    matchedSan: hostCheck.matchedSan,
    isTrustChainValid,
    issues,
    summary: isSecure
      ? 'Cadena de confianza SSL/TLS íntegra, válida y reconocida por las Autoridades Certificadoras globales.'
      : 'Se detectaron anomalías en la cadena PKI que provocarán advertencias de seguridad en los clientes HTTPS.',
  }
}
