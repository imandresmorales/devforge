/**
 * @fileoverview Motor de Navegación por Teclado Roving Tabindex conforme a WAI-ARIA APG y WCAG AAA (Mejora 119).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Implementa el patrón estándar Roving Tabindex (tabindex="0" en el ítem activo, "-1" en los demás).
 * - Permite recorrer toolbars, tablists y menús jerárquicos usando flechas direccionales, Home y End sin requerir múltiples pulsaciones de Tab.
 * - Evita colisiones de foco y fugas de accesibilidad.
 *
 * @module utils/rovingTabindexEngine
 */

/**
 * Calcula el nuevo índice enfocado basado en el evento de teclado.
 * @param {number} currentIndex
 * @param {number} totalItems
 * @param {KeyboardEvent|{ key: string }} event
 * @param {Object} [options={}]
 * @param {boolean} [options.loop=true]
 * @param {'horizontal' | 'vertical' | 'both'} [options.orientation='both']
 * @returns {number} Nuevo índice a enfocar (-1 si no corresponde)
 */
export function calculateRovingIndex(currentIndex, totalItems, event, options = {}) {
  const { loop = true, orientation = 'both' } = options
  if (totalItems <= 0) return -1

  const isNext =
    (orientation !== 'vertical' && event.key === 'ArrowRight') ||
    (orientation !== 'horizontal' && event.key === 'ArrowDown')

  const isPrev =
    (orientation !== 'vertical' && event.key === 'ArrowLeft') ||
    (orientation !== 'horizontal' && event.key === 'ArrowUp')

  if (isNext) {
    if (currentIndex >= totalItems - 1) {
      return loop ? 0 : totalItems - 1
    }
    return currentIndex + 1
  }

  if (isPrev) {
    if (currentIndex <= 0) {
      return loop ? totalItems - 1 : 0
    }
    return currentIndex - 1
  }

  if (event.key === 'Home') {
    return 0
  }

  if (event.key === 'End') {
    return totalItems - 1
  }

  return -1
}

/**
 * Genera las propiedades de tabindex para cada ítem en la colección.
 * @param {number} index
 * @param {number} activeIndex
 * @returns {0 | -1}
 */
export function getRovingTabindex(index, activeIndex) {
  return index === activeIndex ? 0 : -1
}
