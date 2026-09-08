/**
 * @fileoverview Simulador del Protocolo Gossip y Detección de Fallos P2P SWIM (Mejora 69).
 *
 * CARACTERÍSTICAS:
 * - Implementación del protocolo SWIM (Structured Weakly-Consistent Infection-Style Membership):
 *     - Estados de membresía de nodos: `ALIVE`, `SUSPECT`, `DEAD`.
 *     - Detección de fallos en dos fases:
 *         1. Ping Directo: Sonda periódica a un peer aleatorio.
 *         2. Ping Indirecto (Ping-Req): Si el ping directo falla, solicita a k peers intermediarios que sondeen al nodo.
 *     - Mecanismo de refutación con números de encarnación (Incarnation Numbers): Si un nodo es marcado falsamente como `SUSPECT`, emite una refutación `ALIVE` con un número de encarnación mayor.
 *     - Diseminación epidémica de rumores (Piggybacked Rumors) en $O(\log N)$ periodos.
 *
 * @module utils/gossipCluster
 */

export const MEMBER_STATES = {
  ALIVE: 'ALIVE',
  SUSPECT: 'SUSPECT',
  DEAD: 'DEAD',
}

/**
 * Nodo individual de la red Gossip P2P.
 */
export class GossipNode {
  /**
   * @param {string} id - Identificador del nodo (ej. 'N1')
   */
  constructor(id) {
    this.id = id
    this.state = MEMBER_STATES.ALIVE
    this.incarnation = 0
    this.isOnline = true // Conectividad física simulada
    this.membershipTable = new Map() // nodeId -> { id, state, incarnation, lastUpdated }
    this.rumorBuffer = [] // Array<{ type: string, targetId: string, incarnation: number, timestamp: number }>
  }

  /**
   * Inicializa o actualiza un registro en la tabla de membresía del nodo.
   */
  updateMember(memberId, state, incarnation) {
    const current = this.membershipTable.get(memberId)
    if (!current) {
      this.membershipTable.set(memberId, {
        id: memberId,
        state,
        incarnation,
        lastUpdated: Date.now(),
      })
      return true
    }

    // Reglas de precedencia de estados SWIM
    if (incarnation > current.incarnation) {
      current.state = state
      current.incarnation = incarnation
      current.lastUpdated = Date.now()
      return true
    }

      if (current.state === MEMBER_STATES.ALIVE && state === MEMBER_STATES.SUSPECT) {
        current.state = MEMBER_STATES.SUSPECT
        current.lastUpdated = Date.now()
        return true
      }
      if (state === MEMBER_STATES.DEAD) {
        current.state = MEMBER_STATES.DEAD
        current.lastUpdated = Date.now()
        return true
      }
    }

    return false
  }
}

/**
 * Simulador de Clúster de Red Peer-to-Peer Gossip.
 */
export class GossipClusterSimulator {
  /**
   * @param {Array<string>} [nodeIds=['N1', 'N2', 'N3', 'N4', 'N5', 'N6']]
   * @param {Object} [options]
   * @param {number} [options.indirectPingK=2] - Número de nodos intermedios para Ping-Req
   */
  constructor(nodeIds = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6'], options = {}) {
    this.nodeIds = nodeIds
    this.nodes = new Map()
    this.indirectPingK = options.indirectPingK || 2
    this.eventLogs = []

    // Inicializar nodos y poblar sus tablas de membresía
    nodeIds.forEach((id) => {
      const node = new GossipNode(id)
      this.nodes.set(id, node)
    })

    // Cada nodo conoce inicialmente a todos los demás como ALIVE en encarnación 0
    this.nodes.forEach((node) => {
      this.nodeIds.forEach((peerId) => {
        node.updateMember(peerId, MEMBER_STATES.ALIVE, 0)
      })
    })
  }

  _log(type, source, target, details = {}) {
    const event = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      type,
      source,
      target,
      details,
    }
    this.eventLogs.unshift(event)
    if (this.eventLogs.length > 80) this.eventLogs.pop()
  }

  /**
   * Comprueba si dos nodos pueden comunicarse directamente en la red física.
   */
  canReach(fromId, toId) {
    const fromNode = this.nodes.get(fromId)
    const toNode = this.nodes.get(toId)
    return Boolean(fromNode && toNode && fromNode.isOnline && toNode.isOnline)
  }

  /**
   * Ejecuta un ciclo de protocolo (Protocol Period / Tick) para un nodo o para todo el clúster.
   *
   * @param {string} [nodeId] - Si se especifica, solo ejecuta el tick para este nodo.
   * @returns {Array<Object>} Lista de eventos ocurridos durante el periodo.
   */
  stepProtocol(nodeId = null) {
    const activeNodes = nodeId
      ? [this.nodes.get(nodeId)].filter(Boolean)
      : Array.from(this.nodes.values()).filter((n) => n.isOnline)

    const stepEvents = []

    activeNodes.forEach((node) => {
      const peers = this.nodeIds.filter((p) => p !== node.id)
      if (peers.length === 0) return

      // 1. Seleccionar un peer aleatorio para Ping directo
      const targetId = peers[Math.floor(Math.random() * peers.length)]
      const targetNode = this.nodes.get(targetId)

      // 2. Intentar Ping Directo
      const directSuccess = this.canReach(node.id, targetId)
      if (directSuccess) {
        this._log('DIRECT_PING_ACK', node.id, targetId, { result: 'ALIVE' })
        node.updateMember(targetId, MEMBER_STATES.ALIVE, targetNode.incarnation)
        this._disseminateRumors(node, targetNode)
        stepEvents.push({ type: 'DIRECT_PING_ACK', from: node.id, target: targetId })
        return
      }

      // 3. Ping Directo Falló: Intentar Ping Indirecto (Ping-Req a través de k intermediarios)
      this._log('DIRECT_PING_TIMEOUT', node.id, targetId, { reason: 'No respondio al ping directo' })
      const helpers = peers.filter((p) => p !== targetId && this.canReach(node.id, p)).slice(0, this.indirectPingK)

      let indirectSuccess = false
      helpers.forEach((helperId) => {
        if (this.canReach(helperId, targetId)) {
          indirectSuccess = true
          this._log('INDIRECT_PING_ACK', helperId, targetId, { relayedTo: node.id })
        }
      })

      if (indirectSuccess) {
        node.updateMember(targetId, MEMBER_STATES.ALIVE, targetNode.incarnation)
        stepEvents.push({ type: 'INDIRECT_PING_SUCCESS', from: node.id, target: targetId })
      } else {
        // 4. Ping Indirecto Falló: Marcar nodo como SUSPECT y difundir rumor
        const currentMember = node.membershipTable.get(targetId)
        const targetIncarnation = currentMember ? currentMember.incarnation : 0

        const stateChanged = node.updateMember(targetId, MEMBER_STATES.SUSPECT, targetIncarnation)
        if (stateChanged) {
          node.rumorBuffer.push({
            type: MEMBER_STATES.SUSPECT,
            targetId,
            incarnation: targetIncarnation,
            timestamp: Date.now(),
          })
          this._log('MEMBER_SUSPECT', node.id, targetId, { incarnation: targetIncarnation })
          stepEvents.push({ type: 'MEMBER_SUSPECT', from: node.id, target: targetId })
        }
      }
    })

    return stepEvents
  }

  /**
   * Intercambio epidémico de rumores entre dos nodos alcanzables (Piggybacking).
   * @private
   */
  _disseminateRumors(nodeA, nodeB) {
    if (!nodeA || !nodeB) return

    // Propagar rumores de A a B
    nodeA.rumorBuffer.forEach((rumor) => {
      nodeB.updateMember(rumor.targetId, rumor.type, rumor.incarnation)
    })

    // Propagar rumores de B a A
    nodeB.rumorBuffer.forEach((rumor) => {
      nodeA.updateMember(rumor.targetId, rumor.type, rumor.incarnation)
    })
  }

  /**
   * Un nodo sospechoso refuta su estado incrementando su encarnación y proclamándose ALIVE.
   *
   * @param {string} nodeId
   * @returns {boolean}
   */
  refuteSuspicion(nodeId) {
    const node = this.nodes.get(nodeId)
    if (!node || !node.isOnline) return false

    node.incarnation++
    node.state = MEMBER_STATES.ALIVE
    node.updateMember(node.id, MEMBER_STATES.ALIVE, node.incarnation)

    // Difundir rumor de refutación
    node.rumorBuffer.push({
      type: MEMBER_STATES.ALIVE,
      targetId: node.id,
      incarnation: node.incarnation,
      timestamp: Date.now(),
    })

    this._log('SUSPICION_REFUTED', node.id, 'CLUSTER', {
      newIncarnation: node.incarnation,
      state: MEMBER_STATES.ALIVE,
    })

    // Propagar a todos los pares alcanzables de inmediato
    this.nodeIds.forEach((peerId) => {
      if (peerId !== node.id && this.canReach(node.id, peerId)) {
        const peer = this.nodes.get(peerId)
        peer.updateMember(node.id, MEMBER_STATES.ALIVE, node.incarnation)
      }
    })

    return true
  }

  /**
   * Declara permanentemente a un nodo como DEAD si expira el periodo de sospecha sin refutación.
   *
   * @param {string} targetId
   */
  declareDead(targetId) {
    this.nodes.forEach((node) => {
      const current = node.membershipTable.get(targetId)
      if (current && current.state !== MEMBER_STATES.DEAD) {
        node.updateMember(targetId, MEMBER_STATES.DEAD, current.incarnation)
      }
    })

    const target = this.nodes.get(targetId)
    if (target) {
      target.state = MEMBER_STATES.DEAD
      target.isOnline = false
    }

    this._log('MEMBER_DEAD', 'CLUSTER', targetId, { reason: 'Suspicion timer expired without refutation' })
  }

  /**
   * Simula la desconexión física de un nodo de la red.
   * @param {string} nodeId
   */
  isolateNode(nodeId) {
    const node = this.nodes.get(nodeId)
    if (node) {
      node.isOnline = false
      this._log('NODE_DISCONNECTED', nodeId, 'NETWORK')
    }
  }

  /**
   * Reconecta un nodo a la red.
   * @param {string} nodeId
   */
  reconnectNode(nodeId) {
    const node = this.nodes.get(nodeId)
    if (node) {
      node.isOnline = true
      node.state = MEMBER_STATES.ALIVE
      this.refuteSuspicion(nodeId)
      this._log('NODE_RECONNECTED', nodeId, 'NETWORK')
    }
  }

  /**
   * Retorna una instantánea del estado actual del clúster para visualización en la UI.
   */
  getSnapshot() {
    const list = []
    this.nodes.forEach((node) => {
      const members = []
      node.membershipTable.forEach((m) => {
        members.push({ ...m })
      })

      list.push({
        id: node.id,
        state: node.state,
        incarnation: node.incarnation,
        isOnline: node.isOnline,
        membersCount: members.length,
        members,
        rumorsCount: node.rumorBuffer.length,
      })
    })

    return {
      nodes: list,
      eventLogs: [...this.eventLogs],
    }
  }
}
