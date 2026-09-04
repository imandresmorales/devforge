import { describe, it, expect, beforeEach } from 'vitest'
import { DistributedCacheSimulator } from './cacheEngine'

describe('Motor de Simulación de Caché Distribuida (cacheEngine.js)', () => {
  let cache

  beforeEach(() => {
    cache = new DistributedCacheSimulator({ capacity: 3, policy: 'LRU' })
  })

  describe('Operaciones Básicas y Métricas', () => {
    it('almacena y recupera valores correctamente (HIT)', () => {
      cache.set('user:1', 'Alice')
      const val = cache.get('user:1')

      expect(val).toBe('Alice')
      const stats = cache.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(0)
      expect(stats.hitRatio).toBe(100)
    })

    it('registra un MISS si la clave no existe', () => {
      const val = cache.get('not_found')
      expect(val).toBeNull()

      const stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(1)
      expect(stats.hitRatio).toBe(0)
    })

    it('invalida claves manualmente con delete y clear', () => {
      cache.set('k1', 'v1')
      cache.set('k2', 'v2')
      expect(cache.has('k1')).toBe(true)

      cache.delete('k1')
      expect(cache.has('k1')).toBe(false)
      expect(cache.get('k1')).toBeNull()

      cache.clear(true)
      expect(cache.getStats().size).toBe(0)
      expect(cache.getStats().hits).toBe(0)
    })
  })

  describe('Política de Desalojo LRU (Least Recently Used)', () => {
    it('desaloja el elemento menos recientemente utilizado al exceder la capacidad', () => {
      cache.set('A', 1)
      cache.set('B', 2)
      cache.set('C', 3)

      // Accedemos a A (haciendo que B sea el menos recientemente accedido)
      cache.get('A')

      // Insertamos D -> B debe ser desalojado
      const { evictedKey } = cache.set('D', 4)

      expect(evictedKey).toBe('B')
      expect(cache.has('B')).toBe(false)
      expect(cache.has('A')).toBe(true)
      expect(cache.has('C')).toBe(true)
      expect(cache.has('D')).toBe(true)
      expect(cache.getStats().evictions).toBe(1)
    })
  })

  describe('Política de Desalojo LFU (Least Frequently Used)', () => {
    it('desaloja el elemento con menor frecuencia de acceso al exceder la capacidad', () => {
      const lfuCache = new DistributedCacheSimulator({ capacity: 3, policy: 'LFU' })

      lfuCache.set('A', 1)
      lfuCache.set('B', 2)
      lfuCache.set('C', 3)

      // Aumentamos frecuencia de A y B
      lfuCache.get('A') // freq 2
      lfuCache.get('A') // freq 3
      lfuCache.get('B') // freq 2

      // C tiene freq 1. Al insertar D, C debe ser desalojado
      const { evictedKey } = lfuCache.set('D', 4)

      expect(evictedKey).toBe('C')
      expect(lfuCache.has('C')).toBe(false)
      expect(lfuCache.has('A')).toBe(true)
      expect(lfuCache.has('B')).toBe(true)
    })
  })

  describe('Política de Desalojo FIFO (First In, First Out)', () => {
    it('desaloja el elemento más antiguo por tiempo de creación', () => {
      const fifoCache = new DistributedCacheSimulator({ capacity: 3, policy: 'FIFO' })

      fifoCache.set('A', 1)
      fifoCache.set('B', 2)
      fifoCache.set('C', 3)

      // Accedemos a A repetidamente
      fifoCache.get('A')
      fifoCache.get('A')

      // Insertamos D -> A debe ser desalojado por ser el primer insertado
      const { evictedKey } = fifoCache.set('D', 4)

      expect(evictedKey).toBe('A')
      expect(fifoCache.has('A')).toBe(false)
      expect(fifoCache.has('B')).toBe(true)
      expect(fifoCache.has('C')).toBe(true)
    })
  })

  describe('Expiración por TTL (Time-To-Live)', () => {
    it('retorna null y cuenta como expiración si el TTL ha vencido', async () => {
      cache.set('session:temp', 'token123', { ttlMs: 20 })

      // Inmediato -> Válido
      expect(cache.get('session:temp')).toBe('token123')

      // Esperar a que venza el TTL
      await new Promise((resolve) => setTimeout(resolve, 35))

      expect(cache.get('session:temp')).toBeNull()
      const stats = cache.getStats()
      expect(stats.expirations).toBe(1)
      expect(stats.misses).toBe(1)
    })
  })

  describe('Simulación de Tráfico Concurrente', () => {
    it('genera eventos de hit y miss y calcula el hit ratio', () => {
      const events = cache.simulateWorkload(10)
      expect(events.length).toBe(10)

      const stats = cache.getStats()
      expect(stats.totalRequests).toBe(10)
      expect(stats.hitRatio).toBeGreaterThanOrEqual(0)
    })
  })
})
