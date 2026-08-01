import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage.js'

describe('Custom Hook - useLocalStorage.js', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('debe devolver el valor inicial si no existe clave previa en localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'valor-inicial'))
    expect(result.current[0]).toBe('valor-inicial')
  })

  it('debe guardar y leer valores en localStorage correctamente', () => {
    const { result } = renderHook(() => useLocalStorage('theme', 'dark'))

    act(() => {
      result.current[1]('light')
    })

    expect(result.current[0]).toBe('light')
    expect(window.localStorage.getItem('theme')).toBe(JSON.stringify('light'))
  })

  it('debe soportar actualizaciones funcionales (prev => next)', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 10))

    act(() => {
      result.current[1]((prev) => prev + 5)
    })

    expect(result.current[0]).toBe(15)
  })

  it('debe manejar errores de localStorage sin romper la aplicación', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    const { result } = renderHook(() => useLocalStorage('fail-key', 'valor'))

    act(() => {
      result.current[1]('nuevo-valor')
    })

    // No debe romper la app aunque falle el guardado en disco
    expect(consoleSpy).toHaveBeenCalled()
  })
})
