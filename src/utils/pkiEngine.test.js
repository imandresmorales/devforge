import { describe, it, expect } from 'vitest'
import {
  matchHostname,
  auditCertificateChain,
  PKI_PRESETS,
} from './pkiEngine'

describe('Motor PKI y Cadena de Confianza X.509 (pkiEngine.js)', () => {
  describe('Validación de Hostname y Wildcards (matchHostname)', () => {
    const sans = ['devforge.io', '*.devforge.io', 'auth.devforge.io']

    it('coincide exactamente con el dominio principal', () => {
      const check = matchHostname(sans, 'devforge.io')
      expect(check.matches).toBe(true)
      expect(check.matchedSan).toBe('devforge.io')
    })

    it('coincide con subdominios mediante wildcard (*.devforge.io)', () => {
      const check = matchHostname(sans, 'api.devforge.io')
      expect(check.matches).toBe(true)
      expect(check.matchedSan).toBe('*.devforge.io')
    })

    it('rechaza subdominios de múltiple nivel no cubiertos por el wildcard', () => {
      const check = matchHostname(sans, 'sub.api.devforge.io')
      expect(check.matches).toBe(false)
    })

    it('rechaza dominios completamente diferentes (Hostname Mismatch)', () => {
      const check = matchHostname(sans, 'evil-devforge.com')
      expect(check.matches).toBe(false)
    })
  })

  describe('Auditoría de Cadena de Confianza (auditCertificateChain)', () => {
    it('otorga calificación A+ al preset de producción válido', () => {
      const preset = PKI_PRESETS.find((p) => p.id === 'valid_production')
      const report = auditCertificateChain(preset, 'api.devforge.io')

      expect(report.isSecure).toBe(true)
      expect(report.grade).toBe('A+')
      expect(report.hostnameMatched).toBe(true)
      expect(report.isExpired).toBe(false)
      expect(report.issues.length).toBe(0)
    })

    it('detecta certificados expirados y asigna calificación F', () => {
      const preset = PKI_PRESETS.find((p) => p.id === 'expired_certificate')
      const report = auditCertificateChain(preset, 'legacy.devforge.io')

      expect(report.isSecure).toBe(false)
      expect(report.grade).toBe('F')
      expect(report.isExpired).toBe(true)
      expect(report.issues.some((i) => i.title.includes('Expirado'))).toBe(true)
    })

    it('detecta certificados raíz autofirmados no reconocidos (Untrusted Root)', () => {
      const preset = PKI_PRESETS.find((p) => p.id === 'untrusted_self_signed')
      const report = auditCertificateChain(preset, 'internal-dev.local')

      expect(report.isSecure).toBe(false)
      expect(report.issues.some((i) => i.title.includes('No Confiable'))).toBe(true)
    })
  })
})
