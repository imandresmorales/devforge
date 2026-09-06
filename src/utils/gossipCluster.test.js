/**
 * @fileoverview Tests unitarios para el Simulador de Protocolo Gossip / SWIM (Mejora 69).
 * @module utils/gossipCluster.test
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  GossipClusterSimulator,
  MEMBER_STATES,
} from './gossipCluster'

describe('Protocolo Gossip y Detección de Fallos SWIM (gossipCluster.js)', () => {
  let cluster

  beforeEach(() => {
    cluster = new GossipClusterSimulator(['N1', 'N2', 'N3', 'N4', 'N5', 'N6'])
  })

  it('inicializa todos los nodos en estado ALIVE con encarnación 0', () => {
    const snapshot = cluster.getSnapshot()
    expect(snapshot.nodes.length).toBe(6)
    snapshot.nodes.forEach((node) => {
      expect(node.state).toBe(MEMBER_STATES.ALIVE)
      expect(node.incarnation).toBe(0)
      expect(node.isOnline).toBe(true)
    })
  })

  it('mantiene nodos en ALIVE tras ejecuciones exitosas de ping directo', () => {
    const events = cluster.stepProtocol('N1')
    expect(events.length).toBeGreaterThan(0)
    expect(events[0].type).toBe('DIRECT_PING_ACK')
  })

  it('marca un nodo como SUSPECT cuando el ping directo e indirecto fallan (desconexión)', () => {
    // Desconectar N6
    cluster.isolateNode('N6')
    expect(cluster.canReach('N1', 'N6')).toBe(false)

    // Ejecutar varios pasos de protocolo hasta que N6 sea detectado como SUSPECT
    for (let i = 0; i < 10; i++) {
      cluster.stepProtocol()
    }

    const n1 = cluster.nodes.get('N1')
    const n6StatusInN1 = n1.membershipTable.get('N6')
    expect(n6StatusInN1.state).toBe(MEMBER_STATES.SUSPECT)
  })

  it('permite a un nodo sospechoso refutar el estado incrementando su encarnación', () => {
    cluster.isolateNode('N2')
    for (let i = 0; i < 6; i++) {
      cluster.stepProtocol()
    }

    // Reconectar N2 y refutar
    cluster.reconnectNode('N2')
    const n2 = cluster.nodes.get('N2')
    expect(n2.incarnation).toBeGreaterThan(0)
    expect(n2.state).toBe(MEMBER_STATES.ALIVE)

    // Los demás nodos deben ver a N2 como ALIVE con mayor encarnación
    const n1 = cluster.nodes.get('N1')
    expect(n1.membershipTable.get('N2').state).toBe(MEMBER_STATES.ALIVE)
  })

  it('declara a un nodo como DEAD y propaga el estado en el clúster', () => {
    cluster.declareDead('N4')
    const n4 = cluster.nodes.get('N4')
    expect(n4.state).toBe(MEMBER_STATES.DEAD)
    expect(n4.isOnline).toBe(false)

    const snapshot = cluster.getSnapshot()
    snapshot.nodes.forEach((node) => {
      const n4Record = node.membershipTable.get('N4')
      expect(n4Record.state).toBe(MEMBER_STATES.DEAD)
    })
  })
})
