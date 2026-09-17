import { describe, it, expect } from 'vitest'
import {
  MESH_SERVICES,
  calculateMeshSLO,
  splitCanaryTraffic
} from './globalMeshEngine.js'

describe('globalMeshEngine — Service Mesh & mTLS Global Telemetry Matrix', () => {
  it('contiene la topología de microservicios con mTLS y protocolos modernos', () => {
    expect(MESH_SERVICES.length).toBeGreaterThanOrEqual(5)
    MESH_SERVICES.forEach(s => {
      expect(s.mtlsEnabled).toBe(true)
      expect(s.certExpiryDays).toBeGreaterThan(30)
      expect(s.rps).toBeGreaterThan(0)
      expect(s.p99LatencyMs).toBeLessThan(50)
    })
  })

  it('calcula la disponibilidad SLO global Four Nines (99.99%) y presupuesto de error', () => {
    const slo = calculateMeshSLO(MESH_SERVICES, 0.9999)

    expect(slo.totalRps).toBeGreaterThan(5000)
    expect(slo.currentAvailability).toBeGreaterThanOrEqual(99.9)
    expect(slo.allMtlsSecured).toBe(true)
    expect(slo.meshHealth).toBe('EXCELLENT')
  })

  it('calcula la división de tráfico ponderado para despliegues Canary', () => {
    const split = splitCanaryTraffic(15, 2000)

    expect(split.canaryRps).toBe(300)
    expect(split.baselineRps).toBe(1700)
    expect(split.baselineRps + split.canaryRps).toBe(2000)
  })
})
