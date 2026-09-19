/**
 * @fileoverview Motor de generación, validación y prueba de directivas robots.txt (Mejora 111).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Aislamiento y protección estricta de rutas privadas (/dashboard, /profile, /api/auth, /keys).
 * - Soporte para agentes específicos (Googlebot, Bingbot, GPTBot, CCBot).
 * - Enlace canónico al sitemap (`Sitemap: https://devforge.internal/sitemap.xml`).
 * - Motor de coincidencia de rutas según el estándar Robots Exclusion Protocol (RFC 9309).
 *
 * @module utils/robotsEngine
 */

/**
 * Configuración canónica por defecto de robots.txt para DevForge.
 */
export const DEFAULT_ROBOTS_CONFIG = {
  sitemapUrl: 'https://devforge.internal/sitemap.xml',
  rules: [
    {
      userAgent: '*',
      allow: ['/', '/docs', '/pricing', '/about', '/contact'],
      disallow: ['/dashboard', '/profile', '/api/auth', '/auth', '/admin', '/keys'],
      crawlDelay: 0,
    },
    {
      userAgent: 'GPTBot',
      allow: ['/docs'],
      disallow: ['/dashboard', '/profile', '/pricing'],
      crawlDelay: 2,
    },
  ],
}

/**
 * Genera el contenido en texto plano del archivo robots.txt.
 * @param {typeof DEFAULT_ROBOTS_CONFIG} [config]
 * @returns {string}
 */
export function generateRobotsTxt(config = DEFAULT_ROBOTS_CONFIG) {
  const sections = []

  sections.push('# ========================================================')
  sections.push('# DevForge Robots Exclusion Protocol (RFC 9309)')
  sections.push('# ========================================================\n')

  config.rules.forEach((rule) => {
    sections.push(`User-agent: ${rule.userAgent}`)

    if (rule.allow && rule.allow.length > 0) {
      rule.allow.forEach((path) => sections.push(`Allow: ${path}`))
    }

    if (rule.disallow && rule.disallow.length > 0) {
      rule.disallow.forEach((path) => sections.push(`Disallow: ${path}`))
    }

    if (rule.crawlDelay && rule.crawlDelay > 0) {
      sections.push(`Crawl-delay: ${rule.crawlDelay}`)
    }

    sections.push('') // Salto de línea entre secciones
  })

  if (config.sitemapUrl) {
    sections.push(`Sitemap: ${config.sitemapUrl}`)
  }

  return sections.join('\n')
}

/**
 * Evalúa si una ruta está permitida para un User-Agent dado según las reglas del robots.txt.
 * @param {string} robotsText - Contenido del robots.txt.
 * @param {string} userAgent - Nombre del bot (ej. 'Googlebot', 'GPTBot', '*').
 * @param {string} targetPath - Ruta a comprobar (ej. '/docs/pwa', '/dashboard').
 * @returns {{ allowed: boolean, matchedRule: string }}
 */
export function testRobotsPath(robotsText, userAgent, targetPath) {
  if (!robotsText || typeof robotsText !== 'string' || !targetPath) {
    return { allowed: true, matchedRule: 'Reglas vacías — Permitido por defecto' }
  }

  const cleanPath = targetPath.startsWith('/') ? targetPath : '/' + targetPath
  const lines = robotsText.split('\n').map((l) => l.trim())

  let currentAgent = null
  let appliesToAgent = false
  const disallows = []
  const allows = []

  for (const line of lines) {
    if (line.startsWith('#') || !line) continue

    if (line.toLowerCase().startsWith('user-agent:')) {
      currentAgent = line.split(':')[1].trim()
      appliesToAgent = currentAgent === '*' || currentAgent.toLowerCase() === userAgent.toLowerCase()
    } else if (appliesToAgent) {
      if (line.toLowerCase().startsWith('disallow:')) {
        const path = line.split(':')[1]?.trim()
        if (path) disallows.push(path)
      } else if (line.toLowerCase().startsWith('allow:')) {
        const path = line.split(':')[1]?.trim()
        if (path) allows.push(path)
      }
    }
  }

  // 1. Comprobar reglas de exclusión (Disallow)
  for (const dis of disallows) {
    if (cleanPath === dis || cleanPath.startsWith(dis.endsWith('/') ? dis : dis + '/')) {
      // Verificar si hay un Allow más específico
      const hasSpecificAllow = allows.some((al) => cleanPath.startsWith(al) && al.length > dis.length)
      if (!hasSpecificAllow) {
        return { allowed: false, matchedRule: `Disallow: ${dis}` }
      }
    }
  }

  return { allowed: true, matchedRule: 'Permitido (No bloqueado por directivas)' }
}
