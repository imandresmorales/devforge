/**
 * @fileoverview Hook useTheme — gestión del tema claro/oscuro.
 *
 * CÓMO FUNCIONA:
 * 1. Lee el tema inicial desde localStorage (si existe).
 * 2. Si no hay preferencia guardada, usa prefers-color-scheme del sistema.
 * 3. Al cambiar el tema:
 *    - Actualiza el estado de React (re-render)
 *    - Persiste en localStorage
 *    - Aplica [data-theme="dark"|"light"] en el <html> (CSS lo lee aquí)
 *
 * SEGURIDAD:
 * - Usa try/catch en localStorage para manejar browsers con cookies bloqueadas.
 * - No usa eval() ni innerHTML.
 *
 * @module hooks/useTheme
 */
import { useEffect, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

/** Clave de localStorage donde se persiste la preferencia del usuario */
const STORAGE_KEY = 'devforge-theme'

/** Valores válidos para el tema — evita valores inesperados */
const VALID_THEMES = new Set(['light', 'dark'])

/**
 * Determina el tema inicial basado en la preferencia del SO.
 * @returns {'light' | 'dark'}
 */
function getSystemTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

/**
 * Aplica el tema al elemento <html> modificando el atributo data-theme.
 * @param {'light' | 'dark'} theme
 */
function applyThemeToDOM(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      theme === 'dark' ? '#0d1117' : '#f8fafc'
    )
  }
}

export function useTheme() {
  const [theme, setThemeState] = useLocalStorage(STORAGE_KEY, getSystemTheme)

  useEffect(() => {
    applyThemeToDOM(theme)
  }, [theme])

  // Escuchar cambios en la preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function handleSystemThemeChange(event) {
      // Solo cambiamos si el usuario NO tiene preferencia guardada
      const stored = readStoredTheme()
      if (!stored) {
        setThemeState(event.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [])

  /**
   * Alterna entre 'light' y 'dark'.
   * Memoizado con useCallback para evitar re-renders innecesarios
   * cuando se pasa como prop a componentes hijos.
   */
  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'light' ? 'dark' : 'light'))
  }, [])

  /**
   * Establece un tema específico.
   * @param {'light' | 'dark'} newTheme
   */
  const setTheme = useCallback((newTheme) => {
    if (!VALID_THEMES.has(newTheme)) {
      console.warn(`[useTheme] Tema inválido: "${newTheme}". Usa 'light' o 'dark'.`)
      return
    }
    setThemeState(newTheme)
  }, [])

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  }
}
