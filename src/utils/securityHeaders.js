/**
 * @fileoverview Motor de auditoría y análisis de cabeceras de seguridad HTTP conforme a OWASP (Mejora 53).
 *
 * CARACTERÍSTICAS:
 * - Evaluación de 8 cabeceras de seguridad clave: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP.
 * - Algoritmo de ponderación y calificación de grado (A+, A, B, C, D, F).
 * - Detección de directivas débiles o faltantes con recomendaciones de remediación.
 * - Generador de snippets de configuración listos para producción para Express.js (Helmet), Next.js y Nginx.
 *
 * @module utils/securityHeaders
 */

export const SECURITY_HEADER_RULES = [
  {
    key: 'Content-Security-Policy',
    weight: 25,
    name: 'Content Security Policy (CSP)',
    category: 'XSS & Data Injection',
    recommended: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
    description: 'Mitiga vulnerabilidades de Cross-Site Scripting (XSS) e inyección de datos restringiendo los orígenes de recursos.',
    validate: (val) => {
      if (!val) return { status: 'MISSING', score: 0, reason: 'Cabecera ausente. El sitio es vulnerable a inyecciones XSS no controladas.' }
      if (val.includes("'unsafe-eval'")) return { status: 'WEAK', score: 12, reason: "Uso de 'unsafe-eval' debilita drásticamente la protección contra ejecución de scripts arbitrarios." }
      return { status: 'SECURE', score: 25, reason: 'Política CSP configurada adecuadamente.' }
    },
  },
  {
    key: 'Strict-Transport-Security',
    weight: 20,
    name: 'HTTP Strict Transport Security (HSTS)',
    category: 'Transport Layer Security',
    recommended: 'max-age=63072000; includeSubDomains; preload',
    description: 'Fuerza a los navegadores a interactuar exclusivamente a través de HTTPS, mitigando ataques Man-in-the-Middle y SSL Stripping.',
    validate: (val) => {
      if (!val) return { status: 'MISSING', score: 0, reason: 'Cabecera ausente. Permite conexiones degradadas a HTTP plano.' }
      const maxAgeMatch = val.match(/max-age=(\d+)/i)
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0
      if (maxAge < 10368000) return { status: 'WEAK', score: 10, reason: 'max-age es menor a 120 días (recomendado mínimo 1 año / 31536000s).' }
      return { status: 'SECURE', score: 20, reason: 'HSTS configurado con tiempo de vida estricto.' }
    },
  },
  {
    key: 'X-Frame-Options',
    weight: 15,
    name: 'X-Frame-Options',
    category: 'Clickjacking Defense',
    recommended: 'DENY',
    description: 'Indica si el navegador puede renderizar la página dentro de un <frame>, <iframe> o <object> para evitar Clickjacking (CWE-1021).',
    validate: (val) => {
      if (!val) return { status: 'MISSING', score: 0, reason: 'Cabecera ausente. La web puede ser embebida en iframes maliciosos.' }
      const upper = val.toUpperCase().trim()
      if (upper === 'DENY' || upper === 'SAMEORIGIN') return { status: 'SECURE', score: 15, reason: `Configuración segura (${upper}).` }
      return { status: 'WEAK', score: 5, reason: 'Valor no recomendado o directiva obsoleta (ALLOW-FROM).' }
    },
  },
  {
    key: 'X-Content-Type-Options',
    weight: 10,
    name: 'X-Content-Type-Options',
    category: 'MIME Sniffing',
    recommended: 'nosniff',
    description: 'Previene que el navegador intente adivinar (MIME-sniff) el tipo de contenido más allá del header Content-Type declarado.',
    validate: (val) => {
      if (!val) return { status: 'MISSING', score: 0, reason: 'Cabecera ausente. Permite ataques de confusión de tipo MIME.' }
      if (val.trim().toLowerCase() === 'nosniff') return { status: 'SECURE', score: 10, reason: 'Protección nosniff activa.' }
      return { status: 'WEAK', score: 2, reason: "Valor inválido. Debe ser exactamente 'nosniff'." }
    },
  },
  {
    key: 'Referrer-Policy',
    weight: 10,
    name: 'Referrer-Policy',
    category: 'Information Leakage',
    recommended: 'strict-origin-when-cross-origin',
    description: 'Controla cuánta información de referencia (URL del remitente) se incluye en las solicitudes salientes.',
    validate: (val) => {
      if (!val) return { status: 'MISSING', score: 0, reason: 'Cabecera ausente. Las URLs completas pueden filtrarse en solicitudes salientes.' }
      const secureValues = ['no-referrer', 'strict-origin-when-cross-origin', 'same-origin', 'strict-origin']
      if (secureValues.includes(val.trim().toLowerCase())) return { status: 'SECURE', score: 10, reason: `Directiva segura (${val}).` }
      return { status: 'WEAK', score: 4, reason: 'Directiva permisiva (ej. unsafe-url) que puede exponer tokens o datos en URLs.' }
    },
  },
  {
    key: 'Permissions-Policy',
    weight: 10,
    name: 'Permissions-Policy',
    category: 'Hardware & Browser Features',
    recommended: 'camera=(), microphone=(), geolocation=(), payment=()',
    description: 'Restringe el acceso a APIs sensibles del navegador como cámara, micrófono, geolocalización y acelerómetro.',
    validate: (val) => {
      if (!val) return { status: 'MISSING', score: 0, reason: 'Cabecera ausente. APIs de hardware abiertas por defecto.' }
      return { status: 'SECURE', score: 10, reason: 'Restricción de permisos y APIs de hardware configurada.' }
    },
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    weight: 5,
    name: 'Cross-Origin-Opener-Policy (COOP)',
    category: 'Cross-Origin Isolation',
    recommended: 'same-origin',
    description: 'Aísla el contexto de navegación de la pestaña para mitigar ataques tipo Spectre / XS-Leaks.',
    validate: (val) => {
      if (!val) return { status: 'MISSING', score: 0, reason: 'Cabecera ausente. Permite compartir contexto con ventanas emergentes.' }
      return { status: 'SECURE', score: 5, reason: 'Aislamiento de contexto de navegación activo.' }
    },
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    weight: 5,
    name: 'Cross-Origin-Resource-Policy (CORP)',
    category: 'Cross-Origin Isolation',
    recommended: 'same-origin',
    description: 'Bloquea la lectura de recursos (imágenes, scripts, respuestas) por parte de otros orígenes.',
    validate: (val) => {
      if (!val) return { status: 'MISSING', score: 0, reason: 'Cabecera ausente. Recursos legibles por otros orígenes sin restricción.' }
      return { status: 'SECURE', score: 5, reason: 'Protección de recursos entre orígenes activa.' }
    },
  },
]

export const PRESET_HEADER_CONFIGS = [
  {
    id: 'devforge_secure',
    name: '🛡️ DevForge Production (Calificación A+)',
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  },
  {
    id: 'legacy_vulnerable',
    name: '⚠️ Servidor Legacy Vulnerable (Calificación F)',
    headers: {
      'X-Content-Type-Options': 'nosniff',
    },
  },
  {
    id: 'api_standard',
    name: '⚡ API REST Estándar (Calificación B)',
    headers: {
      'Strict-Transport-Security': 'max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  },
]

/**
 * Evalúa un objeto de cabeceras HTTP y genera un informe de auditoría con puntuación.
 *
 * @param {Record<string, string>} headers - Objeto clave/valor de cabeceras
 * @returns {{ score: number, grade: string, results: Array<Object>, missingCount: number, secureCount: number, weakCount: number }}
 */
export function auditSecurityHeaders(headers = {}) {
  // Normalizar claves a minúsculas para búsqueda insensible a mayúsculas
  const normalized = {}
  Object.entries(headers).forEach(([k, v]) => {
    if (k && v !== undefined) normalized[k.toLowerCase().trim()] = String(v).trim()
  })

  let totalScore = 0
  let missingCount = 0
  let weakCount = 0
  let secureCount = 0

  const results = SECURITY_HEADER_RULES.map((rule) => {
    const val = normalized[rule.key.toLowerCase()]
    const evalRes = rule.validate(val)

    totalScore += evalRes.score

    if (evalRes.status === 'SECURE') secureCount++
    else if (evalRes.status === 'WEAK') weakCount++
    else missingCount++

    return {
      key: rule.key,
      name: rule.name,
      category: rule.category,
      weight: rule.weight,
      currentValue: val || null,
      recommended: rule.recommended,
      description: rule.description,
      status: evalRes.status,
      score: evalRes.score,
      reason: evalRes.reason,
    }
  })

  let grade = 'F'
  if (totalScore >= 95) grade = 'A+'
  else if (totalScore >= 85) grade = 'A'
  else if (totalScore >= 70) grade = 'B'
  else if (totalScore >= 50) grade = 'C'
  else if (totalScore >= 30) grade = 'D'

  return {
    score: totalScore,
    grade,
    results,
    missingCount,
    weakCount,
    secureCount,
  }
}

/**
 * Genera fragmentos de configuración para servidores web basados en las cabeceras recomendadas.
 * @param {'express'|'nginx'|'nextjs'} serverType
 * @returns {string}
 */
export function generateServerConfigSnippet(serverType = 'express') {
  if (serverType === 'express') {
    return `// Express.js con Helmet
import express from 'express'
import helmet from 'helmet'

const app = express()
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
)`
  }

  if (serverType === 'nginx') {
    return `# Configuración Nginx (nginx.conf / sites-available)
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;`
  }

  return `// next.config.js (Next.js Security Headers)
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self';" },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}`
}
