/**
 * @fileoverview Motor de gestión de enfoque accesible y contención de teclado WCAG 2.1/2.2 AAA (Mejora 113).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Cumple con WCAG 2.1 Criterio de Conformidad 2.1.2 (Sin trampa para el teclado) y 2.4.3 (Orden del foco).
 * - Restaura el foco de forma segura al elemento desencadenante original al cerrar el diálogo/drawer.
 * - Soporta navegación bidireccional (Tab y Shift+Tab) y atajo de escape (Escape).
 * - Protegido contra bucles infinitos y referencias huérfanas de DOM.
 *
 * @module utils/focusTrapEngine
 */

export const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"]):not([disabled])',
  'button:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'input:not([type="hidden"]):not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]:not([tabindex="-1"])',
].join(', ')

/**
 * Obtiene todos los elementos enfocables interactivos dentro de un contenedor.
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
export function getFocusableElements(container) {
  if (!container || typeof container.querySelectorAll !== 'function') return []
  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
  return elements.filter((el) => {
    // Filtrar elementos ocultos o deshabilitados
    const style = typeof window !== 'undefined' ? window.getComputedStyle(el) : null
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return false
    return !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  })
}

/**
 * Crea un controlador de trampa de foco accesible para diálogos y drawers.
 * @param {HTMLElement} container
 * @param {Object} [options={}]
 * @param {boolean} [options.autoFocus=true]
 * @param {boolean} [options.restoreFocus=true]
 * @param {Function} [options.onEscape]
 * @returns {{
 *  activate: () => void,
 *  deactivate: () => void,
 *  isActive: () => boolean,
 *  handleKeyDown: (e: KeyboardEvent) => void
 * }}
 */
export function createFocusTrap(container, options = {}) {
  const {
    autoFocus = true,
    restoreFocus = true,
    onEscape,
  } = options

  let active = false
  let previousActiveElement = null

  const handleKeyDown = (e) => {
    if (!active || !container) return

    if (e.key === 'Escape' && typeof onEscape === 'function') {
      e.preventDefault()
      onEscape()
      return
    }

    if (e.key !== 'Tab') return

    const focusables = getFocusableElements(container)
    if (focusables.length === 0) {
      e.preventDefault()
      return
    }

    const firstElement = focusables[0]
    const lastElement = focusables[focusables.length - 1]
    const currentElement = document.activeElement

    if (e.shiftKey) {
      // Shift + Tab (hacia atrás)
      if (currentElement === firstElement || !container.contains(currentElement)) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab (hacia adelante)
      if (currentElement === lastElement || !container.contains(currentElement)) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  const activate = () => {
    if (active || !container) return
    active = true
    if (typeof document !== 'undefined') {
      previousActiveElement = document.activeElement
    }

    const focusables = getFocusableElements(container)
    if (autoFocus && focusables.length > 0) {
      // Foco inmediato en el primer elemento interactivo
      focusables[0].focus()
    }
  }

  const deactivate = () => {
    if (!active) return
    active = false

    if (restoreFocus && previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus()
      previousActiveElement = null
    }
  }

  return {
    activate,
    deactivate,
    isActive: () => active,
    handleKeyDown,
  }
}
