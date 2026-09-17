/**
 * @fileoverview Motor de Chaos Engineering y Resiliencia en Sistemas Distribuidos.
 *
 * Implementa los principios de la Ingeniería del Caos (Netflix Chaos Monkey / Chaos Mesh).
 * Inyecta perturbaciones y fallos controlados en una topología distribuida para evaluar el
 * radio de impacto (Blast Radius), tiempo medio de recuperación (MTTR), disponibilidad del
 * sistema (SLO/SLI) y la respuesta automática de patrones de resiliencia (Circuit Breakers,
 * Retries, Rebalanceo y Auto-Healing).
 *
 * Tipos de Ataques de Caos:
 * 1. LATENCY_SPIKE: Inyección de retardo artificial en llamadas RPC/HTTP (ej. 2500ms).
 * 2. NODE_TERMINATION: Terminación abrupta de instancias (Kill Pod / SIGKILL).
 * 3. PACKET_LOSS: Pérdida aleatoria de paquetes TCP/UDP (ej. 40% loss).
 * 4. NETWORK_PARTITION: Partición de red / Split-brain entre regiones.
 * 5. RESOURCE_EXHAUSTION: Agotamiento de conexiones a base de datos o pool de hilos.
 *
 * @module utils/chaosEngine
 */

/**
 * Catálogo de experimentos de caos disponibles.
 */
export const CHAOS_EXPERIMENTS = {
  LATENCY_SPIKE: {
    id: 'LATENCY_SPIKE',
    name: 'Pico de Latencia Extrema (Latency Injection)',
    desc: 'Introduce demoras aleatorias de 1.5s a 3.5s en los microservicios intermedios.',
    severity: 'MEDIUM'
  },
  NODE_TERMINATION: {
    id: 'NODE_TERMINATION',
    name: 'Terminación Abrupta de Nodos (Chaos Monkey)',
    desc: 'Elimina aleatoriamente el 30% de los pods del clúster para validar auto-healing.',
    severity: 'HIGH'
  },
  PACKET_LOSS: {
    id: 'PACKET_LOSS',
    name: 'Pérdida Severa de Paquetes (Packet Loss 45%)',
    desc: 'Simula congestión de red descartando casi la mitad de los paquetes en tránsito.',
    severity: 'HIGH'
  },
  NETWORK_PARTITION: {
    id: 'NETWORK_PARTITION',
    name: 'Partición de Red / Split-Brain',
    desc: 'Aísla la región Primaria (US-East) de la Secundaria (EU-West).',
    severity: 'CRITICAL'
  },
  RESOURCE_EXHAUSTION: {
    id: 'RESOURCE_EXHAUSTION',
    name: 'Agotamiento de Pool de Conexiones DB',
    desc: 'Satura el 100% del pool de conexiones PostgreSQL para probar backoff y circuit breaker.',
    severity: 'CRITICAL'
  }
}

/**
 * Genera la topología de microservicios distribuida para el experimento.
 * @returns {Array<object>}
 */
export function createChaosTopology() {
  return [
    { id: 'api-gateway', name: 'API Gateway Ingress', region: 'us-east-1', status: 'HEALTHY', replicas: 3, latencyMs: 15, errorRate: 0.01 },
    { id: 'auth-service', name: 'Auth & JWT Service', region: 'us-east-1', status: 'HEALTHY', replicas: 2, latencyMs: 25, errorRate: 0.02 },
    { id: 'orders-service', name: 'Orders Core API', region: 'us-east-1', status: 'HEALTHY', replicas: 4, latencyMs: 35, errorRate: 0.01 },
    { id: 'payment-service', name: 'Payment Processor', region: 'eu-west-1', status: 'HEALTHY', replicas: 3, latencyMs: 80, errorRate: 0.03 },
    { id: 'postgres-db', name: 'PostgreSQL Primary DB', region: 'us-east-1', status: 'HEALTHY', replicas: 2, latencyMs: 10, errorRate: 0.00 }
  ]
}

/**
 * Ejecuta un experimento de caos controlado sobre la topología de servicios.
 * @param {string} experimentId - ID del experimento (clave de CHAOS_EXPERIMENTS).
 * @param {Array<object>} topology - Topología generada por createChaosTopology.
 * @param {object} [options] - Parámetros configurables (duración, resiliencia habilitada).
 * @returns {object} Resultado del experimento con métricas y estado post-caos.
 */
export function runChaosExperiment(experimentId, topology, options = {}) {
  const experiment = CHAOS_EXPERIMENTS[experimentId]
  if (!experiment) {
    throw new Error(`Experimento de caos no reconocido: ${experimentId}`)
  }

  const withResilience = options.withResilience !== false // Por defecto activo
  const auditLogs = []
  const startTime = Date.now()

  auditLogs.push({
    timestamp: startTime,
    event: 'EXPERIMENT_STARTED',
    message: `Iniciando experimento de Caos: [${experiment.name}]. Resiliencia automática: ${withResilience ? 'ACTIVADA' : 'DESACTIVADA'}.`
  })

  // Clonar topología para mutación
  const affectedTopology = topology.map(s => ({ ...s }))
  let totalRequests = 500
  let failedRequests = 0
  let circuitBreakerTripped = false
  let healedReplicas = 0

  switch (experimentId) {
    case 'LATENCY_SPIKE': {
      affectedTopology.forEach(s => {
        if (s.id === 'orders-service' || s.id === 'payment-service') {
          s.latencyMs += 2200
          s.status = 'DEGRADED'
          s.errorRate = withResilience ? 0.08 : 0.45
        }
      })
      failedRequests = withResilience ? 40 : 225
      if (withResilience) {
        circuitBreakerTripped = true
        auditLogs.push({
          timestamp: startTime + 300,
          event: 'CIRCUIT_BREAKER_OPEN',
          message: 'Circuit Breaker abrió el circuito para payment-service evitando saturación en cascada.'
        })
      }
      break
    }

    case 'NODE_TERMINATION': {
      affectedTopology.forEach(s => {
        if (s.id === 'orders-service') {
          const killed = Math.floor(s.replicas * 0.5)
          s.replicas -= killed
          s.status = 'DEGRADED'
          if (withResilience) {
            healedReplicas = killed
            s.replicas += killed
            s.status = 'HEALTHY'
            auditLogs.push({
              timestamp: startTime + 450,
              event: 'KUBELET_AUTO_HEAL',
              message: `Kubernetes Kubelet detectó fallo de liveness y auto-recuperó ${killed} réplicas en 450ms.`
            })
          }
        }
      })
      failedRequests = withResilience ? 15 : 180
      break
    }

    case 'PACKET_LOSS': {
      affectedTopology.forEach(s => {
        if (s.id === 'api-gateway' || s.id === 'orders-service') {
          s.errorRate = withResilience ? 0.05 : 0.42
          s.status = withResilience ? 'DEGRADED' : 'UNHEALTHY'
        }
      })
      failedRequests = withResilience ? 25 : 210
      if (withResilience) {
        auditLogs.push({
          timestamp: startTime + 200,
          event: 'RETRY_WITH_JITTER',
          message: 'Motor de Retry con Exponential Backoff y Jitter reintentó con éxito el 88% de los paquetes descartados.'
        })
      }
      break
    }

    case 'NETWORK_PARTITION': {
      affectedTopology.forEach(s => {
        if (s.region === 'eu-west-1') {
          s.status = withResilience ? 'FAILOVER_STANDBY' : 'ISOLATED'
          s.errorRate = withResilience ? 0.04 : 0.85
        }
      })
      failedRequests = withResilience ? 20 : 425
      if (withResilience) {
        auditLogs.push({
          timestamp: startTime + 500,
          event: 'GEO_FAILOVER_TRIGGERED',
          message: 'Tráfico desviado automáticamente a clúster redundante us-east-1 mediante Anycast Routing.'
        })
      }
      break
    }

    case 'RESOURCE_EXHAUSTION': {
      affectedTopology.forEach(s => {
        if (s.id === 'postgres-db') {
          s.status = withResilience ? 'RATE_LIMITED' : 'CRASHED'
          s.errorRate = withResilience ? 0.10 : 0.95
        }
      })
      failedRequests = withResilience ? 50 : 475
      if (withResilience) {
        auditLogs.push({
          timestamp: startTime + 350,
          event: 'BACKPRESSURE_ENGAGED',
          message: 'Backpressure y Outbox queue absorbieron el exceso de transacciones para no saturar PostgreSQL.'
        })
      }
      break
    }
  }

  const successRate = ((totalRequests - failedRequests) / totalRequests) * 100
  const blastRadiusPercent = (affectedTopology.filter(s => s.status !== 'HEALTHY').length / affectedTopology.length) * 100
  const mttrSeconds = withResilience ? (Math.random() * 1.2 + 0.4).toFixed(2) : '∞ (Intervención Manual Requerida)'

  auditLogs.push({
    timestamp: Date.now(),
    event: 'EXPERIMENT_COMPLETED',
    message: `Experimento concluido. Disponibilidad final: ${successRate.toFixed(1)}%. Radio de impacto: ${blastRadiusPercent.toFixed(0)}%. MTTR: ${mttrSeconds}s.`
  })

  return {
    experiment,
    withResilience,
    totalRequests,
    failedRequests,
    successRate,
    blastRadiusPercent,
    mttrSeconds,
    circuitBreakerTripped,
    healedReplicas,
    affectedTopology,
    auditLogs
  }
}
