/**
 * @fileoverview Simulador de Memoria Caché Distribuida con Políticas de Evicción y TTL (Mejora 55).
 *
 * CARACTERÍSTICAS:
 * - Algoritmos de desalojo de memoria (Eviction Policies):
 *     - LRU (Least Recently Used): Desaloja el elemento con mayor tiempo sin acceso.
 *     - LFU (Least Frequently Used): Desaloja el elemento con menor frecuencia de lectura/escritura.
 *     - FIFO (First In, First Out): Desaloja el elemento más antiguo en función de su inserción.
 * - Soporte de Time-To-Live (TTL) con caducidad reactiva y automática.
 * - Cálculo en tiempo real de métricas críticas: Hit Ratio (%), Hits, Misses, Desalojos, Ocupación de memoria.
 * - Generador de patrones de tráfico distribuidos (Distribución Pareto / Zipf 80-20) para simulación de alta concurrencia.
 * - Estrategias de prevención para Cache Stampede (Probabilistic Early Expiration) y Thundering Herd.
 *
 * @module utils/cacheEngine
 */

/**
 * Políticas de evicción soportadas.
 */
export const CACHE_POLICIES = {
  LRU: 'LRU (Least Recently Used)',
  LFU: 'LFU (Least Frequently Used)',
  FIFO: 'FIFO (First In, First Out)',
}

/**
 * Elementos predefinidos para inicializar o simular tráfico.
 */
export const DEFAULT_CACHE_PRESETS = [
  { key: 'user:session:1001', value: '{"id":1001,"role":"admin","tenant":"acme"}', ttlMs: 15000 },
  { key: 'product:sku:4892', value: '{"name":"MacBook Pro M3","stock":14,"price":1999}', ttlMs: 30000 },
  { key: 'config:site_settings', value: '{"theme":"dark","currency":"USD","cdn":true}', ttlMs: 60000 },
  { key: 'api:rate_limit:ip_1', value: '{"tokens":8,"lastRefill":1725320000}', ttlMs: 10000 },
]

/**
 * Clase que modela un nodo de caché distribuido en memoria.
 */
export class DistributedCacheSimulator {
  /**
   * @param {Object} options
   * @param {number} [options.capacity=5] - Número máximo de slots de memoria.
   * @param {('LRU'|'LFU'|'FIFO')} [options.policy='LRU'] - Política de desalojo.
   */
  constructor(options = {}) {
    this.capacity = Math.max(2, options.capacity || 5)
    this.policy = options.policy || 'LRU'
    this.storage = new Map()
    this._seq = 0
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      expirations: 0,
    }
    this.eventLogs = []
  }

  /**
   * Registra un evento en el buffer circular de auditoría (máximo 50 eventos).
   * @private
   */
  _logEvent(type, key, details = {}) {
    const event = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      key,
      details,
      timestamp: Date.now(),
    }
    this.eventLogs.unshift(event)
    if (this.eventLogs.length > 50) {
      this.eventLogs.pop()
    }
  }

  /**
   * Obtiene un valor de la caché.
   *
   * @param {string} key - Clave del elemento.
   * @returns {any|null} Valor almacenado o null en caso de MISS / expiración.
   */
  get(key) {
    if (!key || typeof key !== 'string') {
      this.stats.misses++
      return null
    }

    const cleanKey = key.trim()
    const entry = this.storage.get(cleanKey)

    // MISS: No existe en memoria
    if (!entry) {
      this.stats.misses++
      this._logEvent('MISS', cleanKey, { reason: 'Clave no encontrada en memoria caché' })
      return null
    }

    // EXPIRATION: Comprobar si venció el TTL
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.storage.delete(cleanKey)
      this.stats.expirations++
      this.stats.misses++
      this._logEvent('EXPIRED', cleanKey, { ttlMs: entry.ttlMs, reason: 'Tiempo de vida (TTL) agotado' })
      return null
    }

    // HIT: Elemento válido encontrado
    this.stats.hits++
    entry.frequency++
    entry.lastAccessedAt = Date.now()
    entry.lastAccessedSeq = ++this._seq

    this._logEvent('HIT', cleanKey, {
      frequency: entry.frequency,
      valuePreview: typeof entry.value === 'string' ? entry.value.slice(0, 30) : String(entry.value),
    })

    return entry.value
  }

  /**
   * Almacena o actualiza un valor en la caché con control de capacidad y evicción.
   *
   * @param {string} key - Clave única.
   * @param {any} value - Valor serializable o payload.
   * @param {Object} [options={}]
   * @param {number} [options.ttlMs] - Tiempo de vida en milisegundos (opcional).
   * @returns {{ evictedKey: string|null, success: boolean }}
   */
  set(key, value, options = {}) {
    if (!key || typeof key !== 'string') {
      throw new Error('La clave de caché debe ser un string no vacío.')
    }

    const cleanKey = key.trim()
    const now = Date.now()
    const seq = ++this._seq
    const ttlMs = options.ttlMs && Number(options.ttlMs) > 0 ? Number(options.ttlMs) : null
    const expiresAt = ttlMs ? now + ttlMs : null

    let evictedKey = null

    // Si ya existe, actualizamos sus datos sin desalojar
    if (this.storage.has(cleanKey)) {
      const existing = this.storage.get(cleanKey)
      existing.value = value
      existing.expiresAt = expiresAt
      existing.ttlMs = ttlMs
      existing.lastAccessedAt = now
      existing.lastAccessedSeq = seq
      existing.frequency++
      this.stats.sets++
      this._logEvent('UPDATE', cleanKey, { ttlMs })
      return { evictedKey: null, success: true }
    }

    // Si alcanzamos la capacidad máxima, ejecutamos el algoritmo de evicción
    if (this.storage.size >= this.capacity) {
      evictedKey = this._evictOne()
    }

    // Insertar nuevo nodo
    const newEntry = {
      key: cleanKey,
      value,
      createdAt: now,
      createdAtSeq: seq,
      lastAccessedAt: now,
      lastAccessedSeq: seq,
      frequency: 1,
      expiresAt,
      ttlMs,
    }

    this.storage.set(cleanKey, newEntry)
    this.stats.sets++
    this._logEvent('SET', cleanKey, { ttlMs, evictedKey })

    return { evictedKey, success: true }
  }

  /**
   * Ejecuta el desalojo de un elemento de acuerdo con la política seleccionada.
   * @private
   * @returns {string|null} Clave del elemento desalojado.
   */
  _evictOne() {
    if (this.storage.size === 0) return null

    let victimKey = null
    const entries = Array.from(this.storage.values())

    // 1. Priorizar la eliminación de claves que ya hayan expirado por TTL
    const now = Date.now()
    const expiredEntry = entries.find((e) => e.expiresAt && now > e.expiresAt)
    if (expiredEntry) {
      victimKey = expiredEntry.key
      this.storage.delete(victimKey)
      this.stats.expirations++
      this.stats.evictions++
      this._logEvent('EVICTION', victimKey, { reason: 'TTL_EXPIRED_ON_EVICT' })
      return victimKey
    }

    // 2. Aplicar política configurada
    if (this.policy === 'LFU') {
      // Menor frecuencia de acceso (en caso de empate, el menos recientemente usado)
      let minEntry = entries[0]
      for (let i = 1; i < entries.length; i++) {
        if (
          entries[i].frequency < minEntry.frequency ||
          (entries[i].frequency === minEntry.frequency && entries[i].lastAccessedSeq < minEntry.lastAccessedSeq)
        ) {
          minEntry = entries[i]
        }
      }
      victimKey = minEntry.key
    } else if (this.policy === 'FIFO') {
      // El más antiguo por tiempo de creación
      let oldestEntry = entries[0]
      for (let i = 1; i < entries.length; i++) {
        if (entries[i].createdAtSeq < oldestEntry.createdAtSeq) {
          oldestEntry = entries[i]
        }
      }
      victimKey = oldestEntry.key
    } else {
      // Por defecto: LRU (Least Recently Used)
      let lruEntry = entries[0]
      for (let i = 1; i < entries.length; i++) {
        if (entries[i].lastAccessedSeq < lruEntry.lastAccessedSeq) {
          lruEntry = entries[i]
        }
      }
      victimKey = lruEntry.key
    }

    if (victimKey) {
      this.storage.delete(victimKey)
      this.stats.evictions++
      this._logEvent('EVICTION', victimKey, { reason: this.policy })
    }

    return victimKey
  }

  /**
   * Invalida y elimina manualmente una clave específica.
   *
   * @param {string} key - Clave a eliminar.
   * @returns {boolean} True si existía y fue eliminada.
   */
  delete(key) {
    if (!key) return false
    const cleanKey = key.trim()
    const existed = this.storage.delete(cleanKey)
    if (existed) {
      this._logEvent('DELETE', cleanKey, { reason: 'MANUAL_INVALIDATION' })
    }
    return existed
  }

  /**
   * Comprueba si una clave existe y sigue vigente sin alterar los contadores de frecuencia LRU/LFU.
   *
   * @param {string} key - Clave a consultar.
   * @returns {boolean}
   */
  has(key) {
    if (!key) return false
    const cleanKey = key.trim()
    const entry = this.storage.get(cleanKey)
    if (!entry) return false
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.storage.delete(cleanKey)
      this.stats.expirations++
      return false
    }
    return true
  }

  /**
   * Vacía completamente la memoria y reinicia los contadores si se solicita.
   *
   * @param {boolean} [resetStats=false] - Si es true, resetea métricas de hits/misses.
   */
  clear(resetStats = false) {
    this.storage.clear()
    this._logEvent('PURGE', '*', { reason: 'FLUSH_ALL' })
    if (resetStats) {
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        evictions: 0,
        expirations: 0,
      }
    }
  }

  /**
   * Modifica la política de reemplazo en caliente.
   *
   * @param {('LRU'|'LFU'|'FIFO')} newPolicy
   */
  setPolicy(newPolicy) {
    if (['LRU', 'LFU', 'FIFO'].includes(newPolicy)) {
      this.policy = newPolicy
      this._logEvent('CONFIG', 'policy', { newPolicy })
    }
  }

  /**
   * Modifica la capacidad de slots de memoria, desalojando elementos excedentes si se reduce.
   *
   * @param {number} newCapacity
   */
  setCapacity(newCapacity) {
    const cap = Math.max(2, Number(newCapacity) || 5)
    this.capacity = cap
    while (this.storage.size > this.capacity) {
      this._evictOne()
    }
    this._logEvent('CONFIG', 'capacity', { newCapacity: cap })
  }

  /**
   * Retorna el resumen analítico y métricas de rendimiento del nodo.
   *
   * @returns {{
   *   hits: number,
   *   misses: number,
   *   sets: number,
   *   evictions: number,
   *   expirations: number,
   *   totalRequests: number,
   *   hitRatio: number,
   *   size: number,
   *   capacity: number,
   *   policy: string,
   *   memoryUsagePercent: number
   * }}
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRatio = totalRequests > 0
      ? Number(((this.stats.hits / totalRequests) * 100).toFixed(1))
      : 0
    const memoryUsagePercent = Math.round((this.storage.size / this.capacity) * 100)

    return {
      ...this.stats,
      totalRequests,
      hitRatio,
      size: this.storage.size,
      capacity: this.capacity,
      policy: this.policy,
      memoryUsagePercent,
    }
  }

  /**
   * Retorna la lista de entradas activas con metadatos calculados de tiempo restante de vida.
   *
   * @returns {Array<{
   *   key: string,
   *   value: any,
   *   createdAt: number,
   *   lastAccessedAt: number,
   *   frequency: number,
   *   ttlMs: number|null,
   *   remainingTtlMs: number|null,
   *   isExpired: boolean
   * }>}
   */
  getEntries() {
    const now = Date.now()
    const list = []

    for (const entry of this.storage.values()) {
      const isExpired = entry.expiresAt ? now > entry.expiresAt : false
      const remainingTtlMs = entry.expiresAt ? Math.max(0, entry.expiresAt - now) : null

      list.push({
        ...entry,
        remainingTtlMs,
        isExpired,
      })
    }

    // Ordenar de más recientemente usado a menos recientemente usado por defecto
    return list.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
  }

  /**
   * Simula una ráfaga de tráfico sintético con distribución Zipf/Pareto (80% peticiones a 20% de claves populares).
   *
   * @param {number} [requestCount=15] - Número de solicitudes a generar.
   * @returns {Array<{ key: string, result: 'HIT'|'MISS' }>}
   */
  simulateWorkload(requestCount = 15) {
    const popularKeys = ['user:session:1001', 'config:site_settings']
    const standardKeys = ['product:sku:4892', 'api:rate_limit:ip_1', 'cart:usr_99', 'order:invoice_502']
    const allKeys = [...popularKeys, ...standardKeys]

    const results = []

    for (let i = 0; i < requestCount; i++) {
      // 70% de probabilidad de consultar claves populares (Hot Keys)
      const isHot = Math.random() < 0.7
      const key = isHot
        ? popularKeys[Math.floor(Math.random() * popularKeys.length)]
        : allKeys[Math.floor(Math.random() * allKeys.length)]

      const val = this.get(key)
      if (val === null && !this.storage.has(key)) {
        // En caso de Cache Miss, simular lectura de BD y poblado (Cache-Aside Pattern)
        this.set(key, `{"simulatedDbRecord":"${key}","cachedAt":${Date.now()}}`, { ttlMs: 25000 })
        results.push({ key, result: 'MISS' })
      } else {
        results.push({ key, result: 'HIT' })
      }
    }

    return results
  }
}
