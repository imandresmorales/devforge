/**
 * @fileoverview Hook de React useMotionPreferences para responder reactivamente a preferencias de movimiento y accesibilidad (Mejora 116).
 *
 * @module hooks/useMotionPreferences
 */

import { useState, useEffect } from 'react'
import {
  getSystemPreferences,
  applyMotionPreference,
  subscribeToMediaPreferences,
} from '../utils/motionPreferencesEngine'

/**
 * Hook para obtener y configurar las preferencias de movimiento y contraste del usuario.
 * @returns {{
 *  preferences: { reducedMotion: boolean, highContrast: boolean, forcedColors: boolean, colorScheme: string },
 *  overrideMode: 'system' | 'reduce' | 'allow',
 *  setOverrideMode: (mode: 'system' | 'reduce' | 'allow') => void
 * }}
 */
export function useMotionPreferences() {
  const [preferences, setPreferences] = useState(() => getSystemPreferences())
  const [overrideMode, setOverrideMode] = useState('system')

  useEffect(() => {
    const unsubscribe = subscribeToMediaPreferences((newPrefs) => {
      setPreferences(newPrefs)
    })
    return () => unsubscribe()
  }, [])

  const handleSetOverride = (mode) => {
    setOverrideMode(mode)
    applyMotionPreference(mode)
  }

  return {
    preferences,
    overrideMode,
    setOverrideMode: handleSetOverride,
  }
}
