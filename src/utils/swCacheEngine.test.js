import { describe, it, expect, beforeEach } from 'vitest'
import {
  AdvancedCacheStore,
  isSafeToCache,
  CACHE_STRATEGIES,
  DEFAULT_TTL_CONFIG,
} from './swCacheEngine'

describe('swCacheEngine — Motor de Caché Avanzado PWA (Mejora 102)', () => {
  let cacheStore

  beforeEach(() => {
    cacheStore = new AdvancedCacheStore(3)
  })

  it('debe validar URLs seguras y rechazar endpoints sensibles o privados', () => {
    expect(isSafeToCache('https://devforge.internal/docs/react')).toBe(true)
    expect(isSafeToCache('https://devforge.internal/assets/app.js')).toBe(true)
    expect(isSafeToCache('https://devforge.internal/api/auth/login')).toBe(false)
    expect(isSafeToCache('https://devforge.internal/admin/secret-keys')).toBe(false)
    expect(isSafeToCache(null)).toBe(false)
  })

  it('debe almacenar y recuperar entradas respetando el orden LRU y capacidad máxima', () => {
    cacheStore.put('https://devforge.internal/a', 'data_a')
    cacheStore.put('https://devforge.internal/b', 'data_b')
    cacheStore.put('https://devforge.internal/c', 'data_c')

    expect(cacheStore.get('https://devforge.internal/a')).toBe('data_a')

    // Al insertar 'd', 'b' debe ser desalojado porque 'a' fue accedido recientemente
    cacheStore.put('https://devforge.internal/d', 'data_d')

    expect(cacheStore.get('https://devforge.internal/b')).toBeNull()
    expect(cacheStore.get('https://devforge.internal/a')).toBe('data_a')
    expect(cacheStore.get('https://devforge.internal/d')).toBe('data_d')
  })

  it('debe respetar la expiración por TTL y purgar entradas caducadas', () => {
    const shortTtl = 50 // 50ms
    cacheStore.put('https://devforge.internal/temp', 'temp_data', shortTtl)

    expect(cacheStore.get('https://devforge.internal/temp')).toBe('temp_data')

    // Simular paso del tiempo manipulando addedAt
    const entry = cacheStore.entries.get('https://devforge.internal/temp')
    entry.addedAt = Date.now() - 100 // caducado

    expect(cacheStore.get('https://devforge.internal/temp')).toBeNull()
    const stats = cacheStore.getStats()
    expect(stats.misses).toBeGreaterThanOrEqual(1)
  })

  it('debe calcular métricas de hit rate y estadísticas correctamente', () => {
    cacheStore.put('https://devforge.internal/test', 'val')
    cacheStore.get('https://devforge.internal/test') // hit
    cacheStore.get('https://devforge.internal/non-existent') // miss

    const stats = cacheStore.getStats()
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
    expect(stats.hitRatePercent).toBe(50)
  })
})
