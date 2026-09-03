import { describe, it, expect } from 'vitest'
import {
  auditSecurityHeaders,
  PRESET_HEADER_CONFIGS,
  generateServerConfigSnippet,
} from './securityHeaders'

describe('Security Headers Auditor Engine (securityHeaders.js)', () => {
  it('debe otorgar calificación A+ al preset seguro de producción', () => {
    const preset = PRESET_HEADER_CONFIGS.find((p) => p.id === 'devforge_secure')
    const report = auditSecurityHeaders(preset.headers)

    expect(report.grade).toBe('A+')
    expect(report.score).toBe(100)
    expect(report.missingCount).toBe(0)
    expect(report.secureCount).toBe(8)
  })

  it('debe otorgar calificación F a una configuración legacy con cabeceras críticas faltantes', () => {
    const preset = PRESET_HEADER_CONFIGS.find((p) => p.id === 'legacy_vulnerable')
    const report = auditSecurityHeaders(preset.headers)

    expect(report.grade).toBe('F')
    expect(report.score).toBeLessThan(30)
    expect(report.missingCount).toBeGreaterThan(5)
  })

  it('debe detectar directivas inseguras como unsafe-eval en CSP', () => {
    const report = auditSecurityHeaders({
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval';",
    })

    const cspResult = report.results.find((r) => r.key === 'Content-Security-Policy')
    expect(cspResult.status).toBe('WEAK')
    expect(cspResult.score).toBe(12)
  })

  it('debe generar snippets válidos para Express, Nginx y Next.js', () => {
    const expressSnippet = generateServerConfigSnippet('express')
    const nginxSnippet = generateServerConfigSnippet('nginx')
    const nextSnippet = generateServerConfigSnippet('nextjs')

    expect(expressSnippet).toContain('helmet')
    expect(nginxSnippet).toContain('add_header')
    expect(nextSnippet).toContain('next.config.js')
  })
})
