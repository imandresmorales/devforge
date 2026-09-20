/**
 * @fileoverview Motor de Anuncios Universales ARIA Live Regions para Lectores de Pantalla WCAG AAA (Mejora 115).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Cumple con WCAG 2.1 Criterio 4.1.3 (Mensajes de estado).
 * - Mantiene nodos ocultos visualmente (sr-only / visually-hidden) pero completamente activos en el árbol de accesibilidad.
 * - Soporta niveles 'polite' (role="status") y 'assertive' (role="alert").
 * - Previene race conditions y colisiones de anuncios limpiando el buffer con micro-retrasos para forzar el reflow del lector de pantalla.
 *
 * @module utils/ariaAnnouncerEngine
 */

let politeNode = null
let assertiveNode = null

/**
 * Obtiene o crea el nodo del DOM para una región viva específica.
 * @param {'polite' | 'assertive'} politeness
 * @returns {HTMLElement|null}
 */
export function getOrCreateLiveRegion(politeness = 'polite') {
  if (typeof document === 'undefined') return null

  const id = `a11y-live-${politeness}`
  let node = document.getElementById(id)

  if (!node) {
    node = document.createElement('div')
    node.id = id
    node.setAttribute('aria-live', politeness)
    node.setAttribute('aria-atomic', 'true')
    node.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status')
    
    // Estilos visually-hidden / sr-only estándar
    Object.assign(node.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    })

    document.body.appendChild(node)
  }

  if (politeness === 'assertive') assertiveNode = node
  else politeNode = node

  return node
}

/**
 * Emite un anuncio sonoro / accesible para lectores de pantalla.
 * @param {string} message Texto a anunciar
 * @param {'polite' | 'assertive'} [politeness='polite']
 * @param {number} [clearDelayMs=7000] Tiempo antes de limpiar el nodo
 */
export function announce(message, politeness = 'polite', clearDelayMs = 7000) {
  if (!message || typeof message !== 'string') return

  const cleanMessage = message.trim()
  if (!cleanMessage) return

  const region = getOrCreateLiveRegion(politeness)
  if (!region) return

  // Limpieza inicial para forzar reflow del AOM
  region.textContent = ''

  setTimeout(() => {
    region.textContent = cleanMessage
  }, 50)

  if (clearDelayMs > 0) {
    setTimeout(() => {
      if (region && region.textContent === cleanMessage) {
        region.textContent = ''
      }
    }, clearDelayMs)
  }
}

/**
 * Limpia todas las regiones vivas activas.
 */
export function clearLiveRegions() {
  if (politeNode) politeNode.textContent = ''
  if (assertiveNode) assertiveNode.textContent = ''
}
