import { describe, it, expect, beforeEach } from 'vitest'
import { TokenBucketLimiter } from './rateLimiter'

describe('Rate Limiter & Token Bucket Algorithm (rateLimiter.js)', () => {
  let limiter

  beforeEach(() => {
    limiter = new TokenBucketLimiter(5, 1) // 5 tokens, 1 token/seg
  })

  it('debe permitir peticiones iniciales dentro del límite (HTTP 200)', () => {
    const res = limiter.consume(1)
    expect(res.allowed).toBe(true)
    expect(res.status).toBe(200)
    expect(res.remaining).toBe(4)
    expect(res.retryAfter).toBeNull()
  })

  it('debe rechazar peticiones cuando se agotan los tokens (HTTP 429)', () => {
    // Agotar los 5 tokens
    for (let i = 0; i < 5; i++) {
      limiter.consume(1)
    }

    // La sexta petición debe ser rechazada
    const blocked = limiter.consume(1)
    expect(blocked.allowed).toBe(false)
    expect(blocked.status).toBe(429)
    expect(blocked.statusText).toBe('Too Many Requests')
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('debe calcular métricas y porcentaje de llenado correctamente', () => {
    const metrics = limiter.getMetrics()
    expect(metrics.capacity).toBe(5)
    expect(metrics.fillPercentage).toBe(100)

    limiter.consume(2)
    const updated = limiter.getMetrics()
    expect(updated.fillPercentage).toBe(60)
  })

  it('debe reiniciar el balde a su capacidad máxima con reset()', () => {
    limiter.consume(5)
    expect(limiter.getMetrics().fillPercentage).toBe(0)

    limiter.reset()
    expect(limiter.getMetrics().fillPercentage).toBe(100)
  })
})
