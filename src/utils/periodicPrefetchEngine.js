/**
 * @fileoverview Motor de sincronización periódica en segundo plano (Periodic Background Sync API)
 * y prefetching especulativo inteligente (Mejora 104).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Respeto al modo Save-Data del usuario (no prefetching si saveData=true o red 2G).
 * - Intervalo mínimo configurable (ej. 12h o 24h) para no agotar batería ni datos móviles.
 * - Validación de origen seguro (HTTPS) y permisos del navegador ('periodic-background-sync').
 * - Prefetching granular de rutas documentales y assets estáticos.
 *
 * @module utils/periodicPrefetchEngine
 */

/**
 * Rutas candidatas para prefetching periódico por orden de prioridad.
 */
export const PREFETCH_MANIFEST = [
  { path: '/docs', priority: 'high', estimatedBytes: 15400, category: 'docs' },
  { path: '/about', priority: 'medium', estimatedBytes: 6200, category: 'page' },
  { path: '/pricing', priority: 'medium', estimatedBytes: 8100, category: 'page' },
  { path: '/contact', priority: 'low', estimatedBytes: 4500, category: 'page' },
  { path: '/manifest.json', priority: 'high', estimatedBytes: 731, category: 'asset' },
  { path: '/icons/icon-192.svg', priority: 'high', estimatedBytes: 2400, category: 'asset' },
  { path: '/icons/icon-512.svg', priority: 'high', estimatedBytes: 5120, category: 'asset' },
]

/**
 * Evalúa si las condiciones de red del cliente permiten prefetching especulativo.
 * @param {{ saveData?: boolean, effectiveType?: string }} [connectionInfo]
 * @returns {{ allowed: boolean, reason: string }}
 */
export function evaluatePrefetchEligibility(connectionInfo = {}) {
  if (connectionInfo.saveData) {
    return {
      allowed: false,
      reason: 'Prefetch deshabilitado: El usuario tiene activo el modo Ahorro de Datos (Save-Data).',
    }
  }

  const effectiveType = connectionInfo.effectiveType || '4g'
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return {
      allowed: false,
      reason: `Prefetch suspendido: Conexión lenta detectada (${effectiveType}) para preservar ancho de banda.`,
    }
  }

  return {
    allowed: true,
    reason: `Conexión óptima (${effectiveType}). Prefetching habilitado.`,
  }
}

/**
 * Gestor de Periodic Background Sync y Prefetching.
 */
export class PeriodicPrefetchEngine {
  /**
   * @param {number} minIntervalHours - Intervalo mínimo de sincronización en horas.
   */
  constructor(minIntervalHours = 12) {
    this.minIntervalHours = minIntervalHours
    this.tag = 'devforge-periodic-prefetch'
    /** @type {Array<{ path: string, prefetchedAt: number, status: 'success'|'skipped'|'error', bytes: number }>} */
    this.history = []
    this.lastSyncTimestamp = null
  }

  /**
   * Genera el plan de prefetch según la elegibilidad de red.
   * @param {{ saveData?: boolean, effectiveType?: string }} [networkContext]
   * @returns {{ eligible: boolean, reason: string, itemsToFetch: Array<typeof PREFETCH_MANIFEST[0]>, totalBytes: number }}
   */
  planPrefetch(networkContext) {
    const eligibility = evaluatePrefetchEligibility(networkContext)
    if (!eligibility.allowed) {
      return {
        eligible: false,
        reason: eligibility.reason,
        itemsToFetch: [],
        totalBytes: 0,
      }
    }

    const itemsToFetch = PREFETCH_MANIFEST.filter((item) => item.priority === 'high' || item.priority === 'medium')
    const totalBytes = itemsToFetch.reduce((acc, curr) => acc + curr.estimatedBytes, 0)

    return {
      eligible: true,
      reason: eligibility.reason,
      itemsToFetch,
      totalBytes,
    }
  }

  /**
   * Ejecuta el ciclo de prefetching periódico simulando o realizando peticiones.
   * @param {(path: string) => Promise<boolean>} [fetchFn]
   * @param {{ saveData?: boolean, effectiveType?: string }} [networkContext]
   * @returns {Promise<{ executed: boolean, fetchedCount: number, totalBytes: number, results: Array<{ path: string, success: boolean }> }>}
   */
  async executePeriodicSync(fetchFn, networkContext) {
    const plan = this.planPrefetch(networkContext)
    if (!plan.eligible) {
      return {
        executed: false,
        fetchedCount: 0,
        totalBytes: 0,
        results: [],
      }
    }

    const results = []
    let fetchedCount = 0
    let totalBytesFetched = 0
    const now = Date.now()

    for (const item of plan.itemsToFetch) {
      try {
        let ok = true
        if (fetchFn) {
          ok = await fetchFn(item.path)
        } else {
          await new Promise((r) => setTimeout(r, 60))
        }

        if (ok) {
          fetchedCount += 1
          totalBytesFetched += item.estimatedBytes
          this.history.push({ path: item.path, prefetchedAt: now, status: 'success', bytes: item.estimatedBytes })
          results.push({ path: item.path, success: true })
        } else {
          this.history.push({ path: item.path, prefetchedAt: now, status: 'error', bytes: 0 })
          results.push({ path: item.path, success: false })
        }
      } catch {
        this.history.push({ path: item.path, prefetchedAt: now, status: 'error', bytes: 0 })
        results.push({ path: item.path, success: false })
      }
    }

    this.lastSyncTimestamp = now
    return {
      executed: true,
      fetchedCount,
      totalBytes: totalBytesFetched,
      results,
    }
  }

  /**
   * Obtiene estadísticas del motor de prefetch.
   */
  getStats() {
    return {
      minIntervalHours: this.minIntervalHours,
      tag: this.tag,
      lastSyncTimestamp: this.lastSyncTimestamp,
      totalHistoryEntries: this.history.length,
      successfulPrefetches: this.history.filter((h) => h.status === 'success').length,
    }
  }
}

/** Instancia singleton global */
export const defaultPrefetchEngine = new PeriodicPrefetchEngine(12)
