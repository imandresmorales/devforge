/**
 * @fileoverview Simulador de Algoritmos de Balanceo de Carga y Alta Disponibilidad (Mejora 57).
 *
 * CARACTERÍSTICAS:
 * - Soporte para 4 algoritmos estándar en capas L4 y L7:
 *     - Round Robin: Distribución circular uniforme.
 *     - Weighted Round Robin: Proporcional a la capacidad/peso del nodo.
 *     - Least Connections: Asignación al nodo con menor concurrencia activa.
 *     - IP Hash: Hashing determinista para sesiones persistentes (Sticky Sessions).
 * - Monitor de Salud (Health Checking): Failover automático ante caídas y Failback al recuperarse.
 * - Registro de métricas por nodo (latencia, conexiones activas, peticiones acumuladas y carga porcentual).
 * - Generador de ráfagas de tráfico con distribución de clientes concurrentes.
 *
 * @module utils/loadBalancer
 */

/**
 * Algoritmos de balanceo soportados.
 */
export const LOAD_BALANCING_ALGORITHMS = {
  round_robin: {
    name: 'Round Robin',
    description: 'Distribución secuencial y circular uniforme entre todos los servidores saludables.',
  },
  weighted_round_robin: {
    name: 'Weighted Round Robin',
    description: 'Distribución ponderada en función de la capacidad de hardware y peso asignado a cada nodo.',
  },
  least_connections: {
    name: 'Least Connections',
    description: 'Enruta el tráfico entrante al nodo con la menor cantidad de conexiones activas en ese instante.',
  },
  ip_hash: {
    name: 'IP Hash (Sticky Sessions)',
    description: 'Calcula un hash de la IP del cliente para garantizar que sus peticiones vayan siempre al mismo servidor.',
  },
}

/**
 * Nodos backend iniciales para la simulación.
 */
export const DEFAULT_SERVERS = [
  { id: 'srv-1', name: 'App Node Alpha (US-East)', host: '10.0.1.11', port: 8080, weight: 3, activeConnections: 2, isHealthy: true, responseTimeMs: 18, totalRequestsServed: 0 },
  { id: 'srv-2', name: 'App Node Beta (US-East)', host: '10.0.1.12', port: 8080, weight: 2, activeConnections: 5, isHealthy: true, responseTimeMs: 24, totalRequestsServed: 0 },
  { id: 'srv-3', name: 'App Node Gamma (US-West)', host: '10.0.2.13', port: 8080, weight: 1, activeConnections: 1, isHealthy: true, responseTimeMs: 42, totalRequestsServed: 0 },
  { id: 'srv-4', name: 'App Node Delta (EU-Central)', host: '10.0.3.14', port: 8080, weight: 2, activeConnections: 0, isHealthy: true, responseTimeMs: 65, totalRequestsServed: 0 },
]

/**
 * Hash simple de 32 bits para dirección IP.
 */
function hashIp(ip) {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Clase que simula un balanceador de carga distribuido.
 */
export class LoadBalancerSimulator {
  /**
   * @param {Object} options
   * @param {Array} [options.servers] - Lista de nodos de servidor.
   * @param {string} [options.algorithm='round_robin'] - Algoritmo inicial.
   */
  constructor(options = {}) {
    this.servers = (options.servers || DEFAULT_SERVERS).map((s) => ({ ...s }))
    this.algorithm = options.algorithm || 'round_robin'
    this.rrIndex = 0
    this.weightedIndex = 0
    this.weightedCurrentWeight = 0
    this.requestLogs = []
    this.totalDispatched = 0
  }

  /**
   * Enruta una petición entrante al servidor backend óptimo.
   *
   * @param {string} [clientIp='192.168.1.50'] - IP del cliente.
   * @param {string} [path='/api/v1/orders'] - Endpoint solicitado.
   * @returns {{ success: boolean, server?: Object, error?: string, latencyMs?: number, requestId?: string }}
   */
  dispatch(clientIp = '192.168.1.50', path = '/api/v1/orders') {
    const healthy = this.servers.filter((s) => s.isHealthy)

    if (healthy.length === 0) {
      const errorLog = {
        id: `req_${Date.now()}_err`,
        clientIp,
        path,
        status: 503,
        error: '503 Service Unavailable: No healthy backend nodes available.',
        timestamp: Date.now(),
      }
      this.requestLogs.unshift(errorLog)
      return { success: false, error: errorLog.error }
    }

    let selected = null

    // ── 1. Round Robin ──
    if (this.algorithm === 'round_robin') {
      selected = healthy[this.rrIndex % healthy.length]
      this.rrIndex = (this.rrIndex + 1) % healthy.length
    }

    // ── 2. Weighted Round Robin ──
    else if (this.algorithm === 'weighted_round_robin') {
      const maxWeight = Math.max(...healthy.map((s) => s.weight))
      let attempts = 0
      while (!selected && attempts < 100) {
        attempts++
        this.weightedIndex = (this.weightedIndex + 1) % healthy.length
        if (this.weightedIndex === 0) {
          this.weightedCurrentWeight--
          if (this.weightedCurrentWeight <= 0) {
            this.weightedCurrentWeight = maxWeight
          }
        }
        if (healthy[this.weightedIndex].weight >= this.weightedCurrentWeight) {
          selected = healthy[this.weightedIndex]
        }
      }
      if (!selected) selected = healthy[0]
    }

    // ── 3. Least Connections ──
    else if (this.algorithm === 'least_connections') {
      selected = healthy.reduce((min, cur) =>
        cur.activeConnections < min.activeConnections ? cur : min
      )
    }

    // ── 4. IP Hash (Sticky Sessions) ──
    else if (this.algorithm === 'ip_hash') {
      const hash = hashIp(clientIp)
      selected = healthy[hash % healthy.length]
    }

    // Fallback
    if (!selected) selected = healthy[0]

    // Actualizar métricas del servidor
    selected.activeConnections++
    selected.totalRequestsServed++
    this.totalDispatched++

    const log = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      clientIp,
      path,
      serverId: selected.id,
      serverName: selected.name,
      latencyMs: selected.responseTimeMs + Math.floor(Math.random() * 6 - 3),
      status: 200,
      timestamp: Date.now(),
    }

    this.requestLogs.unshift(log)
    if (this.requestLogs.length > 40) {
      this.requestLogs.pop()
    }

    return {
      success: true,
      server: selected,
      latencyMs: log.latencyMs,
      requestId: log.id,
    }
  }

  /**
   * Libera una conexión activa de un servidor (simula fin de ciclo HTTP).
   *
   * @param {string} serverId
   */
  releaseConnection(serverId) {
    const s = this.servers.find((srv) => srv.id === serverId)
    if (s && s.activeConnections > 0) {
      s.activeConnections--
    }
  }

  /**
   * Alterna el estado de salud de un nodo (Health Check).
   *
   * @param {string} serverId
   * @param {boolean} isHealthy
   */
  setServerHealth(serverId, isHealthy) {
    const s = this.servers.find((srv) => srv.id === serverId)
    if (s) {
      s.isHealthy = isHealthy
      if (!isHealthy) {
        s.activeConnections = 0
      }
    }
  }

  /**
   * Modifica el peso de un servidor.
   *
   * @param {string} serverId
   * @param {number} weight
   */
  setServerWeight(serverId, weight) {
    const s = this.servers.find((srv) => srv.id === serverId)
    if (s) {
      s.weight = Math.max(1, Math.min(10, Number(weight) || 1))
    }
  }

  /**
   * Cambia el algoritmo de balanceo activo.
   *
   * @param {('round_robin'|'weighted_round_robin'|'least_connections'|'ip_hash')} algorithm
   */
  setAlgorithm(algorithm) {
    if (LOAD_BALANCING_ALGORITHMS[algorithm]) {
      this.algorithm = algorithm
      this.rrIndex = 0
      this.weightedIndex = 0
    }
  }

  /**
   * Ejecuta una ráfaga de peticiones concurrentes desde múltiples clientes.
   *
   * @param {number} [count=15]
   * @returns {Array} Resultados de las peticiones despachadas.
   */
  simulateTrafficBurst(count = 15) {
    const clientIps = [
      '192.168.1.45',
      '192.168.1.88',
      '10.200.4.12',
      '172.16.8.99',
      '192.168.1.105',
    ]

    const endpoints = ['/api/v1/auth/me', '/api/v1/checkout', '/api/v1/products', '/api/v1/users/profile']
    const results = []

    for (let i = 0; i < count; i++) {
      const ip = clientIps[Math.floor(Math.random() * clientIps.length)]
      const path = endpoints[Math.floor(Math.random() * endpoints.length)]
      const res = this.dispatch(ip, path)
      results.push(res)
    }

    return results
  }

  /**
   * Retorna estadísticas calculadas de distribución de carga.
   *
   * @returns {Object}
   */
  getStats() {
    const healthyCount = this.servers.filter((s) => s.isHealthy).length
    const totalRequests = this.totalDispatched

    const serverStats = this.servers.map((s) => {
      const sharePercent = totalRequests > 0
        ? Number(((s.totalRequestsServed / totalRequests) * 100).toFixed(1))
        : 0
      return {
        ...s,
        sharePercent,
      }
    })

    return {
      algorithm: this.algorithm,
      totalServers: this.servers.length,
      healthyServers: healthyCount,
      totalDispatched: totalRequests,
      servers: serverStats,
    }
  }

  /**
   * Reinicia contadores y logs.
   */
  reset() {
    this.servers = DEFAULT_SERVERS.map((s) => ({ ...s }))
    this.rrIndex = 0
    this.weightedIndex = 0
    this.totalDispatched = 0
    this.requestLogs = []
  }
}
