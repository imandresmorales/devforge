import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebSocket, WS_STATUS } from './useWebSocket'

describe('WebSocket Client Hook (useWebSocket.js)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('debe iniciar en estado CONNECTING y pasar a OPEN tras el handshake', () => {
    const { result } = renderHook(() => useWebSocket('wss://test.devforge.io', { autoConnect: true }))

    expect(result.current.status).toBe(WS_STATUS.CONNECTING)

    // Avanzar timer de handshake simulado (400ms)
    act(() => {
      vi.advanceTimersByTime(450)
    })

    expect(result.current.status).toBe(WS_STATUS.OPEN)
    expect(result.current.isConnected).toBe(true)
    expect(result.current.messages.length).toBeGreaterThan(0)
    expect(result.current.messages[0].type).toBe('system')
  })

  it('debe enviar mensajes sanitizados y recibir ACK del servidor', () => {
    const { result } = renderHook(() => useWebSocket('wss://test.devforge.io', { autoConnect: true }))

    act(() => {
      vi.advanceTimersByTime(450)
    })

    act(() => {
      result.current.sendMessage('Hola DevForge WebSocket')
    })

    const userMsg = result.current.messages.find((m) => m.text === 'Hola DevForge WebSocket')
    expect(userMsg).toBeDefined()
    expect(userMsg.type).toBe('user')

    // Avanzar timer para el ACK del servidor (350ms)
    act(() => {
      vi.advanceTimersByTime(400)
    })

    const ackMsg = result.current.messages.find((m) => m.type === 'server')
    expect(ackMsg).toBeDefined()
    expect(ackMsg.text).toContain('[ACK] Recibido paquete de datos')
  })

  it('debe desconectar y limpiar timers al invocar disconnect()', () => {
    const { result } = renderHook(() => useWebSocket('wss://test.devforge.io', { autoConnect: true }))

    act(() => {
      vi.advanceTimersByTime(450)
    })

    act(() => {
      result.current.disconnect()
    })

    expect(result.current.status).toBe(WS_STATUS.CLOSING)

    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(result.current.status).toBe(WS_STATUS.CLOSED)
    expect(result.current.isConnected).toBe(false)
  })
})
