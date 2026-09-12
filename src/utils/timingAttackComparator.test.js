/**
 * @fileoverview Tests unitarios para el Comparador Criptográfico en Tiempo Constante (Mejora 87).
 */
import { describe, it, expect } from 'vitest'
import {
  vulnerableCompare,
  constantTimeCompare,
  generateSimulatedHmac,
  runTimingAttackAudit,
} from './timingAttackComparator'

describe('Timing Attack Comparator & Side-Channel Mitigation (timingAttackComparator.js)', () => {
  const SECRET = 'SUPER_SECRET_HMAC_SIGNATURE_9999'

  describe('Comparación Segura vs Insegura', () => {
    it('debe retornar true cuando ambos strings son idénticos', () => {
      const vuln = vulnerableCompare(SECRET, SECRET)
      const constTime = constantTimeCompare(SECRET, SECRET)

      expect(vuln.equals).toBe(true)
      expect(constTime.equals).toBe(true)
    })

    it('debe retornar false si difieren al inicio, medio o final', () => {
      const diffStart = 'X' + SECRET.slice(1)
      const diffMid = SECRET.slice(0, 10) + 'X' + SECRET.slice(11)
      const diffEnd = SECRET.slice(0, -1) + 'X'

      expect(constantTimeCompare(SECRET, diffStart).equals).toBe(false)
      expect(constantTimeCompare(SECRET, diffMid).equals).toBe(false)
      expect(constantTimeCompare(SECRET, diffEnd).equals).toBe(false)

      expect(vulnerableCompare(SECRET, diffStart).equals).toBe(false)
      expect(vulnerableCompare(SECRET, diffMid).equals).toBe(false)
      expect(vulnerableCompare(SECRET, diffEnd).equals).toBe(false)
    })

    it('debe retornar false ante strings de longitudes dispares', () => {
      expect(constantTimeCompare(SECRET, 'SHORT').equals).toBe(false)
      expect(constantTimeCompare(SECRET, SECRET + '_EXTRA').equals).toBe(false)
      expect(vulnerableCompare(SECRET, 'SHORT').equals).toBe(false)
    })
  })

  describe('Auditoría Estadística de Canal Lateral (Timing Attack Leakage)', () => {
    it('vulnerableCompare debe mostrar operaciones proporcionales a la posición del error (Leak)', () => {
      const diffAt1 = 'X' + SECRET.slice(1)
      const diffAt10 = SECRET.slice(0, 10) + 'X' + SECRET.slice(11)

      const res1 = vulnerableCompare(SECRET, diffAt1)
      const res10 = vulnerableCompare(SECRET, diffAt10)

      expect(res1.opsCount).toBeLessThan(res10.opsCount)
      expect(res1.simulatedNs).toBeLessThan(res10.simulatedNs)
    })

    it('constantTimeCompare debe ejecutar el mismo número de operaciones sin importar la posición del error', () => {
      const diffAt1 = 'X' + SECRET.slice(1)
      const diffAt10 = SECRET.slice(0, 10) + 'X' + SECRET.slice(11)
      const exactMatch = SECRET

      const res1 = constantTimeCompare(SECRET, diffAt1)
      const res10 = constantTimeCompare(SECRET, diffAt10)
      const resMatch = constantTimeCompare(SECRET, exactMatch)

      expect(res1.opsCount).toBe(res10.opsCount)
      expect(res10.opsCount).toBe(resMatch.opsCount)
    })

    it('debe auditar y detectar una correlación temporal lineal en modo vulnerable', () => {
      const audit = runTimingAttackAudit('SECRET1234', 50)

      expect(audit.isVulnerableLeakDetected).toBe(true)
      expect(audit.correlationCoefficient).toBeGreaterThan(0.8)

      // Los resultados en tiempo constante deben tener tiempos casi planos
      const constTimes = audit.constantTimeResults.map((r) => r.avgNs)
      const maxConst = Math.max(...constTimes)
      const minConst = Math.min(...constTimes)
      // La fluctuación debe ser meramente ruido estadístico (< 15ns)
      expect(maxConst - minConst).toBeLessThan(20)
    })
  })

  describe('Firmas HMAC Deterministas y Verificación', () => {
    it('debe generar y verificar firmas HMAC en tiempo constante', () => {
      const payload = '{"user":"andres","amount":500}'
      const key = 'super-private-key'

      const sig1 = generateSimulatedHmac(payload, key)
      const sig2 = generateSimulatedHmac(payload, key)
      const sigForged = generateSimulatedHmac(payload, 'wrong-key')

      expect(sig1).toBe(sig2)
      expect(constantTimeCompare(sig1, sig2).equals).toBe(true)
      expect(constantTimeCompare(sig1, sigForged).equals).toBe(false)
    })
  })
})
