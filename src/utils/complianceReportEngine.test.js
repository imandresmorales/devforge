import { describe, it, expect } from 'vitest'
import {
  COMPLIANCE_CONTROLS,
  generateComplianceReport,
  generateAuditSignature
} from './complianceReportEngine.js'

describe('complianceReportEngine — ISO 27001, SOC 2 & NIST CSF Auditor', () => {
  it('contiene la matriz de controles de seguridad requerida por los estándares', () => {
    expect(COMPLIANCE_CONTROLS.length).toBeGreaterThanOrEqual(8)
    COMPLIANCE_CONTROLS.forEach(ctrl => {
      expect(ctrl).toHaveProperty('id')
      expect(ctrl).toHaveProperty('frameworks')
      expect(ctrl.frameworks).toHaveProperty('iso')
      expect(ctrl.frameworks).toHaveProperty('soc2')
      expect(ctrl.frameworks).toHaveProperty('nist')
      expect(ctrl.score).toBeGreaterThanOrEqual(90)
    })
  })

  it('genera un informe de conformidad con porcentaje de cumplimiento >= 98%', () => {
    const report = generateComplianceReport()

    expect(report.organization).toBe('DevForge Enterprise Systems')
    expect(report.compliancePercentage).toBeGreaterThanOrEqual(98)
    expect(report.certifiedStatus).toBe('CERTIFIED_COMPLIANT')
    expect(report.maturityLevel).toContain('NIVEL 5')
    expect(report.auditSignature).toMatch(/^SIG-SHA256-[0-9a-f]+$/)
  })

  it('genera firmas criptográficas consistentes para los mismos datos de auditoría', () => {
    const payload = { test: 'audit-123', date: '2026-09-16' }
    const sig1 = generateAuditSignature(payload)
    const sig2 = generateAuditSignature(payload)

    expect(sig1).toBe(sig2)
  })
})
