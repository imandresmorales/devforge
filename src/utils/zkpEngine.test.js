/**
 * @fileoverview Tests unitarios para el Motor de Pruebas de Cero Conocimiento Schnorr (Mejora 65).
 * @module utils/zkpEngine.test
 */
import { describe, it, expect } from 'vitest'
import {
  modExp,
  generateZKPKeyPair,
  createCommitment,
  generateChallenge,
  computeResponse,
  verifyZKPProof,
  runCompleteZKPSimulation,
} from './zkpEngine'

describe('Motor de Pruebas de Cero Conocimiento ZKP Schnorr (zkpEngine.js)', () => {
  it('calcula la exponenciación modular correctamente', () => {
    // 7^3 mod 13 = 343 mod 13 = 5
    expect(modExp(7n, 3n, 13n)).toBe(5n)
    // 2^10 mod 1000 = 1024 mod 1000 = 24
    expect(modExp(2n, 10n, 1000n)).toBe(24n)
  })

  it('completa exitosamente el protocolo interactivo con el secreto legítimo (Completitud)', () => {
    const keyPair = generateZKPKeyPair(424242n)
    const { nonce, commitment } = createCommitment(123456n)
    const challenge = 777n

    const response = computeResponse(nonce, keyPair.secret, challenge)
    const verification = verifyZKPProof(commitment, challenge, response, keyPair.publicKey)

    expect(verification.isValid).toBe(true)
    expect(verification.leftSide).toBe(verification.rightSide)
  })

  it('rechaza la prueba si el Prover utiliza un secreto falso o no posee la clave (Solidez)', () => {
    const keyPair = generateZKPKeyPair(424242n)
    const { nonce, commitment } = createCommitment(123456n)
    const challenge = 777n

    // Intento de engaño con secreto falso
    const fakeSecret = 999999n
    const fakeResponse = computeResponse(nonce, fakeSecret, challenge)
    const verification = verifyZKPProof(commitment, challenge, fakeResponse, keyPair.publicKey)

    expect(verification.isValid).toBe(false)
    expect(verification.leftSide).not.toBe(verification.rightSide)
  })

  it('rechaza la prueba si el desafío o el compromiso son alterados en tránsito', () => {
    const keyPair = generateZKPKeyPair(55555n)
    const { nonce, commitment } = createCommitment(88888n)
    const challenge = 100n
    const response = computeResponse(nonce, keyPair.secret, challenge)

    // Alteración del desafío en el paso de verificación
    const tamperedChallenge = 101n
    const verification = verifyZKPProof(commitment, tamperedChallenge, response, keyPair.publicKey)

    expect(verification.isValid).toBe(false)
  })

  it('ejecuta la simulación no interactiva con la heurística Fiat-Shamir (NIZK)', () => {
    const result = runCompleteZKPSimulation({
      secret: 87654n,
      useFiatShamir: true,
      simulateAttacker: false,
    })

    expect(result.success).toBe(true)
    expect(result.verifier.isValid).toBe(true)
  })

  it('detecta inmediatamente un ataque simulado en runCompleteZKPSimulation', () => {
    const result = runCompleteZKPSimulation({
      secret: 87654n,
      useFiatShamir: false,
      simulateAttacker: true,
    })

    expect(result.success).toBe(false)
    expect(result.verifier.isValid).toBe(false)
  })
})
