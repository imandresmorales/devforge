/**
 * @fileoverview Componente PWAPrompt — notificaciones de estado PWA.
 *
 * Muestra alertas accesibles para:
 * 1. Nueva versión disponible con botón para recargar / actualizar.
 * 2. Indicador de modo Offline cuando se pierde la conexión a internet.
 * 3. Botón para instalar la aplicación como PWA en el dispositivo.
 *
 * @module components/ui/PWAPrompt
 */
import { useServiceWorker } from '../../../hooks/useServiceWorker'
import './PWAPrompt.css'

function PWAPrompt() {
  const {
    needRefresh,
    isOffline,
    canInstall,
    updateServiceWorker,
    installPwa,
    dismissRefresh,
  } = useServiceWorker()

  return (
    <div className="pwa-container" aria-live="polite">
      {/* 1. Indicador de estado Offline */}
      {isOffline && (
        <aside
          className="pwa-banner pwa-banner--offline"
          role="status"
          aria-label="Estado de conexión offline"
        >
          <div className="pwa-banner__icon" aria-hidden="true">📡</div>
          <div className="pwa-banner__content">
            <span className="pwa-banner__title">Sin conexión a internet</span>
            <span className="pwa-banner__desc">Estás navegando en modo offline usando la caché local.</span>
          </div>
        </aside>
      )}

      {/* 2. Banner de nueva versión lista para actualizar */}
      {needRefresh && (
        <aside
          className="pwa-card pwa-card--update"
          role="alert"
          aria-label="Nueva versión disponible"
        >
          <div className="pwa-card__header">
            <span className="pwa-card__icon" aria-hidden="true">🚀</span>
            <div>
              <h4 className="pwa-card__title">¡Nueva versión disponible!</h4>
              <p className="pwa-card__desc">DevForge se ha actualizado con mejoras de rendimiento.</p>
            </div>
          </div>
          <div className="pwa-card__actions">
            <button
              type="button"
              className="btn-primary pwa-btn"
              onClick={updateServiceWorker}
            >
              Actualizar ahora
            </button>
            <button
              type="button"
              className="btn-secondary pwa-btn pwa-btn--dismiss"
              onClick={dismissRefresh}
            >
              Más tarde
            </button>
          </div>
        </aside>
      )}

      {/* 3. Banner de invitación a instalar la PWA */}
      {canInstall && (
        <aside
          className="pwa-card pwa-card--install"
          role="complementary"
          aria-label="Instalar DevForge en tu dispositivo"
        >
          <div className="pwa-card__header">
            <span className="pwa-card__icon" aria-hidden="true">⚡</span>
            <div>
              <h4 className="pwa-card__title">Instala DevForge</h4>
              <p className="pwa-card__desc">Acceso instantáneo y experiencia nativa sin conexión.</p>
            </div>
          </div>
          <div className="pwa-card__actions">
            <button
              type="button"
              className="btn-primary pwa-btn"
              onClick={installPwa}
            >
              Instalar App
            </button>
          </div>
        </aside>
      )}
    </div>
  )
}

export default PWAPrompt
