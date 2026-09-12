/**
 * @fileoverview Tests unitarios para el Motor de Prevención de Fuga de Datos (DLP).
 */
import { describe, it, expect } from 'vitest'
import {
  scanAndSanitize,
  validateLuhn,
  validateDniNie,
  MASK_STRATEGIES,
  SEVERITY_LEVELS,
} from './dlpScanner'

describe('DLP Scanner & PII Sanitizer', () => {
  describe('Validadores de Checksum', () => {
    it('debe validar tarjetas de credito validas con algoritmo de Luhn', () => {
      expect(validateLuhn('4532015112830366')).toBe(true) // Visa valida
      expect(validateLuhn('4532015112830367')).toBe(false) // Checksum invalido
      expect(validateLuhn('1234')).toBe(false) // Muy corto
    })

    it('debe validar DNIs espanoles con letra correcta', () => {
      // 12345678Z -> 12345678 % 23 = 14 -> Z
      expect(validateDniNie('12345678Z')).toBe(true)
      expect(validateDniNie('12345678A')).toBe(false) // Letra incorrecta
    })
  })

  describe('Detección y Sanitización de Secretos y PII', () => {
    it('debe detectar y enmascarar tarjetas de credito y OpenAI keys', () => {
      const sample = 'El cliente pago con 4532-0151-1283-0366 usando sk-proj-1234567890abcdef1234567890abcdef12'
      const res = scanAndSanitize(sample, { strategy: MASK_STRATEGIES.PARTIAL })

      expect(res.isCompliant).toBe(false)
      expect(res.findings.length).toBe(2)
      expect(res.findings.some((f) => f.ruleId === 'CREDIT_CARD')).toBe(true)
      expect(res.findings.some((f) => f.ruleId === 'OPENAI_KEY')).toBe(true)
      expect(res.sanitizedText).toContain('****-****-****-0366')
      expect(res.sanitizedText).toContain('sk-...')
      expect(res.riskScore).toBeGreaterThanOrEqual(70)
    })

    it('debe detectar AWS keys y JWTs', () => {
      const sample = 'AWS_KEY=AKIAIOSFODNN7EXAMPLE y JWT=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozS6w_sample_sig_12345'
      const res = scanAndSanitize(sample, { strategy: MASK_STRATEGIES.REDACT })

      expect(res.isCompliant).toBe(false)
      expect(res.findings.length).toBe(2)
      expect(res.sanitizedText).toContain('[REDACTED_AWS_KEY]')
      expect(res.sanitizedText).toContain('[REDACTED_JWT_TOKEN]')
    })

    it('debe detectar emails y DNIs', () => {
      const sample = 'Contacto: admin@megacorp.com con documento 12345678Z'
      const res = scanAndSanitize(sample, { strategy: MASK_STRATEGIES.PARTIAL })

      expect(res.findings.length).toBe(2)
      expect(res.sanitizedText).toContain('***5678Z')
      expect(res.sanitizedText).toContain('@megacorp.com')
    })

    it('debe marcar texto limpio como compliant', () => {
      const sample = 'Este es un texto totalmente publico sin datos sensibles ni secretos.'
      const res = scanAndSanitize(sample)

      expect(res.isCompliant).toBe(true)
      expect(res.findings.length).toBe(0)
      expect(res.riskScore).toBe(0)
      expect(res.sanitizedText).toBe(sample)
    })
  })
})
