import { describe, it, expect, beforeEach } from 'vitest'
import {
  SCHEMA_BUILDERS,
  injectJsonLd,
  removeJsonLd,
  safeJsonStringify,
} from './schemaJsonLdEngine'

describe('schemaJsonLdEngine — JSON-LD Schema.org & Rich Results (Mejora 109)', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  it('debe escapar de forma segura cierres de etiquetas script en safeJsonStringify', () => {
    const malicious = { name: '</script><script>alert(1)</script>' }
    const jsonString = safeJsonStringify(malicious)
    expect(jsonString).not.toContain('</script>')
    expect(jsonString).toContain('<\\/script>')
  })

  it('debe generar esquemas válidos para WebApplication y Course', () => {
    const appSchema = SCHEMA_BUILDERS.softwareApplication({ name: 'DevForge Pro' })
    expect(appSchema['@context']).toBe('https://schema.org')
    expect(appSchema['@type']).toBe('WebApplication')
    expect(appSchema.name).toBe('DevForge Pro')

    const courseSchema = SCHEMA_BUILDERS.course({ title: 'React 19 & PWA' })
    expect(courseSchema['@type']).toBe('Course')
    expect(courseSchema.name).toBe('React 19 & PWA')
  })

  it('debe generar esquema BreadcrumbList con posiciones ordenadas', () => {
    const breadcrumbSchema = SCHEMA_BUILDERS.breadcrumbs([
      { name: 'Inicio', url: '/' },
      { name: 'Docs', url: '/docs' },
      { name: 'SEO', url: '/docs/seo' },
    ])

    expect(breadcrumbSchema['@type']).toBe('BreadcrumbList')
    expect(breadcrumbSchema.itemListElement.length).toBe(3)
    expect(breadcrumbSchema.itemListElement[0].position).toBe(1)
    expect(breadcrumbSchema.itemListElement[2].item).toBe('https://devforge.internal/docs/seo')
  })

  it('debe inyectar y actualizar scripts JSON-LD en document.head', () => {
    const data = SCHEMA_BUILDERS.softwareApplication()
    injectJsonLd('test-app-schema', data)

    const script = document.head.querySelector('script[data-schema-id="test-app-schema"]')
    expect(script).not.toBeNull()
    expect(script?.getAttribute('type')).toBe('application/ld+json')

    const parsed = JSON.parse(script?.textContent || '{}')
    expect(parsed['@type']).toBe('WebApplication')

    // Eliminar
    const removed = removeJsonLd('test-app-schema')
    expect(removed).toBe(true)
    expect(document.head.querySelector('script[data-schema-id="test-app-schema"]')).toBeNull()
  })
})
