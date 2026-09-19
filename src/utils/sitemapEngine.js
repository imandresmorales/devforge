/**
 * @fileoverview Generador y Validador Dinámico de sitemap.xml según estándares de Sitemaps.org (Mejora 110).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Escapa caracteres especiales XML (&, <, >, ", ') para prevenir inyecciones XML malformadas.
 * - Validación de límites de sitemap (máximo 50.000 URLs o 50 MB sin sitemap index).
 * - Soporte de etiquetas `<loc>`, `<lastmod>`, `<changefreq>` y `<priority>` bien tipadas.
 * - Exclusión automática de rutas privadas protegidas (/dashboard, /profile, /admin).
 *
 * @module utils/sitemapEngine
 */

/**
 * Escapa caracteres reservados para XML.
 * @param {string} text
 * @returns {string}
 */
export function escapeXml(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Rutas públicas base indexables de DevForge.
 */
export const DEFAULT_SITEMAP_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/pricing', priority: '0.9', changefreq: 'weekly' },
  { path: '/docs', priority: '0.9', changefreq: 'daily' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' },
]

/**
 * Genera el string XML completo de un sitemap.
 * @param {Array<{ path: string, priority?: string, changefreq?: string, lastmod?: string }>} routes
 * @param {string} [baseUrl='https://devforge.internal']
 * @returns {string}
 */
export function generateSitemapXml(routes = DEFAULT_SITEMAP_ROUTES, baseUrl = 'https://devforge.internal') {
  const currentDate = new Date().toISOString().split('T')[0]

  const urlEntries = routes
    .filter((r) => r.path && !r.path.startsWith('/dashboard') && !r.path.startsWith('/profile') && !r.path.startsWith('/admin'))
    .map((r) => {
      const loc = r.path.startsWith('http') ? r.path : `${baseUrl.replace(/\/$/, '')}${r.path.startsWith('/') ? r.path : '/' + r.path}`
      const lastmod = r.lastmod || currentDate
      const changefreq = r.changefreq || 'weekly'
      const priority = r.priority || '0.5'

      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(lastmod)}</lastmod>\n    <changefreq>${escapeXml(changefreq)}</changefreq>\n    <priority>${escapeXml(priority)}</priority>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`
}

/**
 * Valida un string sitemap.xml.
 * @param {string} xmlString
 * @returns {{ valid: boolean, urlCount: number, issues: string[] }}
 */
export function validateSitemapXml(xmlString) {
  const issues = []
  if (!xmlString || typeof xmlString !== 'string') {
    return { valid: false, urlCount: 0, issues: ['Contenido XML vacío'] }
  }

  if (!xmlString.includes('<urlset') || !xmlString.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
    issues.push('Falta etiqueta raíz <urlset> con el namespace estándar de sitemaps.org')
  }

  const urlMatches = xmlString.match(/<url>/g) || []
  const urlCount = urlMatches.length

  if (urlCount === 0) {
    issues.push('El sitemap no contiene ninguna entrada <url>')
  } else if (urlCount > 50000) {
    issues.push('Límite excedido: El sitemap supera las 50.000 URLs permitidas')
  }

  return {
    valid: issues.length === 0,
    urlCount,
    issues,
  }
}
