import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { NotificationProvider, useNotifications } from './NotificationContext'

function wrapper({ children }) {
  return <NotificationProvider>{children}</NotificationProvider>
}

describe('NotificationContext (Mejora 28)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('debe iniciar con notificaciones predeterminadas del sistema', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper })
    expect(result.current.notifications.length).toBeGreaterThan(0)
    expect(result.current.unreadCount).toBeGreaterThan(0)
  })

  it('debe permitir añadir una nueva notificación y recalcular unreadCount', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper })
    const initialUnread = result.current.unreadCount

    act(() => {
      result.current.addNotification({
        title: 'Nueva prueba',
        message: 'Mensaje de prueba de notificación',
      })
    })

    expect(result.current.notifications[0].title).toBe('Nueva prueba')
    expect(result.current.unreadCount).toBe(initialUnread + 1)
  })

  it('debe marcar una notificación específica como leída', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper })
    const unread = result.current.notifications.find((n) => !n.read)

    expect(unread).toBeDefined()

    act(() => {
      result.current.markAsRead(unread.id)
    })

    const updated = result.current.notifications.find((n) => n.id === unread.id)
    expect(updated.read).toBe(true)
  })

  it('debe marcar todas como leídas', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper })

    act(() => {
      result.current.markAllAsRead()
    })

    expect(result.current.unreadCount).toBe(0)
    expect(result.current.notifications.every((n) => n.read)).toBe(true)
  })

  it('debe eliminar una notificación', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper })
    const initialCount = result.current.notifications.length
    const targetId = result.current.notifications[0].id

    act(() => {
      result.current.removeNotification(targetId)
    })

    expect(result.current.notifications.length).toBe(initialCount - 1)
    expect(result.current.notifications.find((n) => n.id === targetId)).toBeUndefined()
  })

  it('debe limpiar todas las notificaciones', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper })

    act(() => {
      result.current.clearAll()
    })

    expect(result.current.notifications.length).toBe(0)
    expect(result.current.unreadCount).toBe(0)
  })
})
