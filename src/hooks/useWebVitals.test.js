import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebVitals } from './useWebVitals'

describe('useWebVitals Hook (useWebVitals.js)', () => {
  it('debe calcular métricas de rendimiento válidas con TTFB, FCP y DOM Load', () => {
    const { result } = renderHook(() => useWebVitals())

    act(() => {
      result.current.remeasure()
    })

    expect(result.current.ttfb).toBeGreaterThan(0)
    expect(result.current.domLoad).toBeGreaterThanOrEqual(result.current.ttfb)
    expect(result.current.score).toBeGreaterThanOrEqual(50)
    expect(['good', 'needs-improvement', 'poor']).toContain(result.current.rating)
  })
})
