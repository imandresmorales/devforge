import { describe, it, expect } from 'vitest'
import {
  generateSitemapXml,
  validateSitemapXml,
  escapeXml,
  DEFAULT_SITEMAP_ROUTES,
} from './sitemapEngine'

describe('sitemapEngine — Generador y Validador de Sitemap XML (Mejora 110)', () => {
  it('debe escapar correctamente entidades XML especiales', () => {
    expect(escapeXml('https://devforge.internal/search?a=1&b=2')).toBe('https://devforge.internal/search?a=1&amp;b=2')
    expect(escapeXml('<script>')).toBe('&lt;script&gt;')
    expect(escapeXml('"comillas"')).toBe('&quot;comillas&quot;')
  })

  it('debe generar un sitemap XML bien formado y excluir rutas privadas', () => {
    const customRoutes = [
      { path: '/', priority: '1.0' },
      { path: '/dashboard', priority: '0.5' }, // Privada: debe ser excluida
      { path: '/docs/pwa', priority: '0.8', changefreq: 'weekly' },
    ]

    const xml = generateSitemapXml(customRoutes, 'https://devforge.internal')
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('<loc>https://devforge.internal/</loc>')
    expect(xml).toContain('<loc>https://devforge.internal/docs/pwa</loc>')
    expect(xml).not.toContain('/dashboard')
  })

  it('debe validar la estructura XML y contar el número de URLs', () => {
    const xml = generateSitemapXml(DEFAULT_SITEMAP_ROUTES)
    const report = validateSitemapXml(xml)

    expect(report.valid).toBe(true)
    expect(report.urlCount).toBe(DEFAULT_SITEMAP_ROUTES.length)
    expect(report.issues.length).toBe(0)
  })

  it('debe marcar inválido un sitemap sin namespace o vacío', () => {
    const badXml = '<urlset><url><loc>https://test.com</loc></url></urlset>'
    const report = validateSitemapXml(badXml)

    expect(report.valid).toBe(false)
    expect(report.issues.some((i) => i.includes('namespace'))).toBe(true)
  })
})
