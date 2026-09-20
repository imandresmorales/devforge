/**
 * @fileoverview Motor reactivo de detección de preferencias de movimiento y contraste del SO conforme a WCAG 2.1 AAA (Mejora 116).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Cumple con WCAG 2.1 Criterio 2.3.3 (Animación por interacciones).
 * - Detecta prefers-reduced-motion, prefers-contrast, forced-colors y prefers-color-scheme.
 * - Soporta sobrescritura de usuario en la app (app-level override) sincronizada con data-attributes en el DOM.
 *
 * @module utils/motionPreferencesEngine
 */

/**
 * Obtiene el estado actual de las preferencias de accesibilidad del sistema operativo.
 * @returns {{
 *  reducedMotion: boolean,
 *  highContrast: boolean,
 *  forcedColors: boolean,
 *  colorScheme: 'dark' | 'light' | 'no-preference'
 * }}
 */
export function getSystemPreferences() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return {
      reducedMotion: false,
      highContrast: false,
      forcedColors: false,
      colorScheme: 'no-preference',
    }
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const highContrast = window.matchMedia('(prefers-contrast: more)').matches
  const forcedColors = window.matchMedia('(forced-colors: active)').matches
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isLight = window.matchMedia('(prefers-color-scheme: light)').matches

  return {
    reducedMotion,
    highContrast,
    forcedColors,
    colorScheme: isDark ? 'dark' : isLight ? 'light' : 'no-preference',
  }
}

/**
 * Aplica una preferencia de movimiento forzada a nivel de documento.
 * @param {'system' | 'reduce' | 'allow'} mode
 */
export function applyMotionPreference(mode) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.removeAttribute('data-reduced-motion')

  if (mode === 'reduce') {
    root.setAttribute('data-reduced-motion', 'reduce')
  } else if (mode === 'allow') {
    root.setAttribute('data-reduced-motion', 'allow')
  }
}

/**
 * Suscribe un callback a cambios en las preferencias de medios del sistema.
 * @param {Function} onChange
 * @returns {() => void} Función de limpieza
 */
export function subscribeToMediaPreferences(onChange) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const contrastQuery = window.matchMedia('(prefers-contrast: more)')

  const listener = () => {
    onChange(getSystemPreferences())
  }

  if (motionQuery.addEventListener) {
    motionQuery.addEventListener('change', listener)
    contrastQuery.addEventListener('change', listener)
  }

  return () => {
    if (motionQuery.removeEventListener) {
      motionQuery.removeEventListener('change', listener)
      contrastQuery.removeEventListener('change', listener)
    }
  }
}
