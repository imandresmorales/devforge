/**
 * @fileoverview Componente PwaBadgingManager — Gestor de App Badging API & Notificaciones Push Interactivas.
 *
 * Permite cambiar en vivo el badge numérico del icono de la PWA (o fallback en título de pestaña),
 * simular notificaciones Push interactivas con botones de acción contextual y verificar soporte del sistema.
 *
 * @module components/ui/PwaBadgingManager
 */

import { useState } from 'react'
import { defaultBadgingManager } from '../../../utils/pwaBadgingEngine'
import './PwaBadgingManager.css'

export default function PwaBadgingManager() {
  const [badgeCount, setBadgeCount] = useState(3)
  const [notificationTitle, setNotificationTitle] = useState('⚡ Nueva Actualización DevForge')
  const [notificationBody, setNotificationBody] = useState('Tienes 4 módulos nuevos de PWA y SEO listos para explorar.')
  const [feedback, setFeedback] = useState(null)
  const [isSimulatingPush, setIsSimulatingPush] = useState(false)

  const isNativeBadgingSupported = typeof navigator !== 'undefined' && 'setAppBadge' in navigator

  const handleApplyBadge = async () => {
    const res = await defaultBadgingManager.setBadge(badgeCount)
    if (res.supported) {
      setFeedback({ type: 'success', text: `Badge establecido en ${badgeCount} mediante App Badging API nativa.` })
    } else {
      setFeedback({ type: 'info', text: `Badge establecido en (${badgeCount}) mediante fallback adaptativo en el título de pestaña.` })
    }
  }

  const handleClearBadge = async () => {
    await defaultBadgingManager.clearBadge()
    setFeedback({ type: 'info', text: 'Badge de la aplicación limpiado.' })
  }

  const handleTriggerInteractivePush = async () => {
    setIsSimulatingPush(true)
    const payload = defaultBadgingManager.createNotificationPayload(
      notificationTitle,
      notificationBody,
      [
        { action: 'open_module', title: '🚀 Explorar Módulo' },
        { action: 'later', title: '⏱️ Recordar Más Tarde' },
      ]
    )

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(payload.title, payload.options)
        setFeedback({ type: 'success', text: 'Notificación interactiva despachada al sistema operativo.' })
      } catch {
        setFeedback({ type: 'info', text: 'Notificación simulada en UI (requiere Service Worker en producción).' })
      }
    } else {
      setFeedback({ type: 'info', text: 'Payload interactivo generado con éxito (con 2 botones de acción contextual).' })
    }

    setIsSimulatingPush(false)
  }

  return (
    <div className="pwa-badging-card" role="region" aria-label="Gestor de PWA App Badging API">
      <div className="pwa-badging-card__header">
        <div className="pwa-badging-card__badge">⚡ Mejora 107</div>
        <h3 className="pwa-badging-card__title">PWA Badging API & Notificaciones Push Interactivas</h3>
        <p className="pwa-badging-card__subtitle">
          Actualiza el contador numérico sobre el icono de DevForge instalado y despacha notificaciones con acciones interactivas contextuales.
        </p>
      </div>

      {feedback && (
        <div className={`pwa-badging-feedback pwa-badging-feedback--${feedback.type}`} role="status">
          {feedback.text}
        </div>
      )}

      {/* Grid de Estado */}
      <div className="pwa-badging-status-grid">
        <div className="pwa-badging-status-item">
          <span className="pwa-badging-status-item__label">Soporte Nativo setAppBadge</span>
          <span className="pwa-badging-status-item__value">
            {isNativeBadgingSupported ? '🟢 Soportado (PWA)' : '🟡 Fallback Título Activo'}
          </span>
        </div>
        <div className="pwa-badging-status-item">
          <span className="pwa-badging-status-item__label">Badge Actual</span>
          <span className="pwa-badging-status-item__value text-gradient">{badgeCount}</span>
        </div>
        <div className="pwa-badging-status-item">
          <span className="pwa-badging-status-item__label">Permisos de Notificación</span>
          <span className="pwa-badging-status-item__value">
            {typeof Notification !== 'undefined' ? Notification.permission : 'No soportado'}
          </span>
        </div>
      </div>

      {/* Control del Badge */}
      <div className="pwa-badging-section">
        <h4 className="pwa-badging-section__title">🏷️ Control del Badge de la Aplicación</h4>
        <div className="pwa-badging-controls">
          <div className="pwa-badging-stepper">
            <button
              type="button"
              className="pwa-badging-btn-step"
              onClick={() => setBadgeCount((prev) => Math.max(0, prev - 1))}
              aria-label="Decrementar badge"
            >
              -
            </button>
            <span className="pwa-badging-count-display">{badgeCount}</span>
            <button
              type="button"
              className="pwa-badging-btn-step"
              onClick={() => setBadgeCount((prev) => prev + 1)}
              aria-label="Incrementar badge"
            >
              +
            </button>
          </div>

          <button type="button" className="pwa-badging-btn pwa-badging-btn--primary" onClick={handleApplyBadge}>
            ⚡ Aplicar Badge
          </button>
          <button type="button" className="pwa-badging-btn pwa-badging-btn--secondary" onClick={handleClearBadge}>
            🧹 Limpiar Badge
          </button>
        </div>
      </div>

      {/* Probador de Push Interactivo */}
      <div className="pwa-badging-section">
        <h4 className="pwa-badging-section__title">🔔 Notificación Push con Botones de Acción</h4>
        <div className="pwa-badging-form">
          <input
            type="text"
            className="pwa-badging-input"
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            placeholder="Título de la notificación"
          />
          <textarea
            className="pwa-badging-textarea"
            rows={2}
            value={notificationBody}
            onChange={(e) => setNotificationBody(e.target.value)}
            placeholder="Cuerpo del mensaje"
          />
          <button
            type="button"
            className="pwa-badging-btn pwa-badging-btn--push"
            onClick={handleTriggerInteractivePush}
            disabled={isSimulatingPush}
          >
            🚀 Despachar Notificación Interactiva
          </button>
        </div>
      </div>
    </div>
  )
}
