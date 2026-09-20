/**
 * @fileoverview Tests unitarios para el hook useMotionPreferences (Mejora 116).
 */
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMotionPreferences } from './useMotionPreferences'

describe('useMotionPreferences hook (Mejora 116)', () => {
  it('debe inicializar el estado con las preferencias del sistema y modo override "system"', () => {
    const { result } = renderHook(() => useMotionPreferences())
    expect(result.current.preferences).toBeDefined()
    expect(result.current.overrideMode).toBe('system')
  })

  it('debe permitir cambiar el overrideMode y actualizar el documento', () => {
    const { result } = renderHook(() => useMotionPreferences())

    act(() => {
      result.current.setOverrideMode('reduce')
    })

    expect(result.current.overrideMode).toBe('reduce')
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('reduce')
  })
})
