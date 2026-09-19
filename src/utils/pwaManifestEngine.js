/**
 * @fileoverview Motor de validación y enrutamiento de Web App Manifest PWA avanzado,
 * Shortcuts y Protocol Handlers personalizados (Mejora 105).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Valida conformidad con el estándar W3C Web App Manifest y PWA Installability criteria.
 * - Sanitiza y parsea de forma segura URIs con esquema 'web+devforge://' (prevención de XSS y Open Redirects).
 * - Restringe destinos de redirección a rutas relativas válidas internas.
 *
 * @module utils/pwaManifestEngine
 */

/**
 * Esquema de protocolo personalizado registrado.
 */
export const DEVFORGE_PROTOCOL = 'web+devforge'

/**
 * Rutas válidas permitidas para redirección interna.
 */
export const ALLOWED_INTERNAL_ROUTES = ['/', '/docs', '/dashboard', '/pricing', '/about', '/contact', '/profile']

/**
 * Valida la integridad y completitud de un objeto manifest.json.
 * @param {object} manifest - Objeto manifest parseado.
 * @returns {{ valid: boolean, score: number, issues: string[], features: string[] }}
 */
export function validateManifest(manifest) {
  const issues = []
  const features = []
  let score = 100

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, score: 0, issues: ['Manifest inválido o vacío'], features: [] }
  }

  // 1. Campos obligatorios para PWA Installable
  if (!manifest.name) { issues.push('Falta "name"'); score -= 15 }
  if (!manifest.short_name) { issues.push('Falta "short_name"'); score -= 10 }
  if (!manifest.start_url) { issues.push('Falta "start_url"'); score -= 15 }
  if (!manifest.display) { issues.push('Falta "display"'); score -= 10 }
  if (!manifest.icons || !Array.isArray(manifest.icons) || manifest.icons.length < 2) {
    issues.push('Falta o es insuficiente el arreglo de "icons" (debe incluir al menos 2 iconos)')
    score -= 20
  }

  // 2. Características avanzadas
  if (manifest.shortcuts && Array.isArray(manifest.shortcuts) && manifest.shortcuts.length > 0) {
    features.push(`App Shortcuts (${manifest.shortcuts.length} definidos)`)
  } else {
    score -= 10
    issues.push('Recomendado: Añadir "shortcuts" para acceso rápido')
  }

  if (manifest.protocol_handlers && Array.isArray(manifest.protocol_handlers)) {
    features.push('Protocol Handlers personalizados (web+devforge://)')
  }

  if (manifest.file_handlers && Array.isArray(manifest.file_handlers)) {
    features.push('File Handling API soportada')
  }

  if (manifest.share_target) {
    features.push('Web Share Target API')
  }

  if (manifest.display_override) {
    features.push('Window Controls Overlay (display_override)')
  }

  return {
    valid: issues.length === 0,
    score: Math.max(0, score),
    issues,
    features,
  }
}

/**
 * Parsea y sanitiza una URI de protocolo personalizado 'web+devforge://'.
 * @param {string} rawUri - URI completa ej. "web+devforge://docs?topic=pwa&action=view"
 * @returns {{ valid: boolean, targetPath: string, searchParams: Record<string, string>, error?: string }}
 */
export function parseProtocolUri(rawUri) {
  if (!rawUri || typeof rawUri !== 'string') {
    return { valid: false, targetPath: '/', searchParams: {}, error: 'URI vacía o no es texto' }
  }

  const clean = rawUri.trim()
  if (!clean.startsWith(`${DEVFORGE_PROTOCOL}://`)) {
    return {
      valid: false,
      targetPath: '/',
      searchParams: {},
      error: `Esquema de protocolo no soportado. Debe iniciar con "${DEVFORGE_PROTOCOL}://"`,
    }
  }

  try {
    const afterScheme = clean.replace(`${DEVFORGE_PROTOCOL}://`, 'https://devforge.internal/')
    const url = new URL(afterScheme)
    let route = '/' + url.pathname.replace(/^\/+/, '')

    // Si la ruta base no tiene barra inicial normalizada
    if (route === '//') route = '/'

    // Verificar contra lista blanca de seguridad para prevenir Open Redirects
    const matchedRoute = ALLOWED_INTERNAL_ROUTES.find((r) => r === route || route.startsWith(r + '/'))
    const finalRoute = matchedRoute ? route : '/docs'

    /** @type {Record<string, string>} */
    const params = {}
    url.searchParams.forEach((val, key) => {
      // Sanitizar parámetros de consulta
      params[key] = String(val).replace(/<[^>]*>?/gm, '')
    })

    return {
      valid: true,
      targetPath: finalRoute,
      searchParams: params,
    }
  } catch (err) {
    return {
      valid: false,
      targetPath: '/',
      searchParams: {},
      error: 'Error de sintaxis al procesar la URI: ' + (err?.message || 'URL inválida'),
    }
  }
}
