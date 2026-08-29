import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTerminal } from './useTerminal'

describe('useTerminal Hook (useTerminal.js)', () => {
  it('debe inicializarse con mensajes del sistema', () => {
    const { result } = renderHook(() => useTerminal())
    expect(result.current.history.length).toBeGreaterThan(0)
    expect(result.current.history[0].text).toContain('DevForge Terminal CLI')
  })

  it('debe procesar el comando help', () => {
    const { result } = renderHook(() => useTerminal())
    act(() => {
      result.current.executeCommand('help')
    })
    const last = result.current.history[result.current.history.length - 1]
    expect(last.text).toContain('Comandos disponibles')
  })

  it('debe ejecutar callback de cambio de tema con comando theme', () => {
    const toggleThemeMock = vi.fn()
    const { result } = renderHook(() => useTerminal({ onToggleTheme: toggleThemeMock }))
    act(() => {
      result.current.executeCommand('theme')
    })
    expect(toggleThemeMock).toHaveBeenCalled()
  })

  it('debe limpiar el historial con comando clear', () => {
    const { result } = renderHook(() => useTerminal())
    act(() => {
      result.current.executeCommand('clear')
    })
    expect(result.current.history.length).toBe(0)
  })
})
