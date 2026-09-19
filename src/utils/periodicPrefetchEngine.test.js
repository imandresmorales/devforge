import { describe, it, expect, beforeEach } from 'vitest'
import {
  PeriodicPrefetchEngine,
  evaluatePrefetchEligibility,
  PREFETCH_MANIFEST,
} from './periodicPrefetchEngine'

describe('periodicPrefetchEngine — Periodic Background Sync & Prefetching (Mejora 104)', () => {
  let engine

  beforeEach(() => {
    engine = new PeriodicPrefetchEngine(12)
  })

  it('debe respetar el modo Save-Data y conexiones 2G deshabilitando el prefetch', () => {
    const saveDataResult = evaluatePrefetchEligibility({ saveData: true, effectiveType: '4g' })
    expect(saveDataResult.allowed).toBe(false)
    expect(saveDataResult.reason).toContain('Save-Data')

    const slow2gResult = evaluatePrefetchEligibility({ saveData: false, effectiveType: '2g' })
    expect(slow2gResult.allowed).toBe(false)
    expect(slow2gResult.reason).toContain('2g')

    const fast4gResult = evaluatePrefetchEligibility({ saveData: false, effectiveType: '4g' })
    expect(fast4gResult.allowed).toBe(true)
  })

  it('debe planificar items con prioridad high y medium cuando la red es óptima', () => {
    const plan = engine.planPrefetch({ saveData: false, effectiveType: '4g' })
    expect(plan.eligible).toBe(true)
    expect(plan.itemsToFetch.length).toBeGreaterThan(0)
    expect(plan.totalBytes).toBeGreaterThan(0)
    expect(plan.itemsToFetch.some((item) => item.path === '/docs')).toBe(true)
  })

  it('debe ejecutar el ciclo de periodic sync y registrar el historial', async () => {
    const syncResult = await engine.executePeriodicSync(async () => true, { saveData: false, effectiveType: '4g' })
    expect(syncResult.executed).toBe(true)
    expect(syncResult.fetchedCount).toBeGreaterThan(0)
    expect(engine.lastSyncTimestamp).not.toBeNull()

    const stats = engine.getStats()
    expect(stats.successfulPrefetches).toBe(syncResult.fetchedCount)
  })

  it('debe cancelar la ejecución si el modo Save-Data está activo', async () => {
    const syncResult = await engine.executePeriodicSync(async () => true, { saveData: true })
    expect(syncResult.executed).toBe(false)
    expect(syncResult.fetchedCount).toBe(0)
  })
})
