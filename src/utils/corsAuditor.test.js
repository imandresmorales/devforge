/**
 * @fileoverview Tests unitarios para el Auditor de Seguridad CORS (Mejora 64).
 * @module utils/corsAuditor.test
 */
import { describe, it, expect } from 'vitest'
import { auditCORSHeaders, CORS_PRESETS } from './corsAuditor'

describe('Auditor de Seguridad CORS (corsAuditor.js)', () => {
  it('detecta reflexión arbitraria de origen con credenciales como riesgo CRITICAL', () => {
    const audit = auditCORSHeaders({
      requestOrigin: 'https://attacker-site.com',
      allowOrigin: 'https://attacker-site.com',
      allowCredentials: true,
      targetOrigin: 'https://api.devforge.io',
    })

    expect(audit.isVulnerable).toBe(true)
    expect(audit.riskLevel).toBe('CRITICAL')
    expect(audit.findings.some((f) => f.id === 'ARBITRARY_ORIGIN_REFLECTION')).toBe(true)
    expect(audit.pocCode).toContain('credentials: \'include\'')
  })

  it('detecta confianza en origen "null" con credenciales como riesgo CRITICAL', () => {
    const audit = auditCORSHeaders({
      requestOrigin: 'null',
      allowOrigin: 'null',
      allowCredentials: true,
    })

    expect(audit.isVulnerable).toBe(true)
    expect(audit.riskLevel).toBe('CRITICAL')
    expect(audit.findings.some((f) => f.id === 'NULL_ORIGIN_TRUST')).toBe(true)
  })

  it('detecta bypass por subdominio no anclado (devforge.io.attacker.org)', () => {
    const audit = auditCORSHeaders({
      requestOrigin: 'https://devforge.io.attacker.org',
      allowOrigin: 'https://devforge.io.attacker.org',
      allowCredentials: true,
    })

    expect(audit.isVulnerable).toBe(true)
    expect(audit.findings.some((f) => f.id === 'REGEX_SUBDOMAIN_BYPASS')).toBe(true)
  })

  it('detecta combinación inválida de wildcard (*) con credenciales activas', () => {
    const audit = auditCORSHeaders({
      requestOrigin: 'https://any-site.com',
      allowOrigin: '*',
      allowCredentials: true,
    })

    expect(audit.isVulnerable).toBe(true)
    expect(audit.findings.some((f) => f.id === 'WILDCARD_WITH_CREDENTIALS')).toBe(true)
  })

  it('califica como SAFE y genera configuraciones seguras en una whitelist legítima', () => {
    const audit = auditCORSHeaders({
      requestOrigin: 'https://app.devforge.io',
      allowOrigin: 'https://app.devforge.io',
      allowCredentials: true,
      targetOrigin: 'https://api.devforge.io',
    })

    expect(audit.riskLevel).toBe('SAFE')
    expect(audit.findings.length).toBe(0)
    expect(audit.serverConfigs.express).toContain('ALLOWED_ORIGINS')
    expect(audit.serverConfigs.nginx).toContain('add_header \'Access-Control-Allow-Origin\'')
  })

  it('verifica que todos los presets de CORS sean analizables correctamente', () => {
    CORS_PRESETS.forEach((preset) => {
      const res = auditCORSHeaders(preset)
      expect(res).toBeDefined()
      expect(res.riskLevel).toBeDefined()
      expect(typeof res.score).toBe('number')
    })
  })
})
