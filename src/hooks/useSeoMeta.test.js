import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSeoMeta } from './useSeoMeta'

describe('useSeoMeta — Hook Declarativo SEO (Mejora 108)', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  it('debe aplicar metadatos al montarse en el componente', () => {
    renderHook(() =>
      useSeoMeta({
        title: 'Documentación Oficial',
        description: 'Aprende arquitectura con DevForge',
        canonical: '/docs',
      })
    )

    expect(document.title).toContain('Documentación Oficial')
    const ogTitle = document.head.querySelector('meta[property="og:title"]')
    expect(ogTitle?.getAttribute('content')).toContain('Documentación Oficial')
    const desc = document.head.querySelector('meta[name="description"]')
    expect(desc?.getAttribute('content')).toBe('Aprende arquitectura con DevForge')
  })
})
