/**
 * @fileoverview Simulador del Algoritmo de Consenso Distribuido Raft (Mejora 63).
 *
 * CARACTERÍSTICAS:
 * - Estados de nodo según la especificación Raft (Ongaro & Ousterhout):
 *     - FOLLOWER: Responde a RPCs de candidatos y líderes. Inicia elección si vence el timeout.
 *     - CANDIDATE: Solicita votos a los pares en un nuevo término (RequestVote RPC).
 *     - LEADER: Envía heartbeats periódicos (AppendEntries RPC) y coordina la replicación de logs.
 * - Quórum de mayoría simple (Strict Majority Quorum: floor(N/2) + 1).
 * - Replicación de máquina de estados con garantía de consistencia y commit index.
 * - Simulación de fallos de red: Particiones de red (Split-Brain), aislamiento de líder y cicatrización (Healing).
 *
 * @module utils/raftCluster
 */

export const NODE_ROLES = {
  FOLLOWER: 'FOLLOWER',
  CANDIDATE: 'CANDIDATE',
  LEADER: 'LEADER',
}

/**
 * Representa un nodo individual dentro del clúster Raft.
 */
export class RaftNode {
  /**
   * @param {string} id - Identificador del nodo (ej. 'N1')
   * @param {Array<string>} peerIds - IDs de los demás nodos del clúster
   */
  constructor(id, peerIds = []) {
    this.id = id
    this.peerIds = peerIds
    this.role = NODE_ROLES.FOLLOWER
    this.currentTerm = 0
    this.votedFor = null
    this.log = [] // Array<{ term: number, index: number, command: string, committed: boolean }>
    this.commitIndex = 0
    this.lastApplied = 0
    this.isAlive = true
    this.isolated = false
    this.votesReceived = new Set()
  }

  /**
   * Resetea el estado de elección del nodo.
   */
  resetElection() {
    this.votedFor = null
    this.votesReceived.clear()
  }
}

/**
 * Simulador de Clúster Raft distribuido en memoria.
 */
export class RaftClusterSimulator {
  /**
   * @param {Array<string>} [nodeIds=['N1', 'N2', 'N3', 'N4', 'N5']]
   */
  constructor(nodeIds = ['N1', 'N2', 'N3', 'N4', 'N5']) {
    this.nodeIds = nodeIds
    this.nodes = new Map()
    this.eventLogs = []
    this.networkPartitions = new Map() // nodeId -> partitionGroupId

    // Inicializar nodos
    nodeIds.forEach((id) => {
      const peers = nodeIds.filter((p) => p !== id)
      this.nodes.set(id, new RaftNode(id, peers))
      this.networkPartitions.set(id, 'MAIN')
    })
  }

  /**
   * Registra un evento en el log de auditoría del clúster.
   * @private
   */
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
   * Determina si dos nodos pueden comunicarse a través de la red (partición / desconexión).
   */
  canCommunicate(fromId, toId) {
    const fromNode = this.nodes.get(fromId)
    const toNode = this.nodes.get(toId)
    if (!fromNode || !toNode || !fromNode.isAlive || !toNode.isAlive) return false
    return this.networkPartitions.get(fromId) === this.networkPartitions.get(toId)
  }

  /**
   * Obtiene el líder actual reconocido en la partición principal o especificada.
   * @param {string} [partition='MAIN']
   * @returns {RaftNode|null}
   */
  getLeader(partition = 'MAIN') {
    for (const node of this.nodes.values()) {
      if (node.role === NODE_ROLES.LEADER && node.isAlive && this.networkPartitions.get(node.id) === partition) {
        return node
      }
    }
    return null
  }

  /**
   * Inicia un proceso de elección de líder para un nodo candidato.
   *
   * @param {string} candidateId - ID del nodo que inicia la campaña.
   * @returns {{ success: boolean, term: number, votes: number, quorumNeeded: number }}
   */
  startElection(candidateId) {
    const candidate = this.nodes.get(candidateId)
    if (!candidate || !candidate.isAlive) {
      throw new Error(`Nodo ${candidateId} no disponible para iniciar elección.`)
    }

    // Incrementar término y cambiar a CANDIDATE
    candidate.currentTerm++
    candidate.role = NODE_ROLES.CANDIDATE
    candidate.votedFor = candidate.id
    candidate.votesReceived.clear()
    candidate.votesReceived.add(candidate.id)

    this._log('ELECTION_START', candidate.id, 'CLUSTER', {
      term: candidate.currentTerm,
      reason: 'Election timeout agotado',
    })

    const partition = this.networkPartitions.get(candidate.id)
    const reachablePeers = this.nodeIds.filter((p) => p !== candidate.id && this.canCommunicate(candidate.id, p))
    const totalNodesInCluster = this.nodeIds.length
    const quorumNeeded = Math.floor(totalNodesInCluster / 2) + 1

    // Enviar RequestVote RPC a los pares alcanzables
    reachablePeers.forEach((peerId) => {
      const peer = this.nodes.get(peerId)
      const lastLog = candidate.log[candidate.log.length - 1] || { term: 0, index: 0 }
      const peerLastLog = peer.log[peer.log.length - 1] || { term: 0, index: 0 }

      // Reglas de votación Raft
      const canVote =
        (peer.votedFor === null || peer.votedFor === candidate.id) &&
        (peer.currentTerm <= candidate.currentTerm) &&
        (lastLog.term > peerLastLog.term || (lastLog.term === peerLastLog.term && lastLog.index >= peerLastLog.index))

      if (canVote) {
        peer.currentTerm = candidate.currentTerm
        peer.votedFor = candidate.id
        peer.role = NODE_ROLES.FOLLOWER
        candidate.votesReceived.add(peer.id)
        this._log('REQUEST_VOTE_GRANTED', peer.id, candidate.id, { term: candidate.currentTerm })
      } else {
        this._log('REQUEST_VOTE_DENIED', peer.id, candidate.id, {
          peerTerm: peer.currentTerm,
          peerVotedFor: peer.votedFor,
        })
      }
    })

    const votesCount = candidate.votesReceived.size
    const wonElection = votesCount >= quorumNeeded

    if (wonElection) {
      // Degradar cualquier otro líder en su misma partición
      this.nodes.forEach((n) => {
        if (n.id !== candidate.id && this.canCommunicate(candidate.id, n.id) && n.role === NODE_ROLES.LEADER) {
          n.role = NODE_ROLES.FOLLOWER
        }
      })

      candidate.role = NODE_ROLES.LEADER
      this._log('LEADER_ELECTED', candidate.id, 'CLUSTER', {
        term: candidate.currentTerm,
        votes: votesCount,
        quorum: quorumNeeded,
      })

      // Enviar heartbeats iniciales
      this.sendHeartbeat(candidate.id)
    } else {
      candidate.role = NODE_ROLES.FOLLOWER
      this._log('ELECTION_FAILED', candidate.id, 'CLUSTER', {
        votes: votesCount,
        quorumNeeded,
      })
    }

    return {
      success: wonElection,
      term: candidate.currentTerm,
      votes: votesCount,
      quorumNeeded,
    }
  }

  /**
   * Envía un heartbeat (AppendEntries vacío) desde el líder a todos los seguidores.
   *
   * @param {string} leaderId
   * @returns {{ acknowledgedBy: string[] }}
   */
  sendHeartbeat(leaderId) {
    const leader = this.nodes.get(leaderId)
    if (!leader || leader.role !== NODE_ROLES.LEADER) return { acknowledgedBy: [] }

    const acknowledgedBy = []

    this.nodeIds.forEach((peerId) => {
      if (peerId === leader.id) return
      if (this.canCommunicate(leader.id, peerId)) {
        const peer = this.nodes.get(peerId)
        if (peer.currentTerm < leader.currentTerm) {
          peer.currentTerm = leader.currentTerm
          peer.role = NODE_ROLES.FOLLOWER
          peer.votedFor = null
        }
        peer.commitIndex = Math.min(leader.commitIndex, peer.log.length)
        acknowledgedBy.push(peer.id)
      }
    })

    this._log('HEARTBEAT', leader.id, 'FOLLOWERS', {
      term: leader.currentTerm,
      peersReached: acknowledgedBy,
    })

    return { acknowledgedBy }
  }

  /**
   * Propone una operación o comando al clúster a través del líder.
   *
   * @param {string} command - Comando o transacción (ej. 'SET user:12="Alex"')
   * @returns {{ success: boolean, commitIndex: number, replicatedNodes: string[], error?: string }}
   */
  proposeCommand(command) {
    let leader = null
    for (const node of this.nodes.values()) {
      if (node.role === NODE_ROLES.LEADER && node.isAlive) {
        leader = node
        break
      }
    }

    if (!leader) {
      this._log('CLIENT_REQUEST_DROPPED', 'CLIENT', 'NONE', { error: 'No hay líder disponible' })
      return { success: false, commitIndex: 0, replicatedNodes: [], error: 'No hay líder en el clúster.' }
    }

    const newIndex = leader.log.length + 1
    const entry = {
      term: leader.currentTerm,
      index: newIndex,
      command,
      committed: false,
    }

    leader.log.push(entry)
    this._log('LOG_APPEND_LEADER', 'CLIENT', leader.id, { command, index: newIndex, term: leader.currentTerm })

    const quorumNeeded = Math.floor(this.nodeIds.length / 2) + 1
    const replicatedNodes = [leader.id]

    // Replicar a seguidores alcanzables (AppendEntries RPC)
    this.nodeIds.forEach((peerId) => {
      if (peerId === leader.id) return
      if (this.canCommunicate(leader.id, peerId)) {
        const peer = this.nodes.get(peerId)
        // Sincronizar log
        peer.log = [...leader.log.map((l) => ({ ...l }))]
        replicatedNodes.push(peer.id)
        this._log('APPEND_ENTRIES_SUCCESS', leader.id, peer.id, { index: newIndex })
      }
    })

    const hasQuorum = replicatedNodes.length >= quorumNeeded

    if (hasQuorum) {
      leader.commitIndex = newIndex
      leader.log.forEach((item) => {
        if (item.index <= newIndex) item.committed = true
      })

      // Actualizar commitIndex en seguidores alcanzables
      replicatedNodes.forEach((peerId) => {
        const node = this.nodes.get(peerId)
        node.commitIndex = newIndex
        node.log.forEach((item) => {
          if (item.index <= newIndex) item.committed = true
        })
      })

      this._log('LOG_COMMITTED', leader.id, 'STATE_MACHINE', {
        command,
        commitIndex: newIndex,
        replicatedNodes,
      })

      return {
        success: true,
        commitIndex: newIndex,
        replicatedNodes,
      }
    }

    this._log('QUORUM_NOT_REACHED', leader.id, 'CLUSTER', {
      replicatedNodes,
      quorumNeeded,
      status: 'UNCOMMITTED',
    })

    return {
      success: false,
      commitIndex: leader.commitIndex,
      replicatedNodes,
      error: `Quórum insuficiente (${replicatedNodes.length}/${quorumNeeded}). El registro permanece pendiente.`,
    }
  }

  /**
   * Crea una partición de red dividiendo el clúster en dos grupos (Split-Brain simulation).
   *
   * @param {Array<string>} groupA - Nodos en la partición A
   * @param {Array<string>} groupB - Nodos en la partición B
   */
  createNetworkPartition(groupA, groupB) {
    groupA.forEach((id) => this.networkPartitions.set(id, 'PARTITION_A'))
    groupB.forEach((id) => this.networkPartitions.set(id, 'PARTITION_B'))

    this._log('NETWORK_SPLIT', 'NETWORK', 'CLUSTER', {
      groupA,
      groupB,
    })
  }

  /**
   * Cicatriza la partición de red reconciliando todos los nodos en la red principal.
   */
  healPartition() {
    this.nodeIds.forEach((id) => this.networkPartitions.set(id, 'MAIN'))

    // Buscar líder con mayor término y mayor commitIndex
    let bestLeader = null
    this.nodes.forEach((node) => {
      if (
        !bestLeader ||
        node.currentTerm > bestLeader.currentTerm ||
        (node.currentTerm === bestLeader.currentTerm && node.commitIndex > bestLeader.commitIndex)
      ) {
        bestLeader = node
      }
    })

    if (bestLeader) {
      // Reconciliar logs en todos los nodos
      this.nodes.forEach((node) => {
        if (node.id !== bestLeader.id) {
          node.currentTerm = bestLeader.currentTerm
          node.role = NODE_ROLES.FOLLOWER
          node.commitIndex = bestLeader.commitIndex
          // Reemplazar logs no committeados
          node.log = bestLeader.log.map((item) => ({ ...item }))
        }
      })
    }

    this._log('NETWORK_HEALED', 'NETWORK', 'CLUSTER', {
      reconciledLeader: bestLeader ? bestLeader.id : null,
    })
  }

  /**
   * Simula la caída o apagado de un nodo.
   * @param {string} nodeId
   */
  killNode(nodeId) {
    const node = this.nodes.get(nodeId)
    if (node) {
      node.isAlive = false
      node.role = NODE_ROLES.FOLLOWER
      this._log('NODE_CRASHED', nodeId, 'CLUSTER')
    }
  }

  /**
   * Revive un nodo previamente caído.
   * @param {string} nodeId
   */
  reviveNode(nodeId) {
    const node = this.nodes.get(nodeId)
    if (node) {
      node.isAlive = true
      node.role = NODE_ROLES.FOLLOWER
      node.resetElection()
      this._log('NODE_REVIVED', nodeId, 'CLUSTER')
    }
  }

  /**
   * Obtiene el estado snapshot actual del clúster para visualización en la UI.
   */
  getClusterState() {
    const list = []
    this.nodes.forEach((node) => {
      list.push({
        id: node.id,
        role: node.role,
        currentTerm: node.currentTerm,
        votedFor: node.votedFor,
        commitIndex: node.commitIndex,
        isAlive: node.isAlive,
        partition: this.networkPartitions.get(node.id),
        logCount: node.log.length,
        log: [...node.log],
      })
    })

    return {
      nodes: list,
      leader: this.getLeader()?.id || null,
      eventLogs: [...this.eventLogs],
    }
  }
}
