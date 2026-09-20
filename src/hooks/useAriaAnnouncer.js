/**
 * @fileoverview Hook de React useAriaAnnouncer para emitir anuncios a lectores de pantalla (Mejora 115).
 *
 * @module hooks/useAriaAnnouncer
 */

import { useCallback } from 'react'
import { announce, clearLiveRegions } from '../utils/ariaAnnouncerEngine'

/**
 * Hook para emitir anuncios accesibles para tecnologías de asistencia.
 * @returns {{
 *  announcePolite: (message: string, delay?: number) => void,
 *  announceAssertive: (message: string, delay?: number) => void,
 *  clear: () => void
 * }}
 */
export function useAriaAnnouncer() {
  const announcePolite = useCallback((message, delay = 7000) => {
    announce(message, 'polite', delay)
  }, [])

  const announceAssertive = useCallback((message, delay = 7000) => {
    announce(message, 'assertive', delay)
  }, [])

  const clear = useCallback(() => {
    clearLiveRegions()
  }, [])

  return {
    announcePolite,
    announceAssertive,
    clear,
  }
}
