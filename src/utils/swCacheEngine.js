/**
 * @fileoverview Motor de estrategias de caché avanzadas y gestión de ciclo de vida (TTL & LRU)
 * para Service Worker y aplicaciones PWA (Mejora 102).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Evita cachear información confidencial (tokens, autorizaciones, endpoints /auth).
 * - Algoritmo LRU (Least Recently Used) para prevenir desbordamiento de almacenamiento.
 * - TTL (Time To Live) estricto por tipo de recurso para evitar datos obsoletos.
 * - Soporte de cabeceras de control de caché normalizadas.
 *
 * @module utils/swCacheEngine
 */

/**
 * Tipos de estrategias de caché soportadas.
 * @readonly
 * @enum {string}
 */
export const CACHE_STRATEGIES = {
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
}

/**
 * Tiempos de vida (TTL) por defecto en milisegundos.
 */
export const DEFAULT_TTL_CONFIG = {
  STATIC_ASSETS: 7 * 24 * 60 * 60 * 1000, // 7 días (JS, CSS, SVGs)
  DOCUMENTATION: 24 * 60 * 60 * 1000,     // 24 horas (Docs, Markdown)
  DYNAMIC_API: 5 * 60 * 1000,              // 5 minutos (datos no sensibles)
}

/**
 * Evalúa si una URL es segura para almacenar en caché.
 * @param {string} urlString - URL a evaluar.
 * @returns {boolean} True si es segura para cachear.
 */
export function isSafeToCache(urlString) {
  if (!urlString || typeof urlString !== 'string') return false

  try {
    const url = new URL(urlString, 'https://devforge.internal')
    const lowerPath = url.pathname.toLowerCase()

    // Reglas de exclusión de seguridad
    if (
      lowerPath.includes('/auth') ||
      lowerPath.includes('/login') ||
      lowerPath.includes('/api/private') ||
      lowerPath.includes('/keys') ||
      lowerPath.includes('/admin/secret')
    ) {
      return false
    }

    // Solo esquemas seguros http/https
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Estructura en memoria para simular y gestionar metadata de entradas en caché con LRU.
 */
export class AdvancedCacheStore {
  /**
   * @param {number} maxEntries - Límite máximo de entradas permitidas.
   */
  constructor(maxEntries = 50) {
    this.maxEntries = maxEntries
    /** @type {Map<string, { data: any, addedAt: number, lastAccessedAt: number, ttl: number, sizeBytes: number }>} */
    this.entries = new Map()
    this.hits = 0
    this.misses = 0
  }

  /**
   * Inserta o actualiza un recurso en la caché.
   * @param {string} key - Clave del recurso (URL o identificador).
   * @param {any} data - Contenido o representación del recurso.
   * @param {number} [ttl=DEFAULT_TTL_CONFIG.STATIC_ASSETS] - Tiempo de vida en ms.
   * @param {number} [sizeBytes=1024] - Tamaño estimado en bytes.
   * @returns {boolean} True si se almacenó con éxito.
   */
  put(key, data, ttl = DEFAULT_TTL_CONFIG.STATIC_ASSETS, sizeBytes = 1024) {
    if (!isSafeToCache(key)) {
      return false
    }

    const now = Date.now()

    // Si ya existe, actualizamos
    if (this.entries.has(key)) {
      this.entries.delete(key)
    } else if (this.entries.size >= this.maxEntries) {
      // Aplicar desalojo LRU (el primer elemento en Map es el más antiguo no accedido)
      const oldestKey = this.entries.keys().next().value
      if (oldestKey) {
        this.entries.delete(oldestKey)
      }
    }

    this.entries.set(key, {
      data,
      addedAt: now,
      lastAccessedAt: now,
      ttl,
      sizeBytes,
    })

    return true
  }

  /**
   * Recupera un recurso de la caché considerando expiración TTL.
   * @param {string} key - Clave del recurso.
   * @returns {any|null} Contenido del recurso o null si expiró/no existe.
   */
  get(key) {
    const entry = this.entries.get(key)
    if (!entry) {
      this.misses += 1
      return null
    }

    const now = Date.now()
    if (now - entry.addedAt > entry.ttl) {
      // Expirado: eliminar y contar miss
      this.entries.delete(key)
      this.misses += 1
      return null
    }

    // Actualizar LRU re-insertando al final
    this.entries.delete(key)
    entry.lastAccessedAt = now
    this.entries.set(key, entry)

    this.hits += 1
    return entry.data
  }

  /**
   * Elimina un recurso específico.
   * @param {string} key
   * @returns {boolean}
   */
  delete(key) {
    return this.entries.delete(key)
  }

  /**
   * Purga todas las entradas expiradas.
   * @returns {number} Cantidad de entradas eliminadas.
   */
  purgeExpired() {
    const now = Date.now()
    let purgedCount = 0

    for (const [key, entry] of this.entries.entries()) {
      if (now - entry.addedAt > entry.ttl) {
        this.entries.delete(key)
        purgedCount += 1
      }
    }

    return purgedCount
  }

  /**
   * Obtiene estadísticas de la caché.
   * @returns {{ totalEntries: number, maxEntries: number, totalBytes: number, hits: number, misses: number, hitRatePercent: number, entriesList: Array<{ key: string, ageMs: number, ttl: number, isExpired: boolean, sizeBytes: number }> }}
   */
  getStats() {
    const now = Date.now()
    let totalBytes = 0
    const entriesList = []

    for (const [key, entry] of this.entries.entries()) {
      totalBytes += entry.sizeBytes
      const ageMs = now - entry.addedAt
      entriesList.push({
        key,
        ageMs,
        ttl: entry.ttl,
        isExpired: ageMs > entry.ttl,
        sizeBytes: entry.sizeBytes,
      })
    }

    const totalRequests = this.hits + this.misses
    const hitRatePercent = totalRequests > 0 ? Math.round((this.hits / totalRequests) * 100) : 0

    return {
      totalEntries: this.entries.size,
      maxEntries: this.maxEntries,
      totalBytes,
      hits: this.hits,
      misses: this.misses,
      hitRatePercent,
      entriesList,
    }
  }

  /**
   * Limpia toda la caché.
   */
  clear() {
    this.entries.clear()
    this.hits = 0
    this.misses = 0
  }
}

/** Instancia singleton para uso general */
export const defaultCacheStore = new AdvancedCacheStore(30)
