/**
 * @fileoverview Motor de Comparación Criptográfica en Tiempo Constante y Auditoría de Timing Attacks (Mejora 87).
 *
 * SEGURIDAD DE LA INFORMACIÓN & MITIGACIÓN DE CANALES LATERALES:
 * - Mitigación estricta de CWE-208: Observable Timing Discrepancy (Discrepancia Temporal Observable).
 * - Comparación de tokens de sesión, firmas HMAC, hashes y API Keys en tiempo constante O(N).
 * - Algoritmo de acumulación XOR bit a bit sin salida anticipada (no early-exit short circuit).
 * - Simulador estadístico de ataque por canal lateral y cálculo de varianza temporal / t-test.
 *
 * @module utils/timingAttackComparator
 */

/**
 * Comparación insegura con salida anticipada (Early-Exit).
 * VULNERABLE a Timing Attacks por canal lateral (CWE-208).
 *
 * @param {string} a - Secreto en servidor
 * @param {string} b - Candidato enviado por cliente
 * @returns {{ equals: boolean, opsCount: number, simulatedNs: number, mismatchIndex: number }}
 */
export function vulnerableCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return { equals: false, opsCount: 0, simulatedNs: 0, mismatchIndex: -1 }
  }

  // Base overhead
  let opsCount = 1
  const BASE_NS_PER_CHAR = 45 // Nanosegundos simulados por byte comprobado
  const BASE_JITTER = 5

  if (a.length !== b.length) {
    // Falla de inmediato por longitud (fuga de longitud)
    return {
      equals: false,
      opsCount: 1,
      simulatedNs: 10 + Math.random() * BASE_JITTER,
      mismatchIndex: 0,
    }
  }

  for (let i = 0; i < a.length; i++) {
    opsCount++
    if (a.charCodeAt(i) !== b.charCodeAt(i)) {
      // Early-exit inmediato al encontrar el primer byte disonante
      return {
        equals: false,
        opsCount,
        simulatedNs: (i + 1) * BASE_NS_PER_CHAR + Math.random() * BASE_JITTER,
        mismatchIndex: i,
      }
    }
  }

  return {
    equals: true,
    opsCount,
    simulatedNs: a.length * BASE_NS_PER_CHAR + Math.random() * BASE_JITTER,
    mismatchIndex: -1,
  }
}

/**
 * Comparador criptográfico en Tiempo Constante (Constant-Time String / Buffer Equality).
 * Implementación segura basada en XOR bit a bit sin early-exit (equivalente a crypto.timingSafeEqual).
 *
 * @param {string} a - Secreto en servidor
 * @param {string} b - Candidato enviado por cliente
 * @returns {{ equals: boolean, opsCount: number, simulatedNs: number, mismatchIndex: number }}
 */
export function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return { equals: false, opsCount: 0, simulatedNs: 0, mismatchIndex: -1 }
  }

  const BASE_NS_PER_CHAR = 45
  const BASE_JITTER = 5

  // Longitud fija evaluada basada en la longitud de 'a' para evitar timing leak
  const lenA = a.length
  const lenB = b.length
  let mismatch = lenA ^ lenB // Si son distintas longitudes, mismatch != 0

  let opsCount = 1
  const maxLen = Math.max(lenA, lenB)

  for (let i = 0; i < maxLen; i++) {
    opsCount++
    const charA = i < lenA ? a.charCodeAt(i) : 0
    const charB = i < lenB ? b.charCodeAt(i) : 0
    mismatch |= (charA ^ charB) // Acumulación XOR constante sin break ni return
  }

  // Tiempo idéntico proporcional únicamente a maxLen
  const totalNs = maxLen * BASE_NS_PER_CHAR + Math.random() * BASE_JITTER

  return {
    equals: mismatch === 0,
    opsCount,
    simulatedNs: totalNs,
    mismatchIndex: mismatch === 0 ? -1 : -2, // No revelamos la posición del fallo
  }
}

/**
 * Genera una firma HMAC simulada determinista en hex para pruebas.
 * @param {string} message
 * @param {string} secretKey
 * @returns {string} Firma hex de 32 caracteres
 */
export function generateSimulatedHmac(message, secretKey) {
  let hash = 0x811c9dc5
  const combined = `${message}:${secretKey}`
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
    hash = hash >>> 0
  }
  const hex = ('00000000' + hash.toString(16)).slice(-8)
  return `hmac_sha256_${hex}_${(hash * 31 >>> 0).toString(16).slice(-8)}`
}

/**
 * Ejecuta un benchmark estadístico de ataque por canal lateral midiendo
 * los tiempos de respuesta en función del prefijo coincidente.
 *
 * @param {string} secretToken - Token secreto a atacar (ej. 'SECRET_API_KEY_1234')
 * @param {number} [trialsPerPrefix=100] - Cantidad de muestras para promediar
 * @returns {{
 *   vulnerableResults: Array<{ prefixLength: number, avgNs: number, variance: number }>,
 *   constantTimeResults: Array<{ prefixLength: number, avgNs: number, variance: number }>,
 *   isVulnerableLeakDetected: boolean,
 *   correlationCoefficient: number
 * }}
 */
export function runTimingAttackAudit(secretToken = 'DEVFORGE_KEY_987654321', trialsPerPrefix = 100) {
  const tokenLen = secretToken.length
  const vulnerableResults = []
  const constantTimeResults = []

  for (let matchLen = 0; matchLen <= tokenLen; matchLen++) {
    // Construir candidato que coincide exactamente en 'matchLen' caracteres
    let candidate = secretToken.substring(0, matchLen)
    if (matchLen < tokenLen) {
      // Carácter erróneo en la posición matchLen
      const correctCode = secretToken.charCodeAt(matchLen)
      const wrongChar = String.fromCharCode(correctCode === 65 ? 66 : 65)
      candidate += wrongChar
      // Rellenar resto
      candidate += 'X'.repeat(tokenLen - matchLen - 1)
    }

    // Medición Vulnerable
    const vulnTimes = []
    for (let t = 0; t < trialsPerPrefix; t++) {
      const res = vulnerableCompare(secretToken, candidate)
      vulnTimes.push(res.simulatedNs)
    }
    const vulnAvg = vulnTimes.reduce((a, b) => a + b, 0) / vulnTimes.length
    const vulnVar = vulnTimes.reduce((a, b) => a + Math.pow(b - vulnAvg, 2), 0) / vulnTimes.length

    vulnerableResults.push({
      prefixLength: matchLen,
      avgNs: Number(vulnAvg.toFixed(2)),
      variance: Number(vulnVar.toFixed(4)),
    })

    // Medición Constant-Time
    const constTimes = []
    for (let t = 0; t < trialsPerPrefix; t++) {
      const res = constantTimeCompare(secretToken, candidate)
      constTimes.push(res.simulatedNs)
    }
    const constAvg = constTimes.reduce((a, b) => a + b, 0) / constTimes.length
    const constVar = constTimes.reduce((a, b) => a + Math.pow(b - constAvg, 2), 0) / constTimes.length

    constantTimeResults.push({
      prefixLength: matchLen,
      avgNs: Number(constAvg.toFixed(2)),
      variance: Number(constVar.toFixed(4)),
    })
  }

  // Calcular correlación de Pearson entre prefixLength y avgNs en modo vulnerable
  const n = vulnerableResults.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  vulnerableResults.forEach((r) => {
    const x = r.prefixLength
    const y = r.avgNs
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
    sumY2 += y * y
  })
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  const correlationCoefficient = denominator === 0 ? 0 : Number((numerator / denominator).toFixed(4))

  // Si correlación > 0.85, hay fuga flagrante por canal lateral temporal
  const isVulnerableLeakDetected = correlationCoefficient > 0.85

  return {
    vulnerableResults,
    constantTimeResults,
    isVulnerableLeakDetected,
    correlationCoefficient,
  }
}
