import { describe, it, expect } from 'vitest'
import {
  calculateDigest,
  calculateMaxFaultTolerance,
  calculateQuorumSize,
  createPBFTCluster,
  runPBFTConsensus,
  NODE_BEHAVIORS
} from './pbftEngine.js'

describe('pbftEngine — Practical Byzantine Fault Tolerance Simulator', () => {
  it('calcula correctamente la tolerancia a fallos f y el quórum 2f+1 bajo fórmula 3f+1', () => {
    // Para N = 4: f = 1, Quórum = 2(1) + 1 = 3
    expect(calculateMaxFaultTolerance(4)).toBe(1)
    expect(calculateQuorumSize(4)).toBe(3)

    // Para N = 7: f = 2, Quórum = 2(2) + 1 = 5
    expect(calculateMaxFaultTolerance(7)).toBe(2)
    expect(calculateQuorumSize(7)).toBe(5)

    // Para N = 10: f = 3, Quórum = 2(3) + 1 = 7
    expect(calculateMaxFaultTolerance(10)).toBe(3)
    expect(calculateQuorumSize(10)).toBe(7)
  })

  it('genera digests criptográficos consistentes para la misma propuesta', () => {
    const proposal1 = { txId: 'tx-001', amount: 500, recipient: 'Alice' }
    const proposal2 = { txId: 'tx-001', amount: 500, recipient: 'Alice' }
    const proposal3 = { txId: 'tx-002', amount: 999, recipient: 'Eve' }

    const digest1 = calculateDigest(proposal1)
    const digest2 = calculateDigest(proposal2)
    const digest3 = calculateDigest(proposal3)

    expect(digest1).toHaveLength(64)
    expect(digest1).toBe(digest2)
    expect(digest1).not.toBe(digest3)
  })

  it('alcanza consenso exitoso en un clúster de 4 nodos con 1 nodo bizantino (f = 1)', () => {
    // 4 nodos: node-0 (Líder honesto), node-1 (honesto), node-2 (honesto), node-3 (bizantino)
    const cluster = createPBFTCluster(4, ['node-3'], [])
    const proposal = { txId: 'tx-100', payload: 'Transfer 50 USDC' }

    const result = runPBFTConsensus(cluster, proposal)

    expect(result.success).toBe(true)
    expect(result.consensusReached).toBe(true)
    expect(result.committedNodes.length).toBeGreaterThanOrEqual(result.quorum)
    expect(result.committedNodes).toContain('node-0')
    expect(result.committedNodes).toContain('node-1')
    expect(result.committedNodes).toContain('node-2')
    expect(result.committedNodes).not.toContain('node-3') // Nodo bizantino no hace commit válido
  })

  it('falla el consenso si los nodos bizantinos/caídos exceden f_max', () => {
    // 4 nodos con 2 nodos bizantinos/caídos (f_max = 1, pero hay 2 fallos => solo 2 honestos < quórum 3)
    const cluster = createPBFTCluster(4, ['node-2', 'node-3'], [])
    const proposal = { txId: 'tx-101', payload: 'Transfer 100 USDC' }

    const result = runPBFTConsensus(cluster, proposal)

    expect(result.success).toBe(false)
    expect(result.consensusReached).toBe(false)
    expect(result.committedNodes.length).toBeLessThan(result.quorum)
  })

  it('detecta y rechaza la propuesta si el líder emite un pre-prepare malicioso', () => {
    // node-0 es líder y está configurado como bizantino
    const cluster = createPBFTCluster(4, ['node-0'], [])
    const proposal = { txId: 'tx-102', payload: 'Valid User Transaction' }

    const result = runPBFTConsensus(cluster, proposal)

    // Los nodos honestos esperan el digest de la propuesta real y rechazan el pre-prepare forjado del líder
    expect(result.success).toBe(false)
    expect(result.committedNodes.length).toBe(0)
  })
})
