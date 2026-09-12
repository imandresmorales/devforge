/**
 * @fileoverview Simulador de Red de Distribución de Contenidos (CDN), Edge Caching y Enrutamiento Anycast.
 *
 * Implementa las especificaciones RFC 7234 (HTTP Caching) y RFC 5861 (stale-while-revalidate):
 * - Puntos de Presencia Perimetrales (Edge PoPs): US-East, EU-West, AP-East, SA-East.
 * - Enrutamiento Geográfico Anycast al Edge PoP de menor latencia.
 * - Evaluación exhaustiva de cabeceras Cache-Control: max-age, s-maxage, stale-while-revalidate, private, no-store.
 * - Estados de Caché: HIT, MISS, STALE_REVALIDATED, BYPASS.
 * - Purga selectiva de caché por URL y por etiquetas (Surrogate-Key / Cache-Tags).
 *
 * @module utils/cdnSimulator
 */

export const EDGE_POPS = {
  US_EAST: { id: 'US_EAST', name: '🇺🇸 US-East (N. Virginia)', city: 'Ashburn', edgeLatencyMs: 12 },
  EU_WEST: { id: 'EU_WEST', name: '🇩🇪 EU-West (Frankfurt)', city: 'Frankfurt', edgeLatencyMs: 8 },
  AP_EAST: { id: 'AP_EAST', name: '🇯🇵 AP-East (Tokyo)', city: 'Tokyo', edgeLatencyMs: 15 },
  SA_EAST: { id: 'SA_EAST', name: '🇧🇷 SA-East (São Paulo)', city: 'São Paulo', edgeLatencyMs: 14 },
}

export const CLIENT_LOCATIONS = [
  { id: 'loc_madrid', name: '🇪🇸 Madrid, España', nearestPoP: 'EU_WEST', directOriginLatencyMs: 35 },
  { id: 'loc_nyc', name: '🇺🇸 New York, USA', nearestPoP: 'US_EAST', directOriginLatencyMs: 110 },
  { id: 'loc_tokyo', name: '🇯🇵 Tokio, Japón', nearestPoP: 'AP_EAST', directOriginLatencyMs: 240 },
  { id: 'loc_buenosaires', name: '🇦🇷 Buenos Aires, Argentina', nearestPoP: 'SA_EAST', directOriginLatencyMs: 210 },
]

export const CACHE_STATUS = {
  HIT: 'HIT',
  MISS: 'MISS',
  STALE_REVALIDATED: 'STALE_REVALIDATED',
  BYPASS: 'BYPASS',
}

/**
 * Parsea una directiva Cache-Control HTTP.
 * @param {string} header - Valor de la cabecera Cache-Control.
 * @returns {Object} Directivas parseadas.
 */
export function parseCacheControl(header = '') {
  const directives = {
    isPublic: false,
    isPrivate: false,
    noCache: false,
    noStore: false,
    mustRevalidate: false,
    maxAge: null,
    sMaxAge: null,
    staleWhileRevalidate: null,
  }

  if (!header || typeof header !== 'string') return directives

  const parts = header.split(',').map((p) => p.trim().toLowerCase())

  parts.forEach((part) => {
    if (part === 'public') directives.isPublic = true
    else if (part === 'private') directives.isPrivate = true
    else if (part === 'no-cache') directives.noCache = true
    else if (part === 'no-store') directives.noStore = true
    else if (part === 'must-revalidate') directives.mustRevalidate = true
    else if (part.startsWith('max-age=')) {
      directives.maxAge = parseInt(part.split('=')[1], 10)
    } else if (part.startsWith('s-maxage=')) {
      directives.sMaxAge = parseInt(part.split('=')[1], 10)
    } else if (part.startsWith('stale-while-revalidate=')) {
      directives.staleWhileRevalidate = parseInt(part.split('=')[1], 10)
    }
  })

  return directives
}

/**
 * Motor de Simulación CDN Edge Network.
 */
export class CDNEngine {
  constructor() {
    /**
     * Almacenamiento perimetral por PoP:
     * popId -> Map<url, { body, headers, tags, cachedAt, ttlSeconds, swrSeconds }>
     */
    this.edgeCaches = {
      US_EAST: new Map(),
      EU_WEST: new Map(),
      AP_EAST: new Map(),
      SA_EAST: new Map(),
    }

    /** Métricas globales */
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      staleRevalidations: 0,
      purgedCount: 0,
    }
  }

  /**
   * Enruta la petición del cliente al Edge PoP más cercano (Anycast Routing).
   * @param {string} clientLocationId
   * @returns {Object} PoP asignado.
   */
  resolveAnycastPoP(clientLocationId) {
    const loc = CLIENT_LOCATIONS.find((l) => l.id === clientLocationId) || CLIENT_LOCATIONS[0]
    return EDGE_POPS[loc.nearestPoP]
  }

  /**
   * Simula una petición HTTP a través de la red CDN.
   *
   * @param {Object} request
   * @param {string} request.url - URL del recurso (ej. '/assets/app.js', '/api/products').
   * @param {string} request.clientLocationId - Ubicación del cliente.
   * @param {Object} originResponse - Respuesta del servidor de origen si se requiere consultar.
   * @param {string} originResponse.body - Contenido del recurso.
   * @param {string} originResponse.cacheControl - Cabecera Cache-Control del origen.
   * @param {string[]} [originResponse.cacheTags=[]] - Etiquetas de purga (Surrogate-Keys).
   * @returns {Object} Telemetría de la respuesta CDN.
   */
  fetch(request, originResponse) {
    this.stats.totalRequests++
    const { url, clientLocationId } = request
    const clientLoc = CLIENT_LOCATIONS.find((l) => l.id === clientLocationId) || CLIENT_LOCATIONS[0]
    const pop = this.resolveAnycastPoP(clientLocationId)
    const popCache = this.edgeCaches[pop.id]

    const cachedEntry = popCache.get(url)
    const nowSec = Date.now() / 1000

    // Caso 1: Entrada presente en caché del Edge PoP
    if (cachedEntry) {
      const ageSec = nowSec - cachedEntry.cachedAt

      // ¿Es fresca (Fresh)?
      if (ageSec <= cachedEntry.ttlSeconds) {
        this.stats.cacheHits++
        return {
          status: 200,
          cacheStatus: CACHE_STATUS.HIT,
          servedBy: pop.name,
          latencyMs: pop.edgeLatencyMs,
          originLatencyMs: clientLoc.directOriginLatencyMs,
          latencySavedPercent: Math.round(((clientLoc.directOriginLatencyMs - pop.edgeLatencyMs) / clientLoc.directOriginLatencyMs) * 100),
          ageSeconds: Math.round(ageSec),
          body: cachedEntry.body,
          headers: {
            'cf-cache-status': 'HIT',
            'cf-ray': `${pop.id}_${Math.random().toString(36).substring(2, 8)}`,
            'cache-control': cachedEntry.cacheControl,
            age: Math.round(ageSec),
          },
        }
      }

      // ¿Está expirada pero dentro de la ventana stale-while-revalidate?
      if (cachedEntry.swrSeconds && ageSec <= (cachedEntry.ttlSeconds + cachedEntry.swrSeconds)) {
        this.stats.staleRevalidations++
        // En background se revalida con el origen
        this.cacheAtEdge(pop.id, url, originResponse)

        return {
          status: 200,
          cacheStatus: CACHE_STATUS.STALE_REVALIDATED,
          servedBy: `${pop.name} (Stale Background Revalidated)`,
          latencyMs: pop.edgeLatencyMs, // Respuesta instantánea al usuario
          originLatencyMs: clientLoc.directOriginLatencyMs,
          latencySavedPercent: Math.round(((clientLoc.directOriginLatencyMs - pop.edgeLatencyMs) / clientLoc.directOriginLatencyMs) * 100),
          ageSeconds: Math.round(ageSec),
          body: cachedEntry.body,
          headers: {
            'cf-cache-status': 'STALE_REVALIDATED',
            'cf-ray': `${pop.id}_${Math.random().toString(36).substring(2, 8)}`,
            'cache-control': cachedEntry.cacheControl,
            age: Math.round(ageSec),
          },
        }
      }
    }

    // Caso 2: Cache MISS o No Cacheable -> Consultar Servidor de Origen
    this.stats.cacheMisses++
    const directives = parseCacheControl(originResponse.cacheControl)

    // Evaluar si es almacenable en la CDN pública
    const isCacheableByCDN =
      !directives.noStore &&
      !directives.isPrivate &&
      (directives.sMaxAge !== null || directives.maxAge !== null || directives.isPublic)

    if (isCacheableByCDN) {
      this.cacheAtEdge(pop.id, url, originResponse)
    }

    const totalLatency = clientLoc.directOriginLatencyMs + pop.edgeLatencyMs

    return {
      status: 200,
      cacheStatus: isCacheableByCDN ? CACHE_STATUS.MISS : CACHE_STATUS.BYPASS,
      servedBy: `Origin Server via ${pop.name}`,
      latencyMs: totalLatency,
      originLatencyMs: clientLoc.directOriginLatencyMs,
      latencySavedPercent: 0,
      ageSeconds: 0,
      body: originResponse.body,
      headers: {
        'cf-cache-status': isCacheableByCDN ? 'MISS' : 'BYPASS',
        'cf-ray': `${pop.id}_${Math.random().toString(36).substring(2, 8)}`,
        'cache-control': originResponse.cacheControl,
        age: 0,
      },
    }
  }

  /**
   * Guarda un recurso en la memoria del Edge PoP.
   */
  cacheAtEdge(popId, url, originResponse) {
    const directives = parseCacheControl(originResponse.cacheControl)
    // s-maxage tiene precedencia sobre max-age en proxys compartidos/CDN
    const ttl = directives.sMaxAge ?? directives.maxAge ?? 60
    const swr = directives.staleWhileRevalidate ?? 0

    this.edgeCaches[popId].set(url, {
      body: originResponse.body,
      cacheControl: originResponse.cacheControl,
      tags: originResponse.cacheTags || [],
      cachedAt: Date.now() / 1000,
      ttlSeconds: ttl,
      swrSeconds: swr,
    })
  }

  /**
   * Purga recursos cacheados por URL exacta en todos los PoPs o en uno específico.
   *
   * @param {string} url - URL a purgar.
   * @param {string} [targetPopId=null] - Si es null, purga a nivel mundial.
   * @returns {number} Cantidad de entradas purgadas.
   */
  purgeByUrl(url, targetPopId = null) {
    let count = 0
    const popsToPurge = targetPopId ? [targetPopId] : Object.keys(this.edgeCaches)

    popsToPurge.forEach((pId) => {
      if (this.edgeCaches[pId]?.has(url)) {
        this.edgeCaches[pId].delete(url)
        count++
      }
    })

    this.stats.purgedCount += count
    return count
  }

  /**
   * Purga recursos cacheados por Cache Tag (Surrogate-Key) globalmente.
   *
   * @param {string} tag - Tag a invalidar (ej. 'tag:catalog').
   * @returns {number} Cantidad de entradas invalidadas.
   */
  purgeByTag(tag) {
    let count = 0

    Object.keys(this.edgeCaches).forEach((pId) => {
      const popMap = this.edgeCaches[pId]
      popMap.forEach((entry, url) => {
        if (entry.tags && entry.tags.includes(tag)) {
          popMap.delete(url)
          count++
        }
      })
    })

    this.stats.purgedCount += count
    return count
  }

  /**
   * Obtiene un resumen de las entradas cacheadas y estadísticas.
   */
  getSnapshot() {
    const edgeSummary = {}
    Object.keys(this.edgeCaches).forEach((pId) => {
      const entries = []
      this.edgeCaches[pId].forEach((val, url) => {
        const ageSec = Math.round((Date.now() / 1000) - val.cachedAt)
        entries.push({
          url,
          ageSec,
          ttl: val.ttlSeconds,
          tags: val.tags,
          isFresh: ageSec <= val.ttlSeconds,
        })
      })
      edgeSummary[pId] = entries
    })

    return {
      stats: { ...this.stats },
      edgeSummary,
    }
  }

  /**
   * Reinicia la caché de todos los PoPs.
   */
  reset() {
    Object.keys(this.edgeCaches).forEach((pId) => this.edgeCaches[pId].clear())
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      staleRevalidations: 0,
      purgedCount: 0,
    }
  }
}
