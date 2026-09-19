import { describe, it, expect, beforeEach } from 'vitest'
import {
  AppBadgingManager,
  sanitizeNotificationText,
  formatDocumentTitleWithBadge,
} from './pwaBadgingEngine'

describe('pwaBadgingEngine — App Badging API & Push Notifications (Mejora 107)', () => {
  let manager

  beforeEach(() => {
    manager = new AppBadgingManager('DevForge Test')
  })

  it('debe sanitizar textos de notificaciones eliminando etiquetas HTML', () => {
    expect(sanitizeNotificationText('<script>alert(1)</script>Hola')).toBe('Hola')
    expect(sanitizeNotificationText('<b>Nueva Lección</b>')).toBe('Nueva Lección')
    expect(sanitizeNotificationText('')).toBe('')
  })

  it('debe formatear el título del documento con el prefijo de badge correcto', () => {
    expect(formatDocumentTitleWithBadge('DevForge', 0)).toBe('DevForge')
    expect(formatDocumentTitleWithBadge('DevForge', 5)).toBe('(5) DevForge')
    expect(formatDocumentTitleWithBadge('DevForge', 150)).toBe('(99+) DevForge')
  })

  it('debe estructurar payloads de notificaciones interactivas con actions seguras', () => {
    const payload = manager.createNotificationPayload(
      'Módulo PWA',
      'Tienes 3 lecciones pendientes',
      [
        { action: 'open_docs', title: 'Ver Docs' },
        { action: 'dismiss', title: 'Descartar' },
      ]
    )

    expect(payload.title).toBe('Módulo PWA')
    expect(payload.options.body).toBe('Tienes 3 lecciones pendientes')
    expect(payload.options.actions.length).toBe(2)
    expect(payload.options.actions[0].action).toBe('open_docs')
  })

  it('debe gestionar el estado numérico del badge', async () => {
    const res = await manager.setBadge(4)
    expect(manager.currentBadge).toBe(4)
    expect(typeof res.supported).toBe('boolean')

    await manager.clearBadge()
    expect(manager.currentBadge).toBe(0)
  })
})
