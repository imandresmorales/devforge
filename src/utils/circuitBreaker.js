/**
 * @fileoverview Patrón de Resiliencia Circuit Breaker para microservicios y APIs distribuidas (Mejora 49).
 *
 * CARACTERÍSTICAS:
 * - Máquina de estados canónica: CLOSED (Normal), OPEN (Fallo Rápido), HALF_OPEN (Prueba de Recuperación).
 * - Umbral de fallos consecutivos configurable y timeout de enfriamiento automático.
 * - Soporte para respuestas de contingencia (Fallback).
 * - Registro de métricas de fiabilidad y llamadas rechazadas.
 *
 * @module utils/circuitBreaker
 */

export const CB_STATE = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
}

export class CircuitBreaker {
  /**
   * @param {Object} [options={}]
   * @param {number} [options.failureThreshold=3] - Fallos consecutivos para abrir el circuito
   * @param {number} [options.recoveryTimeout=3000] - Tiempo de enfriamiento en ms antes de pasar a HALF_OPEN
   * @param {number} [options.successThreshold=2] - Éxitos necesarios en HALF_OPEN para cerrar el circuito
   */
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3
    this.recoveryTimeout = options.recoveryTimeout || 3000
    this.successThreshold = options.successThreshold || 2

    this.state = CB_STATE.CLOSED
    this.consecutiveFailures = 0
    this.consecutiveSuccesses = 0
    this.lastStateChange = Date.now()
    this.nextAttemptTime = 0

    this.totalCalls = 0
    this.successfulCalls = 0
    this.failedCalls = 0
    this.rejectedCalls = 0
  }

  /**
   * Evalúa si el circuito debe pasar de OPEN a HALF_OPEN por expiración del timeout.
   */
  checkStateTransition() {
    const now = Date.now()
    if (this.state === CB_STATE.OPEN && now >= this.nextAttemptTime) {
      this.state = CB_STATE.HALF_OPEN
      this.consecutiveSuccesses = 0
      this.lastStateChange = now
    }
  }

  /**
   * Ejecuta una acción remota a través del Circuit Breaker con soporte para fallback.
   *
   * @template T
   * @param {() => Promise<T>|T} actionFn - Operación de red a ejecutar
   * @param {(error: Error|null) => T} [fallbackFn] - Función de contingencia si el circuito está OPEN o la acción falla
   * @returns {Promise<{ result: T, fromFallback: boolean, state: string, latencyMs: number }>}
   */
  async execute(actionFn, fallbackFn) {
    this.checkStateTransition()
    this.totalCalls++
    const startTime = Date.now()

    // 1. Si el circuito está OPEN, fallo rápido (Fail Fast) sin invocar el microservicio
    if (this.state === CB_STATE.OPEN) {
      this.rejectedCalls++
      const fallbackResult = fallbackFn
        ? await fallbackFn(new Error('Circuit Breaker is OPEN: microservice calls are temporarily blocked.'))
        : null

      return {
        result: fallbackResult,
        fromFallback: true,
        state: this.state,
        latencyMs: Date.now() - startTime,
      }
    }

    // 2. Intentar ejecutar la acción
    try {
      const result = await actionFn()
      this.onSuccess()
      return {
        result,
        fromFallback: false,
        state: this.state,
        latencyMs: Date.now() - startTime,
      }
    } catch (err) {
      this.onFailure()
      const fallbackResult = fallbackFn ? await fallbackFn(err) : null
      return {
        result: fallbackResult,
        fromFallback: true,
        state: this.state,
        latencyMs: Date.now() - startTime,
      }
    }
  }

  onSuccess() {
    this.successfulCalls++
    this.consecutiveFailures = 0

    if (this.state === CB_STATE.HALF_OPEN) {
      this.consecutiveSuccesses++
      if (this.consecutiveSuccesses >= this.successThreshold) {
        this.state = CB_STATE.CLOSED
        this.consecutiveSuccesses = 0
        this.lastStateChange = Date.now()
      }
    }
  }

  onFailure() {
    this.failedCalls++
    this.consecutiveFailures++

    if (this.state === CB_STATE.HALF_OPEN || this.consecutiveFailures >= this.failureThreshold) {
      this.state = CB_STATE.OPEN
      this.lastStateChange = Date.now()
      this.nextAttemptTime = Date.now() + this.recoveryTimeout
      this.consecutiveSuccesses = 0
    }
  }

  getMetrics() {
    this.checkStateTransition()
    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      failureThreshold: this.failureThreshold,
      totalCalls: this.totalCalls,
      successfulCalls: this.successfulCalls,
      failedCalls: this.failedCalls,
      rejectedCalls: this.rejectedCalls,
      cooldownRemainingMs:
        this.state === CB_STATE.OPEN ? Math.max(0, this.nextAttemptTime - Date.now()) : 0,
    }
  }

  reset() {
    this.state = CB_STATE.CLOSED
    this.consecutiveFailures = 0
    this.consecutiveSuccesses = 0
    this.nextAttemptTime = 0
    this.lastStateChange = Date.now()
  }
}
