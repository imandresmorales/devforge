/**
 * @fileoverview Motor de Particionamiento Horizontal y Anillo de Hash Consistente (Mejora 74).
 *
 * CARACTERÍSTICAS:
 * - Implementación del algoritmo de Consistent Hashing con Nodos Virtuales (vnodes):
 *     1. Espacio de hash circular de 32 bits: [0, 4294967295] proyectado a 360°.
 *     2. Nodos virtuales por nodo físico para garantizar distribución uniforme (evitar hotspots).
 *     3. Búsqueda eficiente O(log N) del nodo responsable en sentido horario (Clockwise).
 *     4. Factor de replicación (N réplicas físicas distintas por clave para alta disponibilidad).
 *     5. Análisis de impacto de migración de claves ante escalado horizontal (Add / Remove Node).
 *
 * @module utils/consistentHashing
 */

/**
 * Función de hashing de 32 bits basada en FNV-1a para distribución uniforme de enteros.
 * @param {string} str
 * @returns {number} Entero sin signo de 32 bits [0, 4294967295]
 */
export function hash32(str) {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    // Multiplicación con FNV prime 16777619 usando aritmética de 32 bits
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash >>> 0
}

const MAX_HASH = 4294967295

/**
 * Convierte un valor hash de 32 bits a grados (0 a 360) para visualización en la UI.
 * @param {number} hashValue
 * @returns {number}
 */
export function hashToDegrees(hashValue) {
  return Number(((hashValue / MAX_HASH) * 360).toFixed(2))
}

/**
 * Clase que gestiona el Anillo de Hash Consistente con soporte para Vnodes.
 */
export class ConsistentHashRing {
  /**
   * @param {Object} [options]
   * @param {number} [options.vnodes=3] - Número de réplicas virtuales por nodo físico
   * @param {Array<string>} [options.nodes=[]] - Nodos físicos iniciales
   */
  constructor(options = {}) {
    this.vnodesCount = options.vnodes || 3
    this.nodes = new Set() // Nodos físicos: Set<string>
    // Array ordenado de tokens virtuales: Array<{ token: number, degrees: number, physicalNode: string, vnodeId: string }>
    this.ring = []
    this.storedKeys = new Map() // key -> data payload

    if (Array.isArray(options.nodes)) {
      options.nodes.forEach((n) => this.addNode(n))
    }
  }

  /**
   * Añade un nodo físico al anillo creando sus respectivos vnodes.
   * @param {string} nodeId
   * @param {number} [customVnodes]
   */
  addNode(nodeId, customVnodes = this.vnodesCount) {
    if (!nodeId || this.nodes.has(nodeId)) return false

    this.nodes.add(nodeId)

    for (let i = 0; i < customVnodes; i++) {
      const vnodeKey = `${nodeId}#vn_${i}`
      const token = hash32(vnodeKey)
      const degrees = hashToDegrees(token)

      this.ring.push({
        token,
        degrees,
        physicalNode: nodeId,
        vnodeId: vnodeKey,
      })
    }

    // Mantener el anillo ordenado por token ascendente para búsqueda binaria
    this.ring.sort((a, b) => a.token - b.token)
    return true
  }

  /**
   * Elimina un nodo físico y todos sus nodos virtuales del anillo.
   * @param {string} nodeId
   */
  removeNode(nodeId) {
    if (!this.nodes.has(nodeId)) return false
    this.nodes.delete(nodeId)
    this.ring = this.ring.filter((vnode) => vnode.physicalNode !== nodeId)
    return true
  }

  /**
   * Encuentra el nodo físico responsable de almacenar una clave (primer nodo en sentido horario).
   * @param {string} key
   * @returns {string|null} ID del nodo físico
   */
  getNode(key) {
    if (this.ring.length === 0) return null

    const keyHash = hash32(key)

    // Búsqueda binaria para encontrar el primer vnode con token >= keyHash
    let low = 0
    let high = this.ring.length - 1

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (this.ring[mid].token >= keyHash) {
        high = mid - 1
      } else {
        low = mid + 1
      }
    }

    // Si low está fuera de rango, se envuelve (wrap around) al primer elemento del anillo (0°)
    const targetIndex = low < this.ring.length ? low : 0
    return this.ring[targetIndex].physicalNode
  }

  /**
   * Retorna una lista de N nodos físicos distintos para replicación de datos (Estilo Cassandra / DynamoDB).
   * @param {string} key
   * @param {number} [replicas=2]
   * @returns {Array<string>}
   */
  getReplicationNodes(key, replicas = 2) {
    if (this.ring.length === 0) return []

    const keyHash = hash32(key)
    let low = 0
    let high = this.ring.length - 1

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (this.ring[mid].token >= keyHash) {
        high = mid - 1
      } else {
        low = mid + 1
      }
    }

    let startIndex = low < this.ring.length ? low : 0
    const selectedNodes = new Set()

    for (let i = 0; i < this.ring.length && selectedNodes.size < Math.min(replicas, this.nodes.size); i++) {
      const currIdx = (startIndex + i) % this.ring.length
      selectedNodes.add(this.ring[currIdx].physicalNode)
    }

    return Array.from(selectedNodes)
  }

  /**
   * Inserta o actualiza un registro en el clúster particionado.
   * @param {string} key
   * @param {*} value
   */
  put(key, value) {
    const primaryNode = this.getNode(key)
    if (!primaryNode) return null

    const entry = {
      key,
      value,
      keyHash: hash32(key),
      degrees: hashToDegrees(hash32(key)),
      primaryNode,
      replicas: this.getReplicationNodes(key, 2),
    }

    this.storedKeys.set(key, entry)
    return entry
  }

  /**
   * Calcula estadísticas de distribución y balanceo de carga entre nodos.
   */
  getDistributionStats() {
    const distribution = {}
    this.nodes.forEach((n) => {
      distribution[n] = 0
    })

    this.storedKeys.forEach((entry) => {
      if (distribution[entry.primaryNode] !== undefined) {
        distribution[entry.primaryNode]++
      }
    })

    const counts = Object.values(distribution)
    const totalKeys = counts.reduce((a, b) => a + b, 0)
    const avgKeys = this.nodes.size > 0 ? totalKeys / this.nodes.size : 0

    // Varianza y desviación estándar
    const variance = this.nodes.size > 0
      ? counts.reduce((acc, c) => acc + Math.pow(c - avgKeys, 2), 0) / this.nodes.size
      : 0
    const stdDev = Math.sqrt(variance)

    return {
      totalNodes: this.nodes.size,
      totalVnodes: this.ring.length,
      totalKeys,
      distribution,
      avgKeysPerNode: Number(avgKeys.toFixed(1)),
      stdDev: Number(stdDev.toFixed(2)),
      isBalanced: stdDev <= (avgKeys * 0.45),
    }
  }

  /**
   * Simula cuántas claves deben migrarse si se añade o remueve un nodo.
   * @param {string} candidateNodeId
   * @param {'add'|'remove'} action
   * @returns {{ migratedKeysCount: number, migrationPercent: number }}
   */
  simulateMigrationImpact(candidateNodeId, action = 'add') {
    if (this.storedKeys.size === 0) return { migratedKeysCount: 0, migrationPercent: 0 }

    // Clonar anillo
    const testRing = new ConsistentHashRing({ vnodes: this.vnodesCount, nodes: Array.from(this.nodes) })

    if (action === 'add') {
      testRing.addNode(candidateNodeId)
    } else {
      testRing.removeNode(candidateNodeId)
    }

    let migrated = 0
    this.storedKeys.forEach((entry, key) => {
      const newNode = testRing.getNode(key)
      if (newNode !== entry.primaryNode) {
        migrated++
      }
    })

    const migrationPercent = Number(((migrated / this.storedKeys.size) * 100).toFixed(1))

    return {
      migratedKeysCount: migrated,
      migrationPercent,
    }
  }

  getSnapshot() {
    return {
      physicalNodes: Array.from(this.nodes),
      vnodesCount: this.vnodesCount,
      ringTokens: this.ring.map((v) => ({ ...v })),
      keys: Array.from(this.storedKeys.values()),
      stats: this.getDistributionStats(),
    }
  }
}
