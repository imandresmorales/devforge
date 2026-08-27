import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce Hook (useDebounce.js)', () => {
  it('debe devolver el valor inicial inmediatamente', () => {
    const { result } = renderHook(() => useDebounce('react', 200))
    expect(result.current).toBe('react')
  })

  it('debe aplazar la actualización del valor hasta que transcurra el delay', async () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'inicial', delay: 300 } }
    )

    expect(result.current).toBe('inicial')

    // Cambiar valor
    rerender({ value: 'modificado', delay: 300 })

    // Inmediatamente después aún mantiene el valor previo
    expect(result.current).toBe('inicial')

    // Avanzar el tiempo 150ms (menos que el delay)
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe('inicial')

    // Avanzar el resto del tiempo (150ms más)
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe('modificado')

    vi.useRealTimers()
  })
})
