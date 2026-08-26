/**
 * @fileoverview Hook useServiceWorker — gestión del ciclo de vida de la PWA.
 *
 * CARACTERÍSTICAS:
 * - Registro nativo del Service Worker en navegadores compatibles.
 * - Detección de nuevas versiones listas para actualizar ('waiting worker').
 * - Detección de estado de conexión Online / Offline en tiempo real.
 * - Captura del evento 'beforeinstallprompt' para permitir instalación guiada de la PWA.
 *
 * @module hooks/useServiceWorker
 */
import { useState, useEffect, useCallback } from 'react'

/**
 * Hook para controlar el Service Worker y el estado PWA.
 *
 * @returns {{
 *   needRefresh: boolean,
 *   isOffline: boolean,
 *   canInstall: boolean,
 *   updateServiceWorker: () => void,
 *   installPwa: () => Promise<void>,
 *   dismissRefresh: () => void
 * }}
 */
export function useServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState(null)
  const [needRefresh, setNeedRefresh] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  // 1. Registro del Service Worker y detección de actualizaciones
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let registrationRef = null

    // Registrar el SW
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registrationRef = registration

        // Si ya hay un worker esperando
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
          setNeedRefresh(true)
        }

        // Si se encuentra una actualización
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker)
              setNeedRefresh(true)
            }
          })
        })
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.debug('[PWA] Error al registrar Service Worker:', err)
        }
      })

    // Recargar cuando el nuevo worker tome el control
    let refreshing = false
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  // 2. Monitoreo de estado de red (online/offline)
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 3. Captura del evento de instalación PWA
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      // Prevenir el banner por defecto del navegador para mostrar el nuestro accesible
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  // Acción: Aplicar actualización del Service Worker
  const updateServiceWorker = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
  }, [waitingWorker])

  // Acción: Cerrar aviso de actualización
  const dismissRefresh = useCallback(() => {
    setNeedRefresh(false)
  }, [])

  // Acción: Disparar la instalación guiada de la PWA
  const installPwa = useCallback(async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  return {
    needRefresh,
    isOffline,
    canInstall: Boolean(deferredPrompt),
    updateServiceWorker,
    installPwa,
    dismissRefresh,
  }
}
