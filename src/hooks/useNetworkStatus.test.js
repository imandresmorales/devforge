import { describe, it, expect } from 'vitest'
import { getNetworkSnapshot } from './useNetworkStatus'

describe('useNetworkStatus — Monitoreo Reactivo de Red (Mejora 106)', () => {
  it('debe retornar un snapshot de red válido con propiedades estándar', () => {
    const snapshot = getNetworkSnapshot()
    expect(snapshot).toHaveProperty('isOnline')
    expect(snapshot).toHaveProperty('effectiveType')
    expect(snapshot).toHaveProperty('downlink')
    expect(snapshot).toHaveProperty('rtt')
    expect(snapshot).toHaveProperty('saveData')
    expect(typeof snapshot.isOnline).toBe('boolean')
  })

  it('debe inferir effectiveType offline cuando isOnline es falso', () => {
    // Simular navegador offline
    const originalNavigator = global.navigator
    // @ts-ignore
    global.navigator = { onLine: false }

    const snapshot = getNetworkSnapshot()
    expect(snapshot.isOnline).toBe(false)
    expect(snapshot.effectiveType).toBe('offline')

    global.navigator = originalNavigator
  })
})
