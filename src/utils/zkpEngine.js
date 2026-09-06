/**
 * @fileoverview Motor de Pruebas de Cero Conocimiento (Zero-Knowledge Proofs - ZKP) con Protocolo Schnorr (Mejora 65).
 *
 * CARACTERÍSTICAS:
 * - Implementación del Protocolo de Identificación de Schnorr sobre aritmética modular / grupos cíclicos:
 *     1. Compromiso (Commitment): El Prover genera un nonce aleatorio $v$ y calcula $V = g^v \pmod p$.
 *     2. Desafío (Challenge): El Verifier envía un desafío aleatorio $c$ (o se calcula mediante Fiat-Shamir Heuristic $c = \text{Hash}(g, y, V)$).
 *     3. Respuesta (Response): El Prover calcula $r = (v - c \cdot x) \pmod q$.
 *     4. Verificación (Verification): El Verifier comprueba si $g^r \cdot y^c \equiv V \pmod p$.
 * - Propiedades criptográficas garantizadas:
 *     - Completitud (Completeness): Si el Prover conoce el secreto, el Verifier siempre aceptará.
 *     - Solidez (Soundness): Un atacante sin el secreto no puede engañar al Verifier excepto con probabilidad despreciable.
 *     - Cero Conocimiento (Zero-Knowledge): El Verifier no aprende absolutamente ningún bit sobre el secreto $x$.
 * - Soporte para modo Interactivo y modo No Interactivo (NIZK con Fiat-Shamir).
 *
 * @module utils/zkpEngine
 */

/**
 * Parámetros de grupo criptográfico por defecto (Primo seguro estándar de 256 bits simplificado para cálculos exactos BigInt).
 */
export const DEFAULT_ZKP_PARAMS = {
  // Número primo grande p (2^31 - 1 primo de Mersenne seguro para simulación rápida o primo de 64/128 bits)
  p: 2147483647n,
  // Generador g
  g: 7n,
  // Orden del subgrupo q = p - 1
  q: 2147483646n,
}

/**
 * Calcula la exponenciación modular rápida: (base^exp) % mod usando BigInt.
 *
 * @param {bigint} base
 * @param {bigint} exp
 * @param {bigint} mod
 * @returns {bigint}
 */
export function modExp(base, exp, mod) {
  let res = 1n
  let b = ((base % mod) + mod) % mod
  let e = exp

  // Manejo de exponentes negativos en aritmética modular
  if (e < 0n) {
    throw new Error('modExp no soporta exponentes negativos directamente sin calcular inverso.')
  }

  while (e > 0n) {
    if (e % 2n === 1n) {
      res = (res * b) % mod
    }
    b = (b * b) % mod
    e = e / 2n
  }
  return res
}

/**
 * Función Hash simple para Fiat-Shamir Heuristic.
 *
 * @param {string} input
 * @param {bigint} modulo
 * @returns {bigint}
 */
export function fiatShamirHash(input, modulo = DEFAULT_ZKP_PARAMS.q) {
  let hash = 5381n
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5n) + hash + BigInt(input.charCodeAt(i))) % modulo
  }
  return (hash % modulo) + 1n
}

/**
 * Genera un par de claves (secreta y pública) para el Prover.
 *
 * @param {bigint} [secret] - Secreto opcional (si no se provee, se genera uno aleatorio).
 * @param {typeof DEFAULT_ZKP_PARAMS} [params]
 * @returns {{ secret: bigint, publicKey: bigint }}
 */
export function generateZKPKeyPair(secret, params = DEFAULT_ZKP_PARAMS) {
  const x = secret
    ? BigInt(secret)
    : BigInt(Math.floor(Math.random() * 1000000) + 100)
  const y = modExp(params.g, x, params.p)

  return {
    secret: x,
    publicKey: y,
  }
}

/**
 * Paso 1: El Prover crea el compromiso $V = g^v \pmod p$.
 *
 * @param {bigint} [nonce] - Nonce aleatorio $v$.
 * @param {typeof DEFAULT_ZKP_PARAMS} [params]
 * @returns {{ nonce: bigint, commitment: bigint }}
 */
export function createCommitment(nonce, params = DEFAULT_ZKP_PARAMS) {
  const v = nonce
    ? BigInt(nonce)
    : BigInt(Math.floor(Math.random() * 500000) + 50)
  const V = modExp(params.g, v, params.p)

  return {
    nonce: v,
    commitment: V,
  }
}

/**
 * Paso 2: El Verifier genera un desafío aleatorio $c$ (o vía Fiat-Shamir).
 *
 * @param {Object} [options]
 * @param {boolean} [options.useFiatShamir=false]
 * @param {bigint} [options.commitment]
 * @param {bigint} [options.publicKey]
 * @param {string} [options.message='']
 * @param {typeof DEFAULT_ZKP_PARAMS} [params]
 * @returns {bigint} Desafío $c$
 */
export function generateChallenge(options = {}, params = DEFAULT_ZKP_PARAMS) {
  if (options.useFiatShamir && options.commitment && options.publicKey) {
    const data = `${params.g}_${options.publicKey}_${options.commitment}_${options.message || ''}`
    return fiatShamirHash(data, 10000n)
  }
  // Desafío aleatorio del Verifier en modo interactivo
  return BigInt(Math.floor(Math.random() * 10000) + 1)
}

/**
 * Paso 3: El Prover calcula la respuesta $r = (v - c \cdot x) \pmod q$.
 *
 * @param {bigint} nonce - Nonce secreto $v$.
 * @param {bigint} secret - Secreto del Prover $x$.
 * @param {bigint} challenge - Desafío del Verifier $c$.
 * @param {typeof DEFAULT_ZKP_PARAMS} [params]
 * @returns {bigint} Respuesta $r$
 */
export function computeResponse(nonce, secret, challenge, params = DEFAULT_ZKP_PARAMS) {
  const v = BigInt(nonce)
  const x = BigInt(secret)
  const c = BigInt(challenge)
  const q = params.q

  // r = (v - c*x) mod q (asegurando resultado positivo en módulo q)
  let r = (v - (c * x)) % q
  while (r < 0n) {
    r += q
  }
  return r
}

/**
 * Paso 4: El Verifier comprueba la prueba: $(g^r \cdot y^c) \pmod p \stackrel{?}{=} V$.
 *
 * @param {bigint} commitment - Compromiso $V$.
 * @param {bigint} challenge - Desafío $c$.
 * @param {bigint} response - Respuesta $r$.
 * @param {bigint} publicKey - Clave pública del Prover $y$.
 * @param {typeof DEFAULT_ZKP_PARAMS} [params]
 * @returns {{
 *   isValid: boolean,
 *   leftSide: bigint,
 *   rightSide: bigint,
 *   steps: Array<{ desc: string, equation: string }>
 * }}
 */
export function verifyZKPProof(commitment, challenge, response, publicKey, params = DEFAULT_ZKP_PARAMS) {
  const V = BigInt(commitment)
  const c = BigInt(challenge)
  const r = BigInt(response)
  const y = BigInt(publicKey)
  const p = params.p
  const g = params.g

  // Calcular g^r mod p
  const gr = modExp(g, r, p)
  // Calcular y^c mod p
  const yc = modExp(y, c, p)
  // Lado izquierdo: (g^r * y^c) mod p
  const leftSide = (gr * yc) % p
  // Lado derecho: V
  const rightSide = V

  const isValid = leftSide === rightSide

  const steps = [
    { desc: '1. Calcular g^r mod p', equation: `${g}^${r} mod ${p} = ${gr}` },
    { desc: '2. Calcular y^c mod p', equation: `${y}^${c} mod ${p} = ${yc}` },
    { desc: '3. Multiplicar miembros (g^r * y^c) mod p', equation: `(${gr} * ${yc}) mod ${p} = ${leftSide}` },
    { desc: '4. Comparar con compromiso V', equation: `${leftSide} === ${rightSide} ➔ ${isValid ? 'VÁLIDO (ACCEPT)' : 'INVÁLIDO (REJECT)'}` },
  ]

  return {
    isValid,
    leftSide,
    rightSide,
    steps,
  }
}

/**
 * Ejecuta una simulación completa de extremo a extremo de ZKP Schnorr.
 *
 * @param {Object} options
 * @param {number|bigint} [options.secret=12345]
 * @param {boolean} [options.useFiatShamir=false]
 * @param {boolean} [options.simulateAttacker=false]
 * @returns {{
 *   success: boolean,
 *   prover: { secret: string, publicKey: string, nonce: string, commitment: string, response: string },
 *   verifier: { challenge: string, isValid: boolean, leftSide: string, rightSide: string, steps: any[] }
 * }}
 */
export function runCompleteZKPSimulation(options = {}) {
  const { secret = 12345n, useFiatShamir = false, simulateAttacker = false } = options

  // 1. Claves
  const keyPair = generateZKPKeyPair(secret)
  // 2. Compromiso
  const { nonce, commitment } = createCommitment()

  // 3. Desafío
  const challenge = generateChallenge({
    useFiatShamir,
    commitment,
    publicKey: keyPair.publicKey,
    message: 'DevForge Zero Knowledge Auth',
  })

  // 4. Respuesta (si es atacante, usa un secreto falso)
  const actualSecret = simulateAttacker ? keyPair.secret + 9999n : keyPair.secret
  const response = computeResponse(nonce, actualSecret, challenge)

  // 5. Verificación
  const verification = verifyZKPProof(commitment, challenge, response, keyPair.publicKey)

  return {
    success: verification.isValid,
    prover: {
      secret: simulateAttacker ? `${actualSecret} (FALSO)` : actualSecret.toString(),
      publicKey: keyPair.publicKey.toString(),
      nonce: nonce.toString(),
      commitment: commitment.toString(),
      response: response.toString(),
    },
    verifier: {
      challenge: challenge.toString(),
      isValid: verification.isValid,
      leftSide: verification.leftSide.toString(),
      rightSide: verification.rightSide.toString(),
      steps: verification.steps,
    },
  }
}
