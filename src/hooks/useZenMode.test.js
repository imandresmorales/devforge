import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useZenMode } from './useZenMode'

describe('useZenMode Hook (useZenMode.js)', () => {
  beforeEach(() => {
    document.body.classList.remove('zen-mode-active')
    document.documentElement.style.removeProperty('--zen-font-scale')
  })

  it('debe iniciar en estado inactivo', () => {
    const { result } = renderHook(() => useZenMode())
    expect(result.current.isZenMode).toBe(false)
    expect(result.current.fontSizeOffset).toBe(0)
  })

  it('debe alternar el modo Zen con toggleZenMode y aplicar la clase al body', () => {
    const { result } = renderHook(() => useZenMode())

    act(() => {
      result.current.toggleZenMode()
    })

    expect(result.current.isZenMode).toBe(true)
    expect(document.body.classList.contains('zen-mode-active')).toBe(true)

    act(() => {
      result.current.exitZenMode()
    })

    expect(result.current.isZenMode).toBe(false)
    expect(document.body.classList.contains('zen-mode-active')).toBe(false)
  })

  it('debe controlar el ajuste de tamaño de tipografía (increase/decrease/reset)', () => {
    const { result } = renderHook(() => useZenMode())

    act(() => {
      result.current.increaseFontSize()
    })
    expect(result.current.fontSizeOffset).toBe(1)

    act(() => {
      result.current.increaseFontSize()
    })
    expect(result.current.fontSizeOffset).toBe(2)

    act(() => {
      result.current.decreaseFontSize()
    })
    expect(result.current.fontSizeOffset).toBe(1)

    act(() => {
      result.current.resetFontSize()
    })
    expect(result.current.fontSizeOffset).toBe(0)
  })
})
