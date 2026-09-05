/**
 * @fileoverview Tests unitarios para el simulador de consenso distribuido Raft (Mejora 63).
 * @module utils/raftCluster.test
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { RaftClusterSimulator, NODE_ROLES } from './raftCluster'

describe('Simulador de Consenso Distribuido Raft (raftCluster.js)', () => {
  let cluster

  beforeEach(() => {
    cluster = new RaftClusterSimulator(['N1', 'N2', 'N3', 'N4', 'N5'])
  })

  it('inicializa los nodos en rol FOLLOWER con término 0 y sin líder', () => {
    const state = cluster.getClusterState()
    expect(state.nodes.length).toBe(5)
    state.nodes.forEach((node) => {
      expect(node.role).toBe(NODE_ROLES.FOLLOWER)
      expect(node.currentTerm).toBe(0)
      expect(node.commitIndex).toBe(0)
      expect(node.isAlive).toBe(true)
    })
    expect(state.leader).toBeNull()
  })

  it('permite a un nodo ganar una elección con quórum mayoritario (3/5)', () => {
    const election = cluster.startElection('N1')
    expect(election.success).toBe(true)
    expect(election.votes).toBe(5)
    expect(election.quorumNeeded).toBe(3)
    expect(election.term).toBe(1)

    const leaderNode = cluster.nodes.get('N1')
    expect(leaderNode.role).toBe(NODE_ROLES.LEADER)
    expect(leaderNode.currentTerm).toBe(1)

    // Los demás deben ser followers en el mismo término
    const otherNodes = ['N2', 'N3', 'N4', 'N5'].map((id) => cluster.nodes.get(id))
    otherNodes.forEach((node) => {
      expect(node.role).toBe(NODE_ROLES.FOLLOWER)
      expect(node.currentTerm).toBe(1)
    })
  })

  it('replica logs y actualiza el commitIndex al alcanzar quórum', () => {
    cluster.startElection('N1')

    const result = cluster.proposeCommand('SET counter=10')
    expect(result.success).toBe(true)
    expect(result.commitIndex).toBe(1)
    expect(result.replicatedNodes.length).toBe(5)

    const state = cluster.getClusterState()
    state.nodes.forEach((node) => {
      expect(node.commitIndex).toBe(1)
      expect(node.log.length).toBe(1)
      expect(node.log[0].command).toBe('SET counter=10')
      expect(node.log[0].committed).toBe(true)
    })
  })

  it('bloquea commits en minoría ante partición de red (Split-Brain) y los permite en mayoría', () => {
    cluster.startElection('N1')
    // Partición: N1, N2 (minoría: 2) vs N3, N4, N5 (mayoría: 3)
    cluster.createNetworkPartition(['N1', 'N2'], ['N3', 'N4', 'N5'])

    // Intento de comando en la partición minoritaria liderada por N1
    const minorResult = cluster.proposeCommand('SET key="fail"')
    expect(minorResult.success).toBe(false)
    expect(minorResult.error).toContain('Quórum insuficiente')

    // N3 inicia elección en la partición mayoritaria
    const majorElection = cluster.startElection('N3')
    expect(majorElection.success).toBe(true)
    expect(majorElection.votes).toBe(3)
    expect(cluster.nodes.get('N3').role).toBe(NODE_ROLES.LEADER)

    // Propuesta en la mayoría
    const majorResult = cluster.proposeCommand('SET key="majority_ok"')
    expect(majorResult.success).toBe(true)
    expect(cluster.nodes.get('N3').commitIndex).toBeGreaterThanOrEqual(1)
  })

  it('cicatriza particiones de red y reconcilia el clúster con el líder dominante', () => {
    cluster.startElection('N1')
    cluster.createNetworkPartition(['N1', 'N2'], ['N3', 'N4', 'N5'])

    cluster.startElection('N3') // Mayor término
    cluster.proposeCommand('SET balance=5000')

    // Cicatrizar red
    cluster.healPartition()

    const state = cluster.getClusterState()
    expect(cluster.networkPartitions.get('N1')).toBe('MAIN')
    expect(cluster.networkPartitions.get('N5')).toBe('MAIN')
    expect(state.nodes.every((n) => n.currentTerm >= 2)).toBe(true)
  })

  it('maneja fallos de nodo (kill/revive) correctamente', () => {
    cluster.killNode('N5')
    expect(cluster.nodes.get('N5').isAlive).toBe(false)

    // Aún con N5 caído, 4 nodos son suficientes para quórum (4 >= 3)
    const election = cluster.startElection('N2')
    expect(election.success).toBe(true)
    expect(election.votes).toBe(4)

    cluster.reviveNode('N5')
    expect(cluster.nodes.get('N5').isAlive).toBe(true)
  })
})
