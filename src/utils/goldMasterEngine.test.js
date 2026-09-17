import { describe, it, expect } from 'vitest'
import {
  TOTAL_GOLD_MASTER_MILESTONES,
  generateGoldMasterCertificate,
  verifyCertificateIntegrity,
  computeCertificateSeal
} from './goldMasterEngine.js'

describe('goldMasterEngine — DevForge Gold Master 100 Milestones Certification', () => {
  it('define el hito histórico de 100 mejoras completadas', () => {
    expect(TOTAL_GOLD_MASTER_MILESTONES).toBe(100)
  })

  it('genera un certificado digital válido con ID único y sello criptográfico SHA-256', () => {
    const cert = generateGoldMasterCertificate('Alex Morales')

    expect(cert.recipient).toBe('Alex Morales')
    expect(cert.milestonesCompleted).toBe(100)
    expect(cert.certificateId).toMatch(/^CERT-GM100-[A-Z0-9]+-[A-Z0-9]+$/)
    expect(cert.cryptographicSeal).toMatch(/^SEAL-[0-9A-F]+-[0-9A-F]+-[0-9A-F]+-[0-9A-F]+$/)
    expect(cert.verificationUrl).toContain(cert.certificateId)
  })

  it('valida con éxito la integridad de un certificado no alterado', () => {
    const cert = generateGoldMasterCertificate('Andrés Morales')
    const isValid = verifyCertificateIntegrity(cert)

    expect(isValid).toBe(true)
  })

  it('detecta y rechaza certificados manipulados o con firmas alteradas', () => {
    const cert = generateGoldMasterCertificate('Andrés Morales')
    // Modificar payload maliciosamente
    cert.recipient = 'Hacker Impostor'

    const isValid = verifyCertificateIntegrity(cert)
    expect(isValid).toBe(false)
  })
})
