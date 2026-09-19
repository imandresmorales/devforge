/**
 * @fileoverview Componente NetworkStatusBanner — Banner de conectividad accesible WCAG 2.1 AAA.
 *
 * Muestra el estado de la conexión en vivo (Online/Offline, calidad 4G/3G/2G, RTT)
 * con región ARIA Live para lectores de pantalla y botón de reintento/sincronización.
 *
 * @module components/ui/NetworkStatusBanner
 */

import { useState } from 'react'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'
import { defaultSyncQueue } from '../../../utils/offlineSyncQueue'
import './NetworkStatusBanner.css'

export default function NetworkStatusBanner() {
  const { isOnline, effectiveType, rtt, checkPing } = useNetworkStatus()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const pendingMutations = defaultSyncQueue.getPending().length

  const handlePing = async () => {
    setIsChecking(true)
    await checkPing()
    setIsChecking(false)
  }

  // Si está online y no hay mutaciones pendientes y el usuario lo cerró, no mostrar
  if (isOnline && isDismissed && pendingMutations === 0) {
    return null
  }

  return (
    <aside
      className={`network-status-banner ${isOnline ? 'network-status-banner--online' : 'network-status-banner--offline'}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="network-status-banner__content">
        <span className="network-status-banner__icon" aria-hidden="true">
          {isOnline ? '🟢' : '🔴'}
        </span>

        <div className="network-status-banner__info">
          <strong className="network-status-banner__title">
            {isOnline ? 'Conexión Restablecida' : 'Sin Conexión a Internet (Modo Offline)'}
          </strong>
          <span className="network-status-banner__desc">
            {isOnline
              ? `Red activa (${effectiveType.toUpperCase()}, ~${rtt}ms RTT). ${pendingMutations > 0 ? `${pendingMutations} mutación(es) lista(s) para sincronizar.` : 'Todos los servicios operando normalmente.'}`
              : `Navegando con Service Worker caché. ${pendingMutations} mutación(es) encolada(s) localmente.`}
          </span>
        </div>
      </div>

      <div className="network-status-banner__actions">
        <button
          type="button"
          className="network-status-banner__btn"
          onClick={handlePing}
          disabled={isChecking}
          title="Verificar estado de conectividad"
        >
          {isChecking ? '⏳' : '🔄 Comprobar'}
        </button>

        {isOnline && (
          <button
            type="button"
            className="network-status-banner__close-btn"
            onClick={() => setIsDismissed(true)}
            aria-label="Cerrar notificación de conectividad"
          >
            ✕
          </button>
        )}
      </div>
    </aside>
  )
}
