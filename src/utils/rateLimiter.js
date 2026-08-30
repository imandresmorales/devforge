/**
 * @fileoverview Motor de Rate Limiting con Algoritmo Token Bucket y gestión de HTTP 429 (Mejora 45).
 *
 * CARACTERÍSTICAS:
 * - Implementación canónica del algoritmo Token Bucket con recarga continua.
 * - Cálculo de cabeceras de respuesta estándar de control de tasa:
 *   `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.
 * - Mitigación en capa de aplicación contra ataques de fuerza bruta y saturación DDoS.
 *
 * @module utils/rateLimiter
 */

export class TokenBucketLimiter {
  /**
   * @param {number} capacity - Capacidad máxima del balde (tokens)
   * @param {number} refillRatePerSec - Tasa de recarga (tokens por segundo)
   */
  constructor(capacity = 10, refillRatePerSec = 2) {
    this.capacity = capacity
    this.refillRate = refillRatePerSec
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  /**
   * Recarga los tokens acumulados en base al tiempo transcurrido.
   */
  refill() {
    const now = Date.now()
    const elapsedSeconds = (now - this.lastRefill) / 1000
    if (elapsedSeconds > 0) {
      const tokensToAdd = elapsedSeconds * this.refillRate
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
      this.lastRefill = now
    }
  }

  /**
   * Intenta consumir una cantidad de tokens.
   * @param {number} [count=1] - Cantidad de tokens a consumir
   * @returns {{ allowed: boolean, status: number, statusText: string, remaining: number, limit: number, resetInSec: number, retryAfter: number | null }}
   */
  consume(count = 1) {
    this.refill()

    const limit = this.capacity
    const resetInSec = Math.max(0, Math.ceil((this.capacity - this.tokens) / this.refillRate))

    if (this.tokens >= count) {
      this.tokens -= count
      const remaining = Math.floor(this.tokens)
      return {
        allowed: true,
        status: 200,
        statusText: 'OK',
        remaining,
        limit,
        resetInSec,
        retryAfter: null,
      }
    }

    // Balde agotado -> HTTP 429 Too Many Requests
    const missingTokens = count - this.tokens
    const retryAfter = Math.max(1, Math.ceil(missingTokens / this.refillRate))
    const remaining = Math.floor(this.tokens)

    return {
      allowed: false,
      status: 429,
      statusText: 'Too Many Requests',
      remaining,
      limit,
      resetInSec,
      retryAfter,
    }
  }

  /**
   * Obtiene las métricas actuales del balde.
   */
  getMetrics() {
    this.refill()
    return {
      tokens: Number(this.tokens.toFixed(1)),
      capacity: this.capacity,
      refillRate: this.refillRate,
      fillPercentage: Math.round((this.tokens / this.capacity) * 100),
    }
  }

  /**
   * Reinicia el balde a su capacidad máxima.
   */
  reset() {
    this.tokens = this.capacity
    this.lastRefill = Date.now()
  }
}

// Instancia compartida para la simulación
export const globalRateLimiter = new TokenBucketLimiter(10, 2)
