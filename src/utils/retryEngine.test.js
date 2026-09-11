/**
 * @fileoverview Tests unitarios para el Motor de Resiliencia y Retry Pattern.
 */
import { describe, it, expect, vi } from 'vitest'
import {
  calculateRetryDelay,
  isRetryableError,
  executeWithRetry,
  JITTER_STRATEGIES,
  BACKOFF_TYPES,
} from './retryEngine'

describe('Retry Engine — Backoff, Jitter & Error Classification', () => {
  describe('calculateRetryDelay', () => {
    it('debe calcular delay exponencial sin jitter correctamente', () => {
      const config = {
        backoffType: BACKOFF_TYPES.EXPONENTIAL,
        baseDelay: 100,
        factor: 2,
        maxDelay: 5000,
        jitter: JITTER_STRATEGIES.NONE,
      }

      expect(calculateRetryDelay(0, config)).toBe(100) // 100 * 2^0 = 100
      expect(calculateRetryDelay(1, config)).toBe(200) // 100 * 2^1 = 200
      expect(calculateRetryDelay(2, config)).toBe(400) // 100 * 2^2 = 400
      expect(calculateRetryDelay(3, config)).toBe(800) // 100 * 2^3 = 800
    })

    it('debe respetar el límite de maxDelay', () => {
      const config = {
        backoffType: BACKOFF_TYPES.EXPONENTIAL,
        baseDelay: 1000,
        factor: 2,
        maxDelay: 2500,
        jitter: JITTER_STRATEGIES.NONE,
      }

      expect(calculateRetryDelay(0, config)).toBe(1000)
      expect(calculateRetryDelay(1, config)).toBe(2000)
      expect(calculateRetryDelay(2, config)).toBe(2500) // Cap at maxDelay
      expect(calculateRetryDelay(5, config)).toBe(2500)
    })

    it('debe aplicar Full Jitter dentro del rango [0, cappedDelay]', () => {
      const mockRandom = () => 0.5 // 50%
      const config = {
        backoffType: BACKOFF_TYPES.EXPONENTIAL,
        baseDelay: 200,
        factor: 2,
        maxDelay: 5000,
        jitter: JITTER_STRATEGIES.FULL,
        randomFn: mockRandom,
      }

      // intento 1: 200 * 2^1 = 400. Con random 0.5 => 200
      expect(calculateRetryDelay(1, config)).toBe(200)
    })

    it('debe calcular Linear y Fixed Backoff', () => {
      const fixedConfig = { backoffType: BACKOFF_TYPES.FIXED, baseDelay: 300, jitter: JITTER_STRATEGIES.NONE }
      expect(calculateRetryDelay(0, fixedConfig)).toBe(300)
      expect(calculateRetryDelay(3, fixedConfig)).toBe(300)

      const linearConfig = { backoffType: BACKOFF_TYPES.LINEAR, baseDelay: 100, jitter: JITTER_STRATEGIES.NONE }
      expect(calculateRetryDelay(0, linearConfig)).toBe(100) // 100 * 1
      expect(calculateRetryDelay(1, linearConfig)).toBe(200) // 100 * 2
      expect(calculateRetryDelay(2, linearConfig)).toBe(300) // 100 * 3
    })
  })

  describe('isRetryableError', () => {
    it('debe identificar errores 5xx y 429 como reintentables', () => {
      expect(isRetryableError({ status: 500 })).toBe(true)
      expect(isRetryableError({ status: 502 })).toBe(true)
      expect(isRetryableError({ status: 503 })).toBe(true)
      expect(isRetryableError({ status: 504 })).toBe(true)
      expect(isRetryableError({ status: 429 })).toBe(true)
    })

    it('debe clasificar errores de red o timeout como reintentables', () => {
      expect(isRetryableError({ code: 'ECONNRESET' })).toBe(true)
      expect(isRetryableError({ code: 'ETIMEDOUT' })).toBe(true)
      expect(isRetryableError(new Error('Network request failed'))).toBe(true)
    })

    it('NO debe reintentar errores de cliente 4xx definitivos (400, 401, 403, 404, 422)', () => {
      expect(isRetryableError({ status: 400 })).toBe(false)
      expect(isRetryableError({ status: 401 })).toBe(false)
      expect(isRetryableError({ status: 403 })).toBe(false)
      expect(isRetryableError({ status: 404 })).toBe(false)
      expect(isRetryableError({ status: 422 })).toBe(false)
    })
  })

  describe('executeWithRetry', () => {
    it('debe retornar inmediatamente en el primer intento exitoso', async () => {
      const mockFn = vi.fn().mockResolvedValue('API_DATA_OK')

      const res = await executeWithRetry(mockFn, { maxRetries: 3 })
      expect(res.result).toBe('API_DATA_OK')
      expect(res.attempts).toBe(1)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('debe reintentar tras fallos transitorios y resolver cuando tenga éxito', async () => {
      let callCount = 0
      const mockFn = vi.fn().mockImplementation(async () => {
        callCount++
        if (callCount < 3) {
          const err = new Error('503 Service Unavailable')
          err.status = 503
          throw err
        }
        return 'SUCCESS_AFTER_RETRY'
      })

      const onRetryMock = vi.fn()

      const res = await executeWithRetry(mockFn, {
        maxRetries: 3,
        baseDelay: 10,
        maxDelay: 50,
        onRetry: onRetryMock,
      })

      expect(res.result).toBe('SUCCESS_AFTER_RETRY')
      expect(res.attempts).toBe(3)
      expect(onRetryMock).toHaveBeenCalledTimes(2)
      expect(res.history.length).toBe(3)
    })

    it('debe abortar de inmediato si el error no es reintentable (ej. 401 Unauthorized)', async () => {
      const mockFn = vi.fn().mockImplementation(async () => {
        const err = new Error('Invalid Credentials')
        err.status = 401
        throw err
      })

      await expect(executeWithRetry(mockFn, { maxRetries: 3, baseDelay: 10 })).rejects.toThrow('Invalid Credentials')
      expect(mockFn).toHaveBeenCalledTimes(1) // No reintenta
    })
  })
})
