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
import { useState, useEffect, useCallback } from 'react'

/** Clave de localStorage donde se persiste la preferencia del usuario */
const STORAGE_KEY = 'devforge-theme'

/** Valores válidos para el tema — evita valores inesperados */
const VALID_THEMES = new Set(['light', 'dark'])

/**
 * Lee el tema guardado en localStorage de forma segura.
 * @returns {'light' | 'dark' | null}
 */
function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return VALID_THEMES.has(stored) ? stored : null
  } catch {
    // localStorage no disponible (modo privado, cookies bloqueadas, etc.)
    return null
  }
}

/**
 * Guarda el tema en localStorage de forma segura.
 * @param {'light' | 'dark'} theme
 */
function writeStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Silencioso si localStorage no está disponible
  }
}

/**
 * Determina el tema inicial:
 * 1. Preferencia guardada en localStorage
 * 2. Preferencia del sistema operativo
 * 3. Por defecto: 'light'
 *
 * @returns {'light' | 'dark'}
 */
function getInitialTheme() {
  const stored = readStoredTheme()
  if (stored) return stored

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

/**
 * Aplica el tema al elemento <html> modificando el atributo data-theme.
 * Las variables CSS en variables.css leen este atributo.
 *
 * @param {'light' | 'dark'} theme
 */
function applyThemeToDOM(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  // También actualiza el meta theme-color para el color de la barra del navegador
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      theme === 'dark' ? '#0d1117' : '#f8fafc'
    )
  }
}

/**
 * Hook personalizado para gestionar el tema claro/oscuro.
 *
 * @returns {{
 *   theme: 'light' | 'dark',
 *   isDark: boolean,
 *   toggleTheme: () => void,
 *   setTheme: (theme: 'light' | 'dark') => void
 * }}
 *
 * @example
 * const { theme, isDark, toggleTheme } = useTheme()
 * // En JSX:
 * <button onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    // La función de inicialización lazy se ejecuta solo una vez
    return getInitialTheme()
  })

  // Aplicar el tema al DOM cada vez que cambia
  useEffect(() => {
    applyThemeToDOM(theme)
    writeStoredTheme(theme)
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
