/**
 * @fileoverview NotificationContext — Sistema de alertas en la app y soporte Web Push API.
 *
 * CARACTERÍSTICAS:
 * - Gestión de notificaciones persistentes sincronizadas con localStorage.
 * - Integración con la Notification API nativa del navegador (Web Push).
 * - Métricas de no leídos en tiempo real.
 * - Sanitización de contenidos antes de almacenamiento.
 *
 * @module context/NotificationContext
 */
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { sanitizeInput } from '../utils/security'
import { generateId } from '../utils'

const STORAGE_KEY = 'df_notifications'

/** @enum {string} */
export const NOTIFICATION_ACTIONS = Object.freeze({
  INIT: 'NOTIFICATIONS/INIT',
  ADD: 'NOTIFICATIONS/ADD',
  MARK_READ: 'NOTIFICATIONS/MARK_READ',
  MARK_ALL_READ: 'NOTIFICATIONS/MARK_ALL_READ',
  REMOVE: 'NOTIFICATIONS/REMOVE',
  CLEAR_ALL: 'NOTIFICATIONS/CLEAR_ALL',
})

/** Notificaciones iniciales de bienvenida y sistema */
const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-welcome',
    title: '¡Bienvenido a DevForge!',
    message: 'Explora las 100 mejoras continuas y domina el stack web moderno.',
    type: 'info',
    icon: '⚡',
    read: false,
    createdAt: Date.now() - 1000 * 60 * 60, // Hace 1 hora
  },
  {
    id: 'notif-pwa',
    title: 'Soporte PWA activado',
    message: 'DevForge ahora funciona sin conexión a internet y se puede instalar como app nativa.',
    type: 'success',
    icon: '🚀',
    read: false,
    createdAt: Date.now() - 1000 * 60 * 30, // Hace 30 min
  },
  {
    id: 'notif-security',
    title: 'Seguridad reforzada',
    message: 'Tus sesiones están protegidas con tokens en memoria y algoritmos anti-XSS.',
    type: 'security',
    icon: '🛡️',
    read: true,
    createdAt: Date.now() - 1000 * 60 * 120,
  },
]

function notificationReducer(state, action) {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.INIT:
      return action.payload

    case NOTIFICATION_ACTIONS.ADD:
      return [action.payload, ...state]

    case NOTIFICATION_ACTIONS.MARK_READ:
      return state.map((n) => (n.id === action.payload ? { ...n, read: true } : n))

    case NOTIFICATION_ACTIONS.MARK_ALL_READ:
      return state.map((n) => ({ ...n, read: true }))

    case NOTIFICATION_ACTIONS.REMOVE:
      return state.filter((n) => n.id !== action.payload)

    case NOTIFICATION_ACTIONS.CLEAR_ALL:
      return []

    default:
      return state
  }
}

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, dispatch] = useReducer(notificationReducer, INITIAL_NOTIFICATIONS)

  // Cargar notificaciones desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        dispatch({ type: NOTIFICATION_ACTIONS.INIT, payload: JSON.parse(stored) })
      }
    } catch {
      // Usar estado inicial en caso de error
    }
  }, [])

  // Sincronizar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    } catch {
      // Ignorar quota errors
    }
  }, [notifications])

  /**
   * Agrega una nueva notificación y dispara Web Push si hay permisos concedidos.
   */
  const addNotification = useCallback(({ title, message, type = 'info', icon = '🔔' }) => {
    const cleanTitle = sanitizeInput(title)
    const cleanMessage = sanitizeInput(message)

    const newNotif = {
      id: `notif_${generateId()}`,
      title: cleanTitle,
      message: cleanMessage,
      type,
      icon,
      read: false,
      createdAt: Date.now(),
    }

    dispatch({ type: NOTIFICATION_ACTIONS.ADD, payload: newNotif })

    // Disparar Web Push nativo si el navegador lo permite
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(cleanTitle, {
          body: cleanMessage,
          icon: '/icons/icon-192.svg',
        })
      } catch {
        // Silenciar si el navegador bloquea background notifications
      }
    }
  }, [])

  const markAsRead = useCallback((id) => {
    dispatch({ type: NOTIFICATION_ACTIONS.MARK_READ, payload: id })
  }, [])

  const markAllAsRead = useCallback(() => {
    dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_READ })
  }, [])

  const removeNotification = useCallback((id) => {
    dispatch({ type: NOTIFICATION_ACTIONS.REMOVE, payload: id })
  }, [])

  const clearAll = useCallback(() => {
    dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_ALL })
  }, [])

  /**
   * Solicita permisos para Notificaciones del Sistema (Web Push API).
   */
  const requestPushPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch {
      return 'denied'
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestPushPermission,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('[useNotifications] Debe usarse dentro de un NotificationProvider.')
  }
  return ctx
}

export default NotificationContext
