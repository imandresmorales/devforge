/**
 * @fileoverview Motor de Resiliencia y Patrón de Reintentos (Retry Pattern) con Exponential Backoff y Jitter.
 *
 * Implementa las mejores prácticas de resiliencia en sistemas distribuidos (AWS Architecture & Google Cloud SRE):
 * - Modos de Backoff: Fijo (Fixed), Lineal (Linear), Exponencial Puro (Exponential).
 * - Algoritmos de Jitter (Mitigación de Thundering Herd):
 *   - Full Jitter: Sleep = random(0, min(maxDelay, baseDelay * 2^attempt))
 *   - Equal Jitter: Sleep = (temp / 2) + random(0, temp / 2)
 *   - Decorrelated Jitter: Sleep = min(maxDelay, random(baseDelay, prevSleep * 3))
 * - Clasificación de Errores: Reintentables (500, 502, 503, 504, 429, Timeout) vs No Reintentables (400, 401, 403, 404, 422).
 * - Historial y métricas de ejecución (tiempo total, intentos, demoras calculadas).
 *
 * @module utils/retryEngine
 */

export const JITTER_STRATEGIES = {
  NONE: 'NONE',
  FULL: 'FULL',
  EQUAL: 'EQUAL',
  DECORRELATED: 'DECORRELATED',
}

export const BACKOFF_TYPES = {
  FIXED: 'FIXED',
  LINEAR: 'LINEAR',
  EXPONENTIAL: 'EXPONENTIAL',
}

/**
 * Calcula el tiempo de espera (delay) en milisegundos para un intento dado.
 *
 * @param {number} attempt - Número de intento actual (0-indexed o 1-indexed).
 * @param {Object} config - Configuración del retry.
 * @param {string} [config.backoffType=BACKOFF_TYPES.EXPONENTIAL] - Tipo de progresión.
 * @param {number} [config.baseDelay=200] - Delay base inicial en ms.
 * @param {number} [config.maxDelay=5000] - Delay tope máximo en ms.
 * @param {number} [config.factor=2] - Factor multiplicador exponencial.
 * @param {string} [config.jitter=JITTER_STRATEGIES.FULL] - Estrategia de jitter.
 * @param {number} [config.prevDelay=0] - Delay anterior (para Decorrelated Jitter).
 * @param {() => number} [config.randomFn=Math.random] - Función generadora de aleatoriedad (para testing determinista).
 * @returns {number} Tiempo de espera calculado en milisegundos (entero >= 0).
 */
export function calculateRetryDelay(attempt, config = {}) {
  const {
    backoffType = BACKOFF_TYPES.EXPONENTIAL,
    baseDelay = 200,
    maxDelay = 5000,
    factor = 2,
    jitter = JITTER_STRATEGIES.FULL,
    prevDelay = 0,
    randomFn = Math.random,
  } = config

  const safeAttempt = Math.max(0, attempt)
  let calculatedDelay = baseDelay

  // 1. Calcular Delay base según el tipo de progresión
  if (backoffType === BACKOFF_TYPES.FIXED) {
    calculatedDelay = baseDelay
  } else if (backoffType === BACKOFF_TYPES.LINEAR) {
    calculatedDelay = baseDelay * (safeAttempt + 1)
  } else {
    // Exponencial: base * factor^attempt
    calculatedDelay = baseDelay * Math.pow(factor, safeAttempt)
  }

  // Aplicar límite superior
  const cappedDelay = Math.min(maxDelay, calculatedDelay)

  // 2. Aplicar algoritmo de Jitter
  let finalDelay = cappedDelay

  switch (jitter) {
    case JITTER_STRATEGIES.FULL:
      // random(0, cappedDelay)
      finalDelay = randomFn() * cappedDelay
      break

    case JITTER_STRATEGIES.EQUAL:
      // (cappedDelay / 2) + random(0, cappedDelay / 2)
      finalDelay = (cappedDelay / 2) + (randomFn() * (cappedDelay / 2))
      break

    case JITTER_STRATEGIES.DECORRELATED: {
      // min(maxDelay, random(baseDelay, prevDelay * 3))
      const prev = prevDelay > 0 ? prevDelay : baseDelay
      const rangeMin = baseDelay
      const rangeMax = prev * 3
      const randVal = rangeMin + randomFn() * Math.max(0, rangeMax - rangeMin)
      finalDelay = Math.min(maxDelay, randVal)
      break
    }

    case JITTER_STRATEGIES.NONE:
    default:
      finalDelay = cappedDelay
      break
  }

  return Math.round(Math.max(0, finalDelay))
}

/**
 * Determina si un error HTTP o de red es transitorio y por tanto reintentable.
 *
 * @param {Error|{ status?: number, code?: string }} error - Error producido.
 * @returns {boolean} True si debe reintentarse.
 */
export function isRetryableError(error) {
  if (!error) return false

  const status = error.status || error.statusCode || error.response?.status
  const code = error.code

  // Códigos de error de red / timeout comunes
  if (code && ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN', 'NETWORK_ERROR'].includes(code)) {
    return true
  }

  // Si no hay status y es timeout o error de fetch
  if (!status) {
    const msg = (error.message || '').toLowerCase()
    return msg.includes('timeout') || msg.includes('network') || msg.includes('failed to fetch')
  }

  // 429 Too Many Requests: Reintentable
  if (status === 429) return true

  // 5xx Server Errors transitorios: 500, 502, 503, 504
  if ([500, 502, 503, 504].includes(status)) return true

  // 4xx Client Errors: No reintentables (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, etc.)
  return false
}

/**
 * Ejecuta una función asíncrona con reintentos automáticos, backoff y jitter.
 *
 * @param {Function} asyncFn - Función a ejecutar que retorna una Promesa.
 * @param {Object} [options] - Parámetros de resiliencia.
 * @param {number} [options.maxRetries=3] - Número máximo de reintentos.
 * @param {number} [options.baseDelay=150] - Delay base inicial en ms.
 * @param {number} [options.maxDelay=3000] - Delay máximo en ms.
 * @param {number} [options.factor=2] - Factor multiplicador.
 * @param {string} [options.backoffType=BACKOFF_TYPES.EXPONENTIAL] - Tipo de backoff.
 * @param {string} [options.jitter=JITTER_STRATEGIES.FULL] - Estrategia de jitter.
 * @param {Function} [options.onRetry] - Callback invocado antes de cada reintento: (attempt, delay, error) => void.
 * @param {Function} [options.shouldRetry] - Predicado personalizado: (error) => boolean.
 * @returns {Promise<{ result: any, attempts: number, totalDelay: number, history: Array<Object> }>}
 */
export async function executeWithRetry(asyncFn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 150,
    maxDelay = 3000,
    factor = 2,
    backoffType = BACKOFF_TYPES.EXPONENTIAL,
    jitter = JITTER_STRATEGIES.FULL,
    onRetry = null,
    shouldRetry = isRetryableError,
  } = options

  const history = []
  let prevDelay = 0
  let totalDelay = 0

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const startTime = Date.now()
    try {
      const result = await asyncFn(attempt)
      history.push({
        attempt,
        status: 'SUCCESS',
        delay: attempt === 0 ? 0 : prevDelay,
        duration: Date.now() - startTime,
      })

      return {
        result,
        attempts: attempt + 1,
        totalDelay,
        history,
      }
    } catch (err) {
      const isRetryable = shouldRetry(err)
      const hasRetriesLeft = attempt < maxRetries

      if (!isRetryable || !hasRetriesLeft) {
        history.push({
          attempt,
          status: 'FAILED',
          error: err.message || String(err),
          isRetryable,
          duration: Date.now() - startTime,
        })
        throw Object.assign(err, { retryHistory: history, attempts: attempt + 1, totalDelay })
      }

      const delay = calculateRetryDelay(attempt, {
        backoffType,
        baseDelay,
        maxDelay,
        factor,
        jitter,
        prevDelay,
      })

      prevDelay = delay
      totalDelay += delay

      history.push({
        attempt,
        status: 'RETRYING',
        error: err.message || String(err),
        nextDelay: delay,
        duration: Date.now() - startTime,
      })

      if (typeof onRetry === 'function') {
        onRetry(attempt + 1, delay, err)
      }

      // Esperar antes del siguiente intento
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}
