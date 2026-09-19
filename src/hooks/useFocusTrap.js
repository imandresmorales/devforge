/**
 * @fileoverview Hook de React useFocusTrap para contención accesible de foco en diálogos, modales y drawers.
 *
 * @module hooks/useFocusTrap
 */

import { useEffect, useRef } from 'react'
import { createFocusTrap } from '../utils/focusTrapEngine'

/**
 * Hook para atrapar el foco dentro del elemento referenciado mientras `isActive` sea true.
 * @param {boolean} isActive
 * @param {Object} [options={}]
 * @param {Function} [options.onEscape]
 * @param {boolean} [options.autoFocus=true]
 * @param {boolean} [options.restoreFocus=true]
 * @returns {import('react').RefObject<HTMLElement>}
 */
export function useFocusTrap(isActive, options = {}) {
  const containerRef = useRef(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const trap = createFocusTrap(containerRef.current, {
      autoFocus: optionsRef.current.autoFocus !== false,
      restoreFocus: optionsRef.current.restoreFocus !== false,
      onEscape: optionsRef.current.onEscape,
    })

    trap.activate()

    const onKeyDown = (e) => {
      trap.handleKeyDown(e)
    }

    const containerEl = containerRef.current
    containerEl.addEventListener('keydown', onKeyDown)

    return () => {
      containerEl.removeEventListener('keydown', onKeyDown)
      trap.deactivate()
    }
  }, [isActive])

  return containerRef
}
