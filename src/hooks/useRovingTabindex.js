/**
 * @fileoverview Hook de React useRovingTabindex para gestión accesible de foco en colecciones (Mejora 119).
 *
 * @module hooks/useRovingTabindex
 */

import { useState, useCallback } from 'react'
import { calculateRovingIndex, getRovingTabindex } from '../utils/rovingTabindexEngine'

/**
 * Hook para implementar Roving Tabindex en listas y barras de herramientas.
 * @param {number} totalItems
 * @param {Object} [options={}]
 * @param {number} [options.initialIndex=0]
 * @param {'horizontal' | 'vertical' | 'both'} [options.orientation='both']
 * @param {boolean} [options.loop=true]
 * @returns {{
 *  activeIndex: number,
 *  setActiveIndex: (index: number) => void,
 *  handleKeyDown: (e: React.KeyboardEvent, index: number) => void,
 *  getTabindex: (index: number) => 0 | -1
 * }}
 */
export function useRovingTabindex(totalItems, options = {}) {
  const { initialIndex = 0, orientation = 'both', loop = true } = options
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const handleKeyDown = useCallback(
    (e, index) => {
      const nextIndex = calculateRovingIndex(index, totalItems, e, { orientation, loop })
      if (nextIndex !== -1) {
        e.preventDefault()
        setActiveIndex(nextIndex)
      }
    },
    [totalItems, orientation, loop]
  )

  const getTabindex = useCallback(
    (index) => getRovingTabindex(index, activeIndex),
    [activeIndex]
  )

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    getTabindex,
  }
}
