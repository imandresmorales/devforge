/**
 * @fileoverview Tests unitarios para useRovingTabindex.js (Mejora 119).
 */
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRovingTabindex } from './useRovingTabindex'

describe('useRovingTabindex hook (Mejora 119)', () => {
  it('debe inicializar el activeIndex en 0 y devolver tabindex correcto', () => {
    const { result } = renderHook(() => useRovingTabindex(4))
    expect(result.current.activeIndex).toBe(0)
    expect(result.current.getTabindex(0)).toBe(0)
    expect(result.current.getTabindex(1)).toBe(-1)
  })

  it('debe actualizar activeIndex al recibir eventos de teclado de flechas', () => {
    const { result } = renderHook(() => useRovingTabindex(3))

    act(() => {
      const mockEvent = { key: 'ArrowRight', preventDefault: () => {} }
      result.current.handleKeyDown(mockEvent, 0)
    })

    expect(result.current.activeIndex).toBe(1)
    expect(result.current.getTabindex(1)).toBe(0)
    expect(result.current.getTabindex(0)).toBe(-1)
  })
})
