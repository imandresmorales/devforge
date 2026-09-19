/**
 * @fileoverview Hook useNetworkStatus — Monitoreo reactivo de conectividad de red (Mejora 106).
 *
 * BUENAS PRÁCTICAS Y ACCESIBILIDAD:
 * - Escucha eventos estándar 'online' y 'offline' de window.
 * - Integra Network Information API (`navigator.connection`) cuando está disponible.
 * - Soporte para detección de latencia (RTT), velocidad estimada (Downlink) y modo Save-Data.
 * - Limpieza estricta de event listeners en unmount para prevenir fugas de memoria.
 *
 * @module hooks/useNetworkStatus
 */

import { useState, useEffect, useCallback } from 'react'

/**
 * Obtiene el estado actual de la red de forma segura.
 * @returns {{ isOnline: boolean, effectiveType: string, downlink: number, rtt: number, saveData: boolean }}
 */
export function getNetworkSnapshot() {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  const conn = typeof navigator !== 'undefined' && navigator.connection ? navigator.connection : null

  return {
    isOnline,
    effectiveType: conn?.effectiveType || (isOnline ? '4g' : 'offline'),
    downlink: conn?.downlink || (isOnline ? 10 : 0),
    rtt: conn?.rtt || (isOnline ? 50 : 0),
    saveData: conn?.saveData || false,
  }
}

/**
 * Hook para monitorear el estado de la conexión en tiempo real.
 * @returns {{ isOnline: boolean, effectiveType: string, downlink: number, rtt: number, saveData: boolean, checkPing: () => Promise<boolean> }}
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState(getNetworkSnapshot)

  const handleStatusChange = useCallback(() => {
    setStatus(getNetworkSnapshot())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('online', handleStatusChange)
    window.addEventListener('offline', handleStatusChange)

    const conn = navigator.connection
    if (conn && conn.addEventListener) {
      conn.addEventListener('change', handleStatusChange)
    }

    return () => {
      window.removeEventListener('online', handleStatusChange)
      window.removeEventListener('offline', handleStatusChange)
      if (conn && conn.removeEventListener) {
        conn.removeEventListener('change', handleStatusChange)
      }
    }
  }, [handleStatusChange])

  /**
   * Realiza un ping ligero para verificar conectividad real a internet.
   */
  const checkPing = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      const res = await fetch('/favicon.svg', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const online = res.ok
      setStatus((prev) => ({ ...prev, isOnline: online }))
      return online
    } catch {
      setStatus((prev) => ({ ...prev, isOnline: false }))
      return false
    }
  }, [])

  return {
    ...status,
    checkPing,
  }
}

export default useNetworkStatus
