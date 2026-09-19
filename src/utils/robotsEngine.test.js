import { describe, it, expect } from 'vitest'
import {
  generateRobotsTxt,
  testRobotsPath,
  DEFAULT_ROBOTS_CONFIG,
} from './robotsEngine'

describe('robotsEngine — Directivas robots.txt & RFC 9309 (Mejora 111)', () => {
  it('debe generar un archivo robots.txt con encabezados, reglas y sitemap', () => {
    const text = generateRobotsTxt(DEFAULT_ROBOTS_CONFIG)
    expect(text).toContain('User-agent: *')
    expect(text).toContain('Allow: /docs')
    expect(text).toContain('Disallow: /dashboard')
    expect(text).toContain('Sitemap: https://devforge.internal/sitemap.xml')
  })

  it('debe permitir acceso a rutas públicas como /docs o /pricing', () => {
    const text = generateRobotsTxt()
    const testDocs = testRobotsPath(text, 'Googlebot', '/docs/pwa')
    expect(testDocs.allowed).toBe(true)

    const testPricing = testRobotsPath(text, '*', '/pricing')
    expect(testPricing.allowed).toBe(true)
  })

  it('debe bloquear el rastreo en rutas privadas y protegidas', () => {
    const text = generateRobotsTxt()
    const testDashboard = testRobotsPath(text, 'Googlebot', '/dashboard')
    expect(testDashboard.allowed).toBe(false)
    expect(testDashboard.matchedRule).toContain('Disallow: /dashboard')

    const testProfile = testRobotsPath(text, 'Bingbot', '/profile/settings')
    expect(testProfile.allowed).toBe(false)
  })

  it('debe respetar reglas específicas de bots como GPTBot', () => {
    const text = generateRobotsTxt()
    const testGptDocs = testRobotsPath(text, 'GPTBot', '/docs')
    expect(testGptDocs.allowed).toBe(true)

    const testGptPricing = testRobotsPath(text, 'GPTBot', '/pricing')
    expect(testGptPricing.allowed).toBe(false)
  })
})
