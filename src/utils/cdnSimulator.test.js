/**
 * @fileoverview Tests unitarios para el Simulador de CDN y Edge Caching.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { CDNEngine, parseCacheControl, CACHE_STATUS } from './cdnSimulator'

describe('CDN Edge Caching & Anycast Routing Engine', () => {
  let cdn

  beforeEach(() => {
    cdn = new CDNEngine()
  })

  it('debe parsear cabeceras Cache-Control con s-maxage y stale-while-revalidate', () => {
    const header = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=60'
    const parsed = parseCacheControl(header)

    expect(parsed.isPublic).toBe(true)
    expect(parsed.maxAge).toBe(3600)
    expect(parsed.sMaxAge).toBe(86400)
    expect(parsed.staleWhileRevalidate).toBe(60)
  })

  it('debe enrutar por Anycast al Edge PoP más cercano geográficamente', () => {
    const popMadrid = cdn.resolveAnycastPoP('loc_madrid')
    expect(popMadrid.id).toBe('EU_WEST')

    const popNyc = cdn.resolveAnycastPoP('loc_nyc')
    expect(popNyc.id).toBe('US_EAST')

    const popTokyo = cdn.resolveAnycastPoP('loc_tokyo')
    expect(popTokyo.id).toBe('AP_EAST')

    const popBsAs = cdn.resolveAnycastPoP('loc_buenosaires')
    expect(popBsAs.id).toBe('SA_EAST')
  })

  it('debe registrar MISS en la primera petición y HIT en peticiones subsecuentes', () => {
    const req = { url: '/bundle.js', clientLocationId: 'loc_madrid' }
    const origin = {
      body: 'console.log("App Bundle v1");',
      cacheControl: 'public, max-age=3600',
    }

    // Petición 1 -> MISS
    const res1 = cdn.fetch(req, origin)
    expect(res1.cacheStatus).toBe(CACHE_STATUS.MISS)
    expect(res1.latencyMs).toBeGreaterThan(35) // Viaja al servidor de origen

    // Petición 2 -> HIT
    const res2 = cdn.fetch(req, origin)
    expect(res2.cacheStatus).toBe(CACHE_STATUS.HIT)
    expect(res2.latencyMs).toBe(8) // Latencia Edge PoP Frankfurt (~8ms)
    expect(res2.latencySavedPercent).toBeGreaterThan(70)
  })

  it('NO debe cachear respuestas con private o no-store (BYPASS)', () => {
    const req = { url: '/api/user/me', clientLocationId: 'loc_nyc' }
    const origin = {
      body: '{"id": 1, "name": "Secret User"}',
      cacheControl: 'private, no-cache',
    }

    const res = cdn.fetch(req, origin)
    expect(res.cacheStatus).toBe(CACHE_STATUS.BYPASS)

    const res2 = cdn.fetch(req, origin)
    expect(res2.cacheStatus).toBe(CACHE_STATUS.BYPASS) // Sigue sin cachear
  })

  it('debe purgar la caché por URL o por Cache-Tag', () => {
    const req = { url: '/api/catalog', clientLocationId: 'loc_tokyo' }
    const origin = {
      body: '{"items": [1, 2, 3]}',
      cacheControl: 'public, s-maxage=300',
      cacheTags: ['tag:products', 'tag:catalog'],
    }

    cdn.fetch(req, origin) // Guarda en PoP AP_EAST
    expect(cdn.fetch(req, origin).cacheStatus).toBe(CACHE_STATUS.HIT)

    // Purgar por Tag
    const purged = cdn.purgeByTag('tag:products')
    expect(purged).toBe(1)

    // Siguiente petición vuelve a ser MISS
    expect(cdn.fetch(req, origin).cacheStatus).toBe(CACHE_STATUS.MISS)
  })
})
