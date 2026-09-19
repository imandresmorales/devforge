import { describe, it, expect } from 'vitest'
import {
  validateManifest,
  parseProtocolUri,
  DEVFORGE_PROTOCOL,
} from './pwaManifestEngine'

describe('pwaManifestEngine — PWA Manifest & Protocol Handlers (Mejora 105)', () => {
  it('debe validar un manifest completo con puntuación 100 y características avanzadas', () => {
    const validManifest = {
      name: 'DevForge PWA',
      short_name: 'DevForge',
      start_url: '/',
      display: 'standalone',
      icons: [
        { src: '/icons/icon-192.svg', sizes: '192x192' },
        { src: '/icons/icon-512.svg', sizes: '512x512' },
      ],
      shortcuts: [
        { name: 'Docs', url: '/docs' },
        { name: 'Dashboard', url: '/dashboard' },
      ],
      protocol_handlers: [{ protocol: 'web+devforge', url: '/?uri=%s' }],
      file_handlers: [{ action: '/docs', accept: { 'text/json': ['.json'] } }],
      share_target: { action: '/contact', method: 'GET' },
    }

    const report = validateManifest(validManifest)
    expect(report.valid).toBe(true)
    expect(report.score).toBe(100)
    expect(report.features.length).toBeGreaterThanOrEqual(4)
  })

  it('debe detectar campos faltantes en manifests incompletos', () => {
    const brokenManifest = { name: 'Solo Nombre' }
    const report = validateManifest(brokenManifest)
    expect(report.valid).toBe(false)
    expect(report.score).toBeLessThan(60)
    expect(report.issues.some((i) => i.includes('short_name'))).toBe(true)
    expect(report.issues.some((i) => i.includes('icons'))).toBe(true)
  })

  it('debe parsear y sanitizar URIs del protocolo web+devforge:// con rutas y params seguros', () => {
    const rawUri = 'web+devforge://docs?topic=service-worker&mode=advanced'
    const result = parseProtocolUri(rawUri)

    expect(result.valid).toBe(true)
    expect(result.targetPath).toBe('/docs')
    expect(result.searchParams.topic).toBe('service-worker')
    expect(result.searchParams.mode).toBe('advanced')
  })

  it('debe rechazar protocolos no reconocidos o URIs malformadas', () => {
    const badScheme = 'http://external-attack.com'
    const result = parseProtocolUri(badScheme)

    expect(result.valid).toBe(false)
    expect(result.error).toContain(DEVFORGE_PROTOCOL)
  })
})
