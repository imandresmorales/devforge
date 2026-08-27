/**
 * @fileoverview Componente NotificationCenter — Centro de alertas en el Header (Mejora 28).
 *
 * CARACTERÍSTICAS:
 * - Botón con badge de conteo no leídas y animación de pulso.
 * - Panel desplegable accesible con pestañas "Todas" y "No leídas".
 * - Botón para solicitar permisos Web Push del sistema.
 * - Acciones rápidas para marcar como leída y eliminar individualmente.
 *
 * @module components/ui/NotificationCenter
 */
import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../../../context/NotificationContext'
import { formatDate } from '../../../utils'
import './NotificationCenter.css'

function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestPushPermission,
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('all') // 'all' | 'unread'
  const [pushStatus, setPushStatus] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  )

  const dropdownRef = useRef(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleEnablePush = async () => {
    const res = await requestPushPermission()
    setPushStatus(res)
  }

  const displayedNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    return true
  })

  return (
    <div className="notif-wrapper" ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        type="button"
        className={`notif-btn${isOpen ? ' notif-btn--active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notificaciones (${unreadCount} no leídas)`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Centro de notificaciones"
      >
        <span className="notif-btn__icon" aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="notif-btn__badge" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel Desplegable */}
      {isOpen && (
        <div
          className="notif-panel"
          role="region"
          aria-label="Panel de Notificaciones"
        >
          {/* Cabecera */}
          <div className="notif-header">
            <div className="notif-header__title-box">
              <h3 className="notif-header__title">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="badge badge--brand">{unreadCount} nuevas</span>
              )}
            </div>

            <div className="notif-header__actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-action-btn"
                  onClick={markAllAsRead}
                  title="Marcar todas como leídas"
                >
                  ✓ Leídas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  className="notif-action-btn notif-action-btn--danger"
                  onClick={clearAll}
                  title="Eliminar todas"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Banner de Web Push Permission */}
          {pushStatus === 'default' && (
            <div className="notif-push-prompt">
              <span>🔔 Recibe alertas en tu dispositivo</span>
              <button
                type="button"
                className="btn-primary notif-push-prompt__btn"
                onClick={handleEnablePush}
              >
                Activar
              </button>
            </div>
          )}

          {/* Tabs de Filtro */}
          <div className="notif-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              className={`notif-tab${filter === 'all' ? ' notif-tab--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'unread'}
              className={`notif-tab${filter === 'unread' ? ' notif-tab--active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              No leídas ({unreadCount})
            </button>
          </div>

          {/* Lista de Notificaciones */}
          <div className="notif-list" role="feed">
            {displayedNotifications.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty__icon">✨</span>
                <p>No tienes notificaciones {filter === 'unread' ? 'sin leer' : ''}.</p>
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <article
                  key={notif.id}
                  className={`notif-item${!notif.read ? ' notif-item--unread' : ''}`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <span className="notif-item__icon" aria-hidden="true">{notif.icon}</span>
                  <div className="notif-item__content">
                    <div className="notif-item__top">
                      <h4 className="notif-item__title">{notif.title}</h4>
                      {!notif.read && <span className="notif-item__dot" aria-label="No leída" />}
                    </div>
                    <p className="notif-item__msg">{notif.message}</p>
                    <time className="notif-item__time">
                      {formatDate(notif.createdAt, { dateStyle: 'short', timeStyle: 'short' })}
                    </time>
                  </div>
                  <button
                    type="button"
                    className="notif-item__remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNotification(notif.id)
                    }}
                    aria-label={`Eliminar notificación ${notif.title}`}
                    title="Eliminar"
                  >
                    ×
                  </button>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
