import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CircuitBreaker, CB_STATE } from './circuitBreaker'

describe('Microservice Circuit Breaker Pattern (circuitBreaker.js)', () => {
  let cb

  beforeEach(() => {
    cb = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 1000,
      successThreshold: 2,
    })
  })

  it('debe iniciar en estado CLOSED y ejecutar operaciones exitosas', async () => {
    const res = await cb.execute(() => 'OK 200', () => 'FALLBACK')

    expect(res.result).toBe('OK 200')
    expect(res.fromFallback).toBe(false)
    expect(cb.getMetrics().state).toBe(CB_STATE.CLOSED)
  })

  it('debe abrir el circuito (OPEN) tras alcanzar el umbral de fallos consecutivos', async () => {
    const failingAction = () => {
      throw new Error('500 Internal Server Error')
    }

    // 3 fallos consecutivos
    await cb.execute(failingAction, () => 'FALLBACK')
    await cb.execute(failingAction, () => 'FALLBACK')
    const third = await cb.execute(failingAction, () => 'FALLBACK')

    expect(third.fromFallback).toBe(true)
    expect(cb.getMetrics().state).toBe(CB_STATE.OPEN)

    // La siguiente llamada debe fallar rápido sin ejecutar la acción
    const spy = vi.fn()
    const fastFail = await cb.execute(spy, () => 'FALLBACK_FAST')
    expect(spy).not.toHaveBeenCalled()
    expect(fastFail.result).toBe('FALLBACK_FAST')
  })

  it('debe reiniciar el estado a CLOSED al invocar reset()', () => {
    cb.state = CB_STATE.OPEN
    cb.reset()
    expect(cb.getMetrics().state).toBe(CB_STATE.CLOSED)
  })
})
