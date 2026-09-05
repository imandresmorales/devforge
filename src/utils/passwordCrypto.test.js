import { describe, it, expect } from 'vitest'
import {
  calculateEntropy,
  generateSalt,
  simulateKDFHashes,
  generateStrongPassword,
} from './passwordCrypto'

describe('Motor de Hashing de Contraseñas KDF y Entropía NIST (passwordCrypto.js)', () => {
  describe('Cálculo de Entropía NIST (calculateEntropy)', () => {
    it('califica contraseñas cortas o simples como débiles', () => {
      const result = calculateEntropy('123456')
      expect(result.strength).toBe('VERY_WEAK')
      expect(result.entropyBits).toBeLessThan(30)
      expect(result.feedback.length).toBeGreaterThan(0)
    })

    it('calcula alta entropía para contraseñas largas con mezcla de caracteres', () => {
      const result = calculateEntropy('kX9#mQ2$vL8!zW5@')
      expect(result.entropyBits).toBeGreaterThan(80)
      expect(result.strength).toBe('VERY_STRONG')
      expect(result.score).toBe(100)
    })

    it('maneja contraseñas vacías de forma segura', () => {
      const result = calculateEntropy('')
      expect(result.entropyBits).toBe(0)
      expect(result.strength).toBe('VERY_WEAK')
    })
  })

  describe('Generación de Sales y Hashes KDF', () => {
    it('genera sales pseudoaleatorias con la longitud indicada', () => {
      const salt = generateSalt(16)
      expect(salt.length).toBe(16)
    })

    it('genera comparativas estructuradas para Argon2id, bcrypt y PBKDF2', () => {
      const hashes = simulateKDFHashes('CorrectHorseBatteryStaple#2026')
      expect(hashes.length).toBe(4)

      const argon2 = hashes.find((h) => h.id === 'argon2id')
      const bcrypt = hashes.find((h) => h.id === 'bcrypt')
      const md5 = hashes.find((h) => h.id === 'md5_sha256')

      expect(argon2.owaspCompliant).toBe(true)
      expect(argon2.sampleHash).toContain('$argon2id$')
      expect(bcrypt.sampleHash).toContain('$2b$12$')
      expect(md5.owaspCompliant).toBe(false)
    })
  })

  describe('Generador de Contraseñas Seguras', () => {
    it('genera contraseñas con la longitud y caracteres requeridos', () => {
      const pass = generateStrongPassword({ length: 20 })
      expect(pass.length).toBe(20)
      expect(/[A-Z]/.test(pass)).toBe(true)
      expect(/[0-9]/.test(pass)).toBe(true)
      expect(/[^a-zA-Z0-9]/.test(pass)).toBe(true)
    })
  })
})
