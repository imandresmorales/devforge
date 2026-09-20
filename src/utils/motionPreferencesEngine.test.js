/**
 * @fileoverview Tests unitarios para motionPreferencesEngine.js (Mejora 116).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getSystemPreferences,
  applyMotionPreference,
  subscribeToMediaPreferences,
} from './motionPreferencesEngine'

describe('motionPreferencesEngine (Mejora 116)', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-reduced-motion')
  })

  it('debe leer correctamente las preferencias de medios con fallback en entorno de pruebas', () => {
    const prefs = getSystemPreferences()
    expect(prefs).toBeDefined()
    expect(typeof prefs.reducedMotion).toBe('boolean')
    expect(typeof prefs.highContrast).toBe('boolean')
    expect(typeof prefs.forcedColors).toBe('boolean')
    expect(['dark', 'light', 'no-preference']).toContain(prefs.colorScheme)
  })

  it('debe aplicar atributos data-reduced-motion en document.documentElement', () => {
    applyMotionPreference('reduce')
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('reduce')

    applyMotionPreference('allow')
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('allow')

    applyMotionPreference('system')
    expect(document.documentElement.hasAttribute('data-reduced-motion')).toBe(false)
  })

  it('debe suscribirse y cancelar la suscripción a cambios de preferencias del sistema', () => {
    const callback = vi.fn()
    const unsubscribe = subscribeToMediaPreferences(callback)

    expect(typeof unsubscribe).toBe('function')
    unsubscribe()
  })
})
