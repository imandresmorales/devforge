import { describe, it, expect, beforeEach } from 'vitest'
import { auditSeoHealth } from './seoAuditorEngine'

describe('seoAuditorEngine — Auditor de Salud SEO en Vivo (Mejora 112)', () => {
  let doc

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument('Página de Prueba')
  })

  it('debe otorgar puntuación alta cuando el documento cumple todas las directrices', () => {
    doc.title = 'DevForge — Plataforma Educativa para Desarrolladores'

    const metaDesc = doc.createElement('meta')
    metaDesc.name = 'description'
    metaDesc.content = 'Plataforma interactiva con más de 100 mejoras continuas para dominar el stack moderno de desarrollo web y ciberseguridad.'
    doc.head.appendChild(metaDesc)

    const ogTitle = doc.createElement('meta')
    ogTitle.setAttribute('property', 'og:title')
    ogTitle.content = 'DevForge'
    doc.head.appendChild(ogTitle)

    const ogImage = doc.createElement('meta')
    ogImage.setAttribute('property', 'og:image')
    ogImage.content = 'https://devforge.internal/icons/icon-512.svg'
    doc.head.appendChild(ogImage)

    const canonical = doc.createElement('link')
    canonical.rel = 'canonical'
    canonical.href = 'https://devforge.internal/docs'
    doc.head.appendChild(canonical)

    const h1 = doc.createElement('h1')
    h1.textContent = 'Documentación Oficial DevForge'
    doc.body.appendChild(h1)

    const report = auditSeoHealth(doc)
    expect(report.score).toBeGreaterThanOrEqual(90)
    expect(report.grade).toMatch(/A|A\+/)
    expect(report.errorCount).toBe(0)
  })

  it('debe detectar faltas críticas como ausencia de h1 y de meta descripción', () => {
    const emptyDoc = document.implementation.createHTMLDocument('')
    const report = auditSeoHealth(emptyDoc)

    expect(report.errorCount).toBeGreaterThan(0)
    expect(report.score).toBeLessThan(50)
    expect(report.checks.some((c) => c.id === 'heading-h1' && c.status === 'fail')).toBe(true)
  })

  it('debe advertir ante múltiples elementos h1', () => {
    const h1A = doc.createElement('h1')
    h1A.textContent = 'Primer H1'
    doc.body.appendChild(h1A)

    const h1B = doc.createElement('h1')
    h1B.textContent = 'Segundo H1'
    doc.body.appendChild(h1B)

    const report = auditSeoHealth(doc)
    expect(report.checks.some((c) => c.id === 'heading-h1' && c.status === 'warn')).toBe(true)
  })

  it('debe detectar imágenes sin atributo alt', () => {
    const img = doc.createElement('img')
    img.src = '/banner.png'
    doc.body.appendChild(img)

    const report = auditSeoHealth(doc)
    expect(report.checks.some((c) => c.id === 'media-alt' && c.status === 'warn')).toBe(true)
  })
})
