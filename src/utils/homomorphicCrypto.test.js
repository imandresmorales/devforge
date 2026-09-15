import { describe, it, expect } from 'vitest'
import {
  generatePaillierKeys,
  encryptPaillier,
  decryptPaillier,
  homomorphicAdd,
  homomorphicMultiplyScalar,
  computeConfidentialPayroll,
  bigGcd,
  bigLcm,
  bigModInverse,
  bigModPow
} from './homomorphicCrypto.js'

describe('homomorphicCrypto — Paillier Additive Homomorphic Scheme', () => {
  it('calcula correctamente funciones matemáticas auxiliares (GCD, LCM, ModInverse, ModPow)', () => {
    expect(bigGcd(54n, 24n)).toBe(6n)
    expect(bigLcm(4n, 6n)).toBe(12n)
    expect(bigModPow(2n, 10n, 1000n)).toBe(24n) // 1024 mod 1000 = 24
    // Inversa de 3 mod 7 es 5 (3 * 5 = 15 = 1 mod 7)
    expect(bigModInverse(3n, 7n)).toBe(5n)
  })

  it('cifra y descifra correctamente un número entero arbitrario', () => {
    const { publicKey, privateKey } = generatePaillierKeys(1009n, 1013n)
    const originalValue = 4500

    const ciphertext = encryptPaillier(originalValue, publicKey)
    const decrypted = decryptPaillier(ciphertext, privateKey, publicKey)

    expect(decrypted).toBe(originalValue)
  })

  it('realiza suma homomórfica perfecta de dos valores cifrados sin descifrarlos previamente', () => {
    const { publicKey, privateKey } = generatePaillierKeys()
    const m1 = 1250
    const m2 = 3750

    // Cifrar individualmente
    const c1 = encryptPaillier(m1, publicKey, 13n)
    const c2 = encryptPaillier(m2, publicKey, 29n)

    // Suma homomórfica en el servidor (multiplicación de criptogramas)
    const cSum = homomorphicAdd(c1, c2, publicKey)

    // El cliente descifra el resultado final
    const decryptedSum = decryptPaillier(cSum, privateKey, publicKey)

    expect(decryptedSum).toBe(m1 + m2) // 5000
  })

  it('realiza multiplicación homomórfica por un escalar k directamente sobre el criptograma', () => {
    const { publicKey, privateKey } = generatePaillierKeys()
    const baseValue = 350
    const scalar = 4

    const c = encryptPaillier(baseValue, publicKey, 17n)
    const cMult = homomorphicMultiplyScalar(c, scalar, publicKey)

    const decryptedMult = decryptPaillier(cMult, privateKey, publicKey)

    expect(decryptedMult).toBe(baseValue * scalar) // 1400
  })

  it('procesa una nómina confidencial completa en un servidor no confiable preservando la privacidad', () => {
    const { publicKey, privateKey } = generatePaillierKeys()

    const employees = [
      { name: 'Alice (Dev)', salary: 4000, bonus: 500 },
      { name: 'Bob (SecOps)', salary: 4500, bonus: 700 },
      { name: 'Charlie (Cloud Arch)', salary: 5000, bonus: 1000 }
    ]

    const expectedTotal = (4000 + 500) + (4500 + 700) + (5000 + 1000) // 15700

    const result = computeConfidentialPayroll(employees, publicKey)
    expect(result.computedByUntrustedCloud).toBe(true)
    expect(result.encryptedRecords).toHaveLength(3)

    // Descifrar el total agregado
    const decryptedTotal = decryptPaillier(result.totalPayrollCiphertext, privateKey, publicKey)
    expect(decryptedTotal).toBe(expectedTotal)
  })
})
