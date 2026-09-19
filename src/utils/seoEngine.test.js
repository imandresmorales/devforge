import { describe, it, expect, beforeEach } from 'vitest'
import {
  sanitizeMetaContent,
  applySeoMetadata,
  setMetaTag,
  setCanonicalUrl,
  DEFAULT_SEO_CONFIG,
} from './seoEngine'

describe('seoEngine — Motor de Meta Tags SEO & Social Graph (Mejora 108)', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  it('debe sanitizar contenidos de meta tags eliminando etiquetas HTML y saltos', () => {
    expect(sanitizeMetaContent('<p>Texto seguro</p>')).toBe('Texto seguro')
    expect(sanitizeMetaContent('Línea 1\nLínea 2')).toBe('Línea 1 Línea 2')
    expect(sanitizeMetaContent(null)).toBe('')
  })

  it('debe inyectar meta tags en document.head sin duplicaciones', () => {
    setMetaTag('name', 'description', 'Primera descripción')
    let meta = document.head.querySelector('meta[name="description"]')
    expect(meta?.getAttribute('content')).toBe('Primera descripción')

    // Actualizar
    setMetaTag('name', 'description', 'Segunda descripción')
    const allMetas = document.head.querySelectorAll('meta[name="description"]')
    expect(allMetas.length).toBe(1)
    expect(allMetas[0].getAttribute('content')).toBe('Segunda descripción')
  })

  it('debe inyectar y formatear la etiqueta canonical URL', () => {
    setCanonicalUrl('/docs/react')
    const canonicalLink = document.head.querySelector('link[rel="canonical"]')
    expect(canonicalLink?.getAttribute('href')).toBe('https://devforge.internal/docs/react')
  })

  it('debe aplicar un conjunto completo de metadatos OpenGraph, Twitter y Robots', () => {
    const meta = applySeoMetadata({
      title: 'Aprende PWA',
      description: 'Guía de Service Workers',
      canonical: '/docs/pwa',
      robots: 'noindex, nofollow',
    })

    expect(meta.title).toContain('Aprende PWA | DevForge')
    expect(document.title).toBe(meta.title)

    const ogTitle = document.head.querySelector('meta[property="og:title"]')
    expect(ogTitle?.getAttribute('content')).toBe(meta.title)

    const twitterCard = document.head.querySelector('meta[name="twitter:card"]')
    expect(twitterCard?.getAttribute('content')).toBe('summary_large_image')

    const robots = document.head.querySelector('meta[name="robots"]')
    expect(robots?.getAttribute('content')).toBe('noindex, nofollow')
  })
})
