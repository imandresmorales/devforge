/**
 * @fileoverview Barrel export del módulo context.
 * @module context
 */
export { UserProvider, useUser, USER_ACTIONS } from './UserContext'
// Mejora 21 — Autenticación
export { AuthProvider, useAuth, AUTH_ACTIONS } from './AuthContext'
// Mejora 28 — Notificaciones
export { NotificationProvider, useNotifications, NOTIFICATION_ACTIONS } from './NotificationContext'
// Mejora 29 — Tour Guiado Interactivo
export { TourProvider, useTour } from './TourContext'
