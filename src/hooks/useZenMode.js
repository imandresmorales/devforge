/**
 * @fileoverview Hook useZenMode — Gestión de modo lectura inmersivo y presentación (Mejora 32).
 *
 * CARACTERÍSTICAS:
 * - Oculta encabezados, pies y barras laterales para estudio sin distracciones.
 * - Atajo de teclado global `Alt+Z` para alternar modo Zen y `Escape` para salir.
 * - Monitoreo en tiempo real del progreso de lectura (0% a 100%).
 * - Control de zoom y escala tipográfica (A- / A+).
 *
 * @module hooks/useZenMode
 */
import { useState, useEffect, useCallback } from 'react'

export function useZenMode() {
  const [isZenMode, setIsZenMode] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [fontSizeOffset, setFontSizeOffset] = useState(0) // -2, -1, 0, 1, 2, 3

  // 1. Alternar clase CSS en el body
  useEffect(() => {
    if (isZenMode) {
      document.body.classList.add('zen-mode-active')
    } else {
      document.body.classList.remove('zen-mode-active')
    }

    return () => {
      document.body.classList.remove('zen-mode-active')
    }
  }, [isZenMode])

  // 2. Aplicar escala tipográfica en CSS variables
  useEffect(() => {
    const scale = 1 + fontSizeOffset * 0.1 // 0.8x a 1.3x
    document.documentElement.style.setProperty('--zen-font-scale', `${scale}`)

    return () => {
      document.documentElement.style.removeProperty('--zen-font-scale')
    }
  }, [fontSizeOffset])

  // 3. Monitoreo de progreso de scroll
  const handleScroll = useCallback(() => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight
    if (totalHeight <= 0) {
      setReadingProgress(100)
      return
    }
    const currentScroll = window.scrollY || document.documentElement.scrollTop
    const progress = Math.min(100, Math.max(0, Math.round((currentScroll / totalHeight) * 100)))
    setReadingProgress(progress)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 4. Atajos de teclado (Alt+Z para toggle, Escape para salir)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        setIsZenMode((prev) => !prev)
      } else if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isZenMode])

  const toggleZenMode = useCallback(() => setIsZenMode((prev) => !prev), [])
  const enterZenMode = useCallback(() => setIsZenMode(true), [])
  const exitZenMode = useCallback(() => setIsZenMode(false), [])

  const increaseFontSize = useCallback(() => {
    setFontSizeOffset((prev) => Math.min(prev + 1, 3))
  }, [])

  const decreaseFontSize = useCallback(() => {
    setFontSizeOffset((prev) => Math.max(prev - 1, -2))
  }, [])

  const resetFontSize = useCallback(() => {
    setFontSizeOffset(0)
  }, [])

  return {
    isZenMode,
    readingProgress,
    fontSizeOffset,
    toggleZenMode,
    enterZenMode,
    exitZenMode,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
  }
}

export default useZenMode
