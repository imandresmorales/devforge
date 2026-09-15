/**
 * @fileoverview Motor de Consenso PBFT (Practical Byzantine Fault Tolerance).
 *
 * Implementa el algoritmo de consenso bizantino propuesto por Castro & Liskov.
 * En un sistema distribuido con N nodos, se toleran hasta f nodos bizantinos (maliciosos o caídos)
 * siempre que N >= 3f + 1. El quórum necesario para preparar y confirmar un bloque es 2f + 1.
 *
 * Fases de PBFT:
 * 1. Pre-Prepare: El líder (Primary) recibe una petición y emite <PRE-PREPARE, v, n, d>.
 * 2. Prepare: Las réplicas validan el digest y difunden <PREPARE, v, n, d, i>.
 *    Un nodo entra en estado 'prepared' al recibir 2f mensajes válidos de prepare.
 * 3. Commit: Cada nodo preparado difunde <COMMIT, v, n, d, i>.
 *    Un nodo entra en estado 'committed' al recibir 2f + 1 mensajes válidos de commit.
 * 4. Reply: El estado se ejecuta localmente y se retorna el resultado al cliente.
 *
 * @module utils/pbftEngine
 */

/**
 * Calcula un digest hash SHA-256 simulado y determinista para los datos del bloque.
 * @param {string|object} data - Datos de la propuesta o transacción.
 * @returns {string} Hash hexadecimal de 64 caracteres.
 */
export function calculateDigest(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data)
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0')
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0')
  const part3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0')
  const part4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0')
  return `${part1}${part2}${part3}${part4}${part1}${part2}${part3}${part4}`
}

/**
 * Tipos de comportamiento de los nodos en la red.
 */
export const NODE_BEHAVIORS = {
  HONEST: 'honest',
  CRASH: 'crash',           // Nodo caído, no responde ni envía mensajes
  BYZANTINE: 'byzantine',   // Nodo malicioso que altera datos o vota digests falsos
  EQUIVOCATING: 'equivocating' // Envía votos contradictorios a distintos pares
}

/**
 * Calcula el número máximo de fallos tolerables para un tamaño de red N.
 * Fórmula PBFT: f = Math.floor((N - 1) / 3)
 * @param {number} totalNodes - Cantidad total de nodos.
 * @returns {number} Número de nodos bizantinos tolerables.
 */
export function calculateMaxFaultTolerance(totalNodes) {
  if (totalNodes < 4) return 0
  return Math.floor((totalNodes - 1) / 3)
}

/**
 * Calcula el tamaño de quórum requerido (2f + 1).
 * @param {number} totalNodes - Cantidad total de nodos.
 * @returns {number} Número mínimo de votos coincidentes requeridos.
 */
export function calculateQuorumSize(totalNodes) {
  const f = calculateMaxFaultTolerance(totalNodes)
  return (2 * f) + 1
}

/**
 * Crea una configuración de clúster PBFT.
 * @param {number} nodeCount - Total de nodos (recomendado >= 4).
 * @param {string[]} byzantineNodeIds - IDs de nodos configurados como bizantinos.
 * @param {string[]} crashNodeIds - IDs de nodos configurados como caídos.
 * @returns {object} Estado inicial del clúster.
 */
export function createPBFTCluster(nodeCount = 4, byzantineNodeIds = [], crashNodeIds = []) {
  const nodes = []
  for (let i = 0; i < nodeCount; i++) {
    const id = `node-${i}`
    let behavior = NODE_BEHAVIORS.HONEST
    if (byzantineNodeIds.includes(id)) {
      behavior = NODE_BEHAVIORS.BYZANTINE
    } else if (crashNodeIds.includes(id)) {
      behavior = NODE_BEHAVIORS.CRASH
    }

    nodes.push({
      id,
      index: i,
      isLeader: i === 0,
      behavior,
      state: 'IDLE',
      prepared: false,
      committed: false,
      executed: false,
      receivedPrePrepare: null,
      prepareVotes: [],
      commitVotes: []
    })
  }

  const maxFaulty = calculateMaxFaultTolerance(nodeCount)
  const quorum = calculateQuorumSize(nodeCount)

  return {
    view: 0,
    sequenceNumber: 1,
    nodes,
    primaryId: nodes[0].id,
    totalNodes: nodeCount,
    maxFaulty,
    quorum,
    canTolerateFaults: nodeCount >= 3 * maxFaulty + 1
  }
}

/**
 * Ejecuta una simulación completa paso a paso del consenso PBFT para una propuesta dada.
 * @param {object} cluster - Clúster generado por createPBFTCluster.
 * @param {object} proposal - Objeto con datos de la propuesta { txId, payload, timestamp }.
 * @returns {object} Bitácora detallada de todas las fases, mensajes y veredicto de consenso.
 */
export function runPBFTConsensus(cluster, proposal) {
  const { nodes, view, sequenceNumber, quorum, maxFaulty, totalNodes } = cluster
  const auditLog = []
  const expectedDigest = calculateDigest(proposal)

  auditLog.push({
    phase: 'PROPOSAL_RECEIVED',
    timestamp: Date.now(),
    message: `Petición de cliente recibida para sequence #${sequenceNumber}. Digest esperado: ${expectedDigest.slice(0, 16)}...`,
    details: { proposal, expectedDigest }
  })

  // 1. FASE PRE-PREPARE (El líder emite a todos)
  const leader = nodes.find(n => n.isLeader)
  const prePrepareMessages = []

  if (!leader || leader.behavior === NODE_BEHAVIORS.CRASH) {
    auditLog.push({
      phase: 'PRE_PREPARE_FAILED',
      timestamp: Date.now(),
      message: 'Fallo crítico: El nodo líder (Primary) está caído o no responde. Se requiere cambio de vista (View Change).',
      success: false
    })
    return {
      success: false,
      reason: 'LEADER_UNAVAILABLE',
      auditLog,
      clusterState: nodes
    }
  }

  const leaderDigest = leader.behavior === NODE_BEHAVIORS.BYZANTINE
    ? calculateDigest('MALICIOUS_FORGED_PAYLOAD_BY_LEADER')
    : expectedDigest

  for (const node of nodes) {
    const msg = {
      type: 'PRE_PREPARE',
      view,
      sequenceNumber,
      digest: leaderDigest,
      from: leader.id,
      to: node.id
    }
    prePrepareMessages.push(msg)
  }

  auditLog.push({
    phase: 'PRE_PREPARE',
    timestamp: Date.now(),
    message: `Líder ${leader.id} difunde PRE-PREPARE a ${nodes.length} nodos con digest ${leaderDigest.slice(0, 16)}...`,
    messages: prePrepareMessages
  })

  // 2. FASE PREPARE (Cada nodo replica su voto a todos los demás)
  const prepareBroadcasts = []

  for (const node of nodes) {
    if (node.behavior === NODE_BEHAVIORS.CRASH) {
      continue // No emite prepare
    }

    let votedDigest = leaderDigest
    if (node.behavior === NODE_BEHAVIORS.BYZANTINE) {
      // Vota digest alterado para sabotear quórum
      votedDigest = calculateDigest(`CORRUPTED_DIGEST_${node.id}`)
    }

    const prepareMsg = {
      type: 'PREPARE',
      view,
      sequenceNumber,
      digest: votedDigest,
      from: node.id
    }
    prepareBroadcasts.push(prepareMsg)
  }

  auditLog.push({
    phase: 'PREPARE',
    timestamp: Date.now(),
    message: `${prepareBroadcasts.length} nodos emitieron mensajes PREPARE en la red.`,
    messages: prepareBroadcasts
  })

  // Contar votos de prepare recibidos por cada nodo
  const preparedNodes = []
  for (const node of nodes) {
    if (node.behavior === NODE_BEHAVIORS.CRASH) continue

    // El nodo cuenta cuántos prepares válidos con su digest coinciden
    const matchingPrepares = prepareBroadcasts.filter(m => m.digest === expectedDigest)
    node.prepareVotes = matchingPrepares.map(m => m.from)

    // Un nodo está preparado si recibe al menos 2f votos válidos (incluyendo el suyo si es honesto)
    const requiredPrepareVotes = 2 * maxFaulty
    if (matchingPrepares.length >= requiredPrepareVotes && node.behavior === NODE_BEHAVIORS.HONEST) {
      node.prepared = true
      node.state = 'PREPARED'
      preparedNodes.push(node.id)
    }
  }

  auditLog.push({
    phase: 'PREPARE_VERIFICATION',
    timestamp: Date.now(),
    message: `${preparedNodes.length} de ${totalNodes} nodos alcanzaron estado PREPARED (quórum mínimo requerido: 2f = ${2 * maxFaulty} votos).`,
    preparedNodes
  })

  // 3. FASE COMMIT (Nodos preparados difunden COMMIT)
  const commitBroadcasts = []
  for (const node of nodes) {
    if (node.behavior === NODE_BEHAVIORS.CRASH) continue

    if (node.prepared) {
      commitBroadcasts.push({
        type: 'COMMIT',
        view,
        sequenceNumber,
        digest: expectedDigest,
        from: node.id
      })
    } else if (node.behavior === NODE_BEHAVIORS.BYZANTINE) {
      // Nodo bizantino envía commit espurio
      commitBroadcasts.push({
        type: 'COMMIT',
        view,
        sequenceNumber,
        digest: calculateDigest('FAKE_COMMIT_DIGEST'),
        from: node.id
      })
    }
  }

  auditLog.push({
    phase: 'COMMIT',
    timestamp: Date.now(),
    message: `${commitBroadcasts.length} mensajes COMMIT difundidos en la red.`,
    messages: commitBroadcasts
  })

  // 4. FASE COMMIT VERIFICATION Y EJECUCIÓN
  const committedNodes = []
  for (const node of nodes) {
    if (node.behavior === NODE_BEHAVIORS.CRASH) continue

    const matchingCommits = commitBroadcasts.filter(m => m.digest === expectedDigest)
    node.commitVotes = matchingCommits.map(m => m.from)

    // Necesita quórum 2f + 1 de commits legítimos
    if (matchingCommits.length >= quorum && node.behavior === NODE_BEHAVIORS.HONEST) {
      node.committed = true
      node.executed = true
      node.state = 'COMMITTED_AND_EXECUTED'
      committedNodes.push(node.id)
    }
  }

  const consensusReached = committedNodes.length >= quorum
  const activeFaultyCount = nodes.filter(n => n.behavior !== NODE_BEHAVIORS.HONEST).length

  auditLog.push({
    phase: 'CONSENSUS_RESULT',
    timestamp: Date.now(),
    message: consensusReached
      ? `✅ CONSEGUIDO: Consenso PBFT alcanzado con ${committedNodes.length} nodos comprometidos (Quórum ${quorum}/${totalNodes}). Ataque bizantino mitigado.`
      : `❌ RECHAZADO: Consenso fallido. Solo ${committedNodes.length} nodos alcanzaron quórum legítimo de ${quorum}. Demasiados fallos (${activeFaultyCount} > f_max ${maxFaulty}).`,
    consensusReached,
    committedNodes,
    quorum,
    activeFaultyCount,
    maxFaulty
  })

  return {
    success: consensusReached,
    consensusReached,
    view,
    sequenceNumber,
    expectedDigest,
    totalNodes,
    maxFaulty,
    quorum,
    committedNodes,
    auditLog,
    clusterState: nodes
  }
}
