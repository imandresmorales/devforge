/**
 * @fileoverview Motor de App Badging API y Notificaciones Push Interactivas (Mejora 107).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Soporte nativo para `navigator.setAppBadge()` y `navigator.clearAppBadge()`.
 * - Fallback accesible y adaptativo en el `document.title` (ej. "(3) DevForge") en navegadores no compatibles.
 * - Sanitización estricta de títulos y mensajes de notificaciones contra XSS.
 * - Estructuración de acciones interactivas (`actions`) con deep linking seguro.
 *
 * @module utils/pwaBadgingEngine
 */

/**
 * Sanitiza texto para visualización segura en notificaciones y badges.
 * @param {string} text
 * @returns {string}
 */
export function sanitizeNotificationText(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .trim()
}

/**
 * Formatea el título del documento con el conteo de badges como fallback.
 * @param {string} baseTitle - Título base (ej. "DevForge").
 * @param {number} count - Número de notificaciones o tareas pendientes.
 * @returns {string}
 */
export function formatDocumentTitleWithBadge(baseTitle, count) {
  const cleanTitle = sanitizeNotificationText(baseTitle) || 'DevForge'
  const validCount = Math.max(0, Math.floor(Number(count) || 0))

  if (validCount <= 0) {
    return cleanTitle
  }
  const badgeStr = validCount > 99 ? '99+' : validCount.toString()
  return `(${badgeStr}) ${cleanTitle}`
}

/**
 * Gestor del App Badging API del navegador.
 */
export class AppBadgingManager {
  /**
   * @param {string} [baseTitle='DevForge']
   */
  constructor(baseTitle = 'DevForge') {
    this.baseTitle = baseTitle
    this.currentBadge = 0
  }

  /**
   * Establece el conteo del badge de la aplicación.
   * @param {number} count - Número a mostrar en el icono de la app.
   * @returns {Promise<{ supported: boolean, count: number, fallbackUsed: boolean }>}
   */
  async setBadge(count) {
    const validCount = Math.max(0, Math.floor(Number(count) || 0))
    this.currentBadge = validCount

    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      try {
        if (validCount === 0) {
          await navigator.clearAppBadge()
        } else {
          await navigator.setAppBadge(validCount)
        }
        return { supported: true, count: validCount, fallbackUsed: false }
      } catch {
        // Fallback al título si falla por permisos
      }
    }

    // Fallback al título del documento
    if (typeof document !== 'undefined') {
      document.title = formatDocumentTitleWithBadge(this.baseTitle, validCount)
    }

    return { supported: false, count: validCount, fallbackUsed: true }
  }

  /**
   * Limpia el badge de la app.
   * @returns {Promise<boolean>}
   */
  async clearBadge() {
    this.currentBadge = 0
    if (typeof navigator !== 'undefined' && 'clearAppBadge' in navigator) {
      try {
        await navigator.clearAppBadge()
      } catch {
        /* Ignorar */
      }
    }

    if (typeof document !== 'undefined') {
      document.title = this.baseTitle
    }
    return true
  }

  /**
   * Construye un payload estructurado para notificación Push interactiva.
   * @param {string} title
   * @param {string} body
   * @param {Array<{ action: string, title: string, icon?: string }>} [actions=[]]
   * @returns {object} Opciones válidas para Notification API / Service Worker showNotification
   */
  createNotificationPayload(title, body, actions = []) {
    const safeTitle = sanitizeNotificationText(title) || 'DevForge Notificación'
    const safeBody = sanitizeNotificationText(body) || 'Tienes una nueva actualización en DevForge.'

    return {
      title: safeTitle,
      options: {
        body: safeBody,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        tag: 'devforge-interactive-push',
        renotify: true,
        data: {
          timestamp: Date.now(),
          url: '/docs',
        },
        actions: actions.map((act) => ({
          action: sanitizeNotificationText(act.action),
          title: sanitizeNotificationText(act.title),
          icon: act.icon || '/icons/icon-192.svg',
        })),
      },
    }
  }
}

/** Instancia global singleton */
export const defaultBadgingManager = new AppBadgingManager('DevForge')
