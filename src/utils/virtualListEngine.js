/**
 * @fileoverview Motor de Virtualización de Listas Grandes y Windowing (Mejora 88).
 *
 * OPTIMIZACIÓN DE RENDIMIENTO Y DOM:
 * - Algoritmo de renderizado por viewport (Virtual Windowing / Virtual Scrolling).
 * - Renderiza únicamente los elementos visibles en el área de visualización más un búfer de sobreexploración (overscan).
 * - Permite manejar conjuntos masivos de datos (10,000 a 1,000,000+ filas) manteniendo un número constante de nodos DOM.
 * - Reduce el tiempo de renderizado de O(N) a O(1), previniendo congelamientos de hilo principal (Jank) y fugas de memoria.
 *
 * @module utils/virtualListEngine
 */

/**
 * Calcula los índices y desplazamientos para el renderizado virtual.
 *
 * @param {Object} params
 * @param {number} params.scrollTop - Posición actual del scroll vertical en px.
 * @param {number} params.viewportHeight - Altura del contenedor visible en px.
 * @param {number} params.itemHeight - Altura fija de cada fila en px.
 * @param {number} params.totalCount - Número total de elementos en el dataset.
 * @param {number} [params.overscan=3] - Número de elementos adicionales a renderizar arriba y abajo.
 * @returns {{
 *   startIndex: number,
 *   endIndex: number,
 *   visibleCount: number,
 *   totalHeight: number,
 *   offsetY: number,
 *   domNodesCount: number,
 *   memoryReductionPercent: number
 * }}
 */
export function calculateVirtualWindow({
  scrollTop = 0,
  viewportHeight = 400,
  itemHeight = 48,
  totalCount = 0,
  overscan = 3,
}) {
  const safeItemHeight = Math.max(1, itemHeight)
  const safeTotalCount = Math.max(0, totalCount)
  const safeScrollTop = Math.max(0, scrollTop)
  const safeViewportHeight = Math.max(1, viewportHeight)
  const safeOverscan = Math.max(0, overscan)

  const totalHeight = safeTotalCount * safeItemHeight

  if (safeTotalCount === 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      visibleCount: 0,
      totalHeight: 0,
      offsetY: 0,
      domNodesCount: 0,
      memoryReductionPercent: 100,
    }
  }

  // Índice del primer elemento visible en el viewport
  const rawStartIndex = Math.floor(safeScrollTop / safeItemHeight)
  // Cantidad de elementos que caben en el viewport visible
  const visibleCount = Math.ceil(safeViewportHeight / safeItemHeight)

  // Aplicar overscan como amortiguador para evitar parpadeos al hacer scroll rápido
  const startIndex = Math.max(0, rawStartIndex - safeOverscan)
  const endIndex = Math.min(safeTotalCount - 1, rawStartIndex + visibleCount + safeOverscan)

  // Desplazamiento vertical absoluto del primer elemento renderizado
  const offsetY = startIndex * safeItemHeight

  const domNodesCount = Math.max(0, endIndex - startIndex + 1)
  const memoryReductionPercent = safeTotalCount > 0
    ? Number((((safeTotalCount - domNodesCount) / safeTotalCount) * 100).toFixed(2))
    : 100

  return {
    startIndex,
    endIndex,
    visibleCount,
    totalHeight,
    offsetY,
    domNodesCount,
    memoryReductionPercent,
  }
}

/**
 * Genera un conjunto masivo de registros simulados para auditoría y telemetría.
 *
 * @param {number} count - Cantidad de registros a generar.
 * @returns {Array<Object>}
 */
export function generateSyntheticDataset(count = 10000) {
  const severities = ['INFO', 'WARN', 'ERROR', 'AUDIT', 'SECURITY']
  const modules = ['AuthGateway', 'RateLimiter', 'PaymentEngine', 'ZKPSnark', 'ClusterConsensus', 'WebRTCData']
  const actions = ['TOKEN_ISSUED', 'PAYMENT_CAPTURED', 'CORS_BLOCKED', 'RAFT_ELECTION', 'OUTBOX_PROCESSED', 'SANITY_CHECK']

  const dataset = new Array(count)
  const baseTime = Date.now() - count * 1000

  for (let i = 0; i < count; i++) {
    const sev = severities[i % severities.length]
    const mod = modules[i % modules.length]
    const act = actions[i % actions.length]
    dataset[i] = {
      id: `EVT-${(i + 1).toString().padStart(7, '0')}`,
      index: i + 1,
      timestamp: new Date(baseTime + i * 1000).toISOString().replace('T', ' ').slice(0, 19),
      severity: sev,
      module: mod,
      action: act,
      traceId: `trc_${Math.sin(i).toString(36).substring(2, 10)}`,
      latencyMs: (Math.abs(Math.sin(i * 13)) * 45 + 5).toFixed(1),
    }
  }

  return dataset
}
