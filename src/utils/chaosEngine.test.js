import { describe, it, expect } from 'vitest'
import {
  CHAOS_EXPERIMENTS,
  createChaosTopology,
  runChaosExperiment
} from './chaosEngine.js'

describe('chaosEngine — Chaos Engineering & Distributed Resilience Simulator', () => {
  it('inicializa una topología de microservicios con métricas base saludables', () => {
    const topology = createChaosTopology()
    expect(topology).toHaveLength(5)
    topology.forEach(service => {
      expect(service.status).toBe('HEALTHY')
      expect(service.errorRate).toBeLessThan(0.05)
      expect(service.replicas).toBeGreaterThanOrEqual(2)
    })
  })

  it('ejecuta experimento de Latency Spike mitigando con Circuit Breaker', () => {
    const topology = createChaosTopology()
    const result = runChaosExperiment('LATENCY_SPIKE', topology, { withResilience: true })

    expect(result.experiment.id).toBe('LATENCY_SPIKE')
    expect(result.circuitBreakerTripped).toBe(true)
    expect(result.successRate).toBeGreaterThan(90)
    expect(result.auditLogs.some(l => l.event === 'CIRCUIT_BREAKER_OPEN')).toBe(true)
  })

  it('ejecuta experimento de Node Termination validando Auto-Healing de Kubernetes', () => {
    const topology = createChaosTopology()
    const result = runChaosExperiment('NODE_TERMINATION', topology, { withResilience: true })

    expect(result.healedReplicas).toBeGreaterThan(0)
    expect(result.successRate).toBeGreaterThan(95)
    expect(result.auditLogs.some(l => l.event === 'KUBELET_AUTO_HEAL')).toBe(true)
  })

  it('demuestra degradación severa si los mecanismos de resiliencia están desactivados', () => {
    const topology = createChaosTopology()
    const result = runChaosExperiment('NETWORK_PARTITION', topology, { withResilience: false })

    expect(result.withResilience).toBe(false)
    expect(result.successRate).toBeLessThan(30)
    expect(result.failedRequests).toBeGreaterThan(400)
    expect(result.mttrSeconds).toContain('∞')
  })

  it('lanza error si se especifica un experimento no soportado', () => {
    const topology = createChaosTopology()
    expect(() => runChaosExperiment('UNKNOWN_ATTACK', topology)).toThrow()
  })
})
