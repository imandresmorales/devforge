/**
 * @fileoverview Componente UI para el Simulador de Consenso Distribuido Raft (Mejora 63).
 *
 * Muestra:
 * - Topología visual del clúster de 5 nodos con roles interactivos (Líder, Candidato, Seguidor).
 * - Control de partición de red Split-Brain (Grupo A vs Grupo B) y cicatrización en vivo.
 * - Replicación de logs de estado distribuido y commit index.
 * - Inyector de comandos cliente con verificación de quórum en tiempo real.
 *
 * @module components/ui/RaftSimulator/RaftSimulator
 */
import { useState, useEffect, useRef } from 'react'
import { RaftClusterSimulator, NODE_ROLES } from '../../../utils/raftCluster'
import './RaftSimulator.css'

export default function RaftSimulator() {
  const clusterRef = useRef(null)
  if (!clusterRef.current) {
    clusterRef.current = new RaftClusterSimulator(['N1', 'N2', 'N3', 'N4', 'N5'])
  }

  const [clusterState, setClusterState] = useState(() => clusterRef.current.getClusterState())
  const [commandInput, setCommandInput] = useState('SET user:alex="online"')
  const [isPartitioned, setIsPartitioned] = useState(false)
  const [lastActionResult, setLastActionResult] = useState(null)

  const refreshState = () => {
    setClusterState(clusterRef.current.getClusterState())
  }

  const handleStartElection = (nodeId) => {
    try {
      const res = clusterRef.current.startElection(nodeId)
      setLastActionResult({
        type: res.success ? 'success' : 'error',
        message: res.success
          ? `🏆 Nodo ${nodeId} ganó la elección para el Término ${res.term} con ${res.votes}/${res.quorumNeeded} votos de quórum.`
          : `❌ Nodo ${nodeId} no alcanzó quórum (${res.votes}/${res.quorumNeeded} votos). Elección fallida.`,
      })
    } catch (err) {
      setLastActionResult({ type: 'error', message: err.message })
    }
    refreshState()
  }

  const handleHeartbeat = (leaderId) => {
    const res = clusterRef.current.sendHeartbeat(leaderId)
    setLastActionResult({
      type: 'info',
      message: `💓 Heartbeat emitido por ${leaderId}. Respuestas recibidas de: ${res.acknowledgedBy.join(', ') || 'ninguno'}.`,
    })
    refreshState()
  }

  const handleProposeCommand = (e) => {
    e.preventDefault()
    if (!commandInput.trim()) return

    const res = clusterRef.current.proposeCommand(commandInput.trim())
    if (res.success) {
      setLastActionResult({
        type: 'success',
        message: `✅ Comando replicado y committeado en Index #${res.commitIndex} en los nodos: [${res.replicatedNodes.join(', ')}].`,
      })
    } else {
      setLastActionResult({
        type: 'error',
        message: `⚠️ ${res.error || 'Fallo al replicar comando en el clúster.'}`,
      })
    }
    refreshState()
  }

  const handleTogglePartition = () => {
    if (isPartitioned) {
      clusterRef.current.healPartition()
      setIsPartitioned(false)
      setLastActionResult({
        type: 'success',
        message: '🌐 Partición de red cicatrizada. Todos los nodos se reconciliaron con el término más alto.',
      })
    } else {
      clusterRef.current.createNetworkPartition(['N1', 'N2'], ['N3', 'N4', 'N5'])
      setIsPartitioned(true)
      setLastActionResult({
        type: 'warning',
        message: '⚡ Partición de red activa: [N1, N2] (Minoría) vs [N3, N4, N5] (Mayoría).',
      })
    }
    refreshState()
  }

  const handleToggleNodeAlive = (nodeId, isAlive) => {
    if (isAlive) {
      clusterRef.current.killNode(nodeId)
      setLastActionResult({ type: 'warning', message: `🔌 Nodo ${nodeId} desconectado / apagado.` })
    } else {
      clusterRef.current.reviveNode(nodeId)
      setLastActionResult({ type: 'info', message: `⚡ Nodo ${nodeId} reanudado en la red.` })
    }
    refreshState()
  }

  return (
    <section className="raft-simulator" aria-labelledby="raft-title">
      <div className="raft-simulator__header">
        <div>
          <span className="badge badge--brand">Consenso Distribuido</span>
          <h2 id="raft-title" className="raft-simulator__title">
            Simulador de Protocolo Raft (Leader Election & Log Replication)
          </h2>
          <p className="raft-simulator__desc">
            Visualiza el algoritmo de consenso estándar de la industria (etcd, Kubernetes, CockroachDB).
            Prueba elecciones con quórum mayoritario (3/5), replicación de logs y tolerancia a particiones Split-Brain.
          </p>
        </div>

        <div className="raft-simulator__top-actions">
          <button
            type="button"
            className={`btn-secondary ${isPartitioned ? 'btn-secondary--active' : ''}`}
            onClick={handleTogglePartition}
          >
            {isPartitioned ? '🩹 Cicatrizar Red (Heal)' : '⚡ Partición Split-Brain'}
          </button>
        </div>
      </div>

      {lastActionResult && (
        <div className={`raft-simulator__banner raft-simulator__banner--${lastActionResult.type}`}>
          {lastActionResult.message}
        </div>
      )}

      {/* ── Grid de Nodos del Clúster ── */}
      <div className="raft-nodes-grid">
        {clusterState.nodes.map((node) => {
          const isLeader = node.role === NODE_ROLES.LEADER
          const isCandidate = node.role === NODE_ROLES.CANDIDATE
          return (
            <div
              key={node.id}
              className={`raft-node-card ${!node.isAlive ? 'raft-node-card--dead' : ''} ${isLeader ? 'raft-node-card--leader' : isCandidate ? 'raft-node-card--candidate' : ''}`}
            >
              <div className="raft-node-card__header">
                <span className="raft-node-card__id">{node.id}</span>
                <span className={`raft-role-badge raft-role-badge--${node.role.toLowerCase()}`}>
                  {isLeader ? '👑 LÍDER' : isCandidate ? '🗳️ CANDIDATO' : '🛡️ FOLLOWER'}
                </span>
              </div>

              <div className="raft-node-card__meta">
                <div>
                  <span className="raft-node-meta-label">Término:</span>
                  <span className="raft-node-meta-value">T{node.currentTerm}</span>
                </div>
                <div>
                  <span className="raft-node-meta-label">Commit Index:</span>
                  <span className="raft-node-meta-value">#{node.commitIndex}</span>
                </div>
                <div>
                  <span className="raft-node-meta-label">Partición:</span>
                  <span className="raft-node-meta-value">{node.partition}</span>
                </div>
                <div>
                  <span className="raft-node-meta-label">Voto:</span>
                  <span className="raft-node-meta-value">{node.votedFor || '—'}</span>
                </div>
              </div>

              {/* Registro de Logs del Nodo */}
              <div className="raft-node-card__logs">
                <span className="raft-node-logs-title">Log de Entradas ({node.log.length})</span>
                {node.log.length === 0 ? (
                  <p className="raft-node-logs-empty">Sin entradas en el log</p>
                ) : (
                  <div className="raft-node-logs-list">
                    {node.log.map((entry) => (
                      <div
                        key={entry.index}
                        className={`raft-log-entry ${entry.committed ? 'raft-log-entry--committed' : 'raft-log-entry--uncommitted'}`}
                        title={`Término ${entry.term} | ${entry.committed ? 'Committed' : 'Uncommitted'}`}
                      >
                        <span className="raft-log-entry-idx">#{entry.index}</span>
                        <span className="raft-log-entry-cmd">{entry.command}</span>
                        <span className="raft-log-entry-badge">{entry.committed ? '✓' : '…'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="raft-node-card__actions">
                {node.isAlive ? (
                  <>
                    <button
                      type="button"
                      className="btn-xs btn-primary"
                      onClick={() => handleStartElection(node.id)}
                      disabled={isLeader}
                    >
                      🗳️ Elección
                    </button>
                    {isLeader && (
                      <button
                        type="button"
                        className="btn-xs btn-secondary"
                        onClick={() => handleHeartbeat(node.id)}
                      >
                        💓 Heartbeat
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-xs btn-danger"
                      onClick={() => handleToggleNodeAlive(node.id, true)}
                    >
                      🔌 Apagar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn-xs btn-success"
                    onClick={() => handleToggleNodeAlive(node.id, false)}
                  >
                    ⚡ Encender
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Panel de Inyección de Comandos Cliente ── */}
      <div className="raft-client-panel">
        <h3 className="raft-client-panel__title">Proponer Operación al Clúster (State Machine Replication)</h3>
        <form onSubmit={handleProposeCommand} className="raft-client-form">
          <input
            type="text"
            className="input raft-client-input"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder='Ej: SET order:102="PAID"'
          />
          <button type="submit" className="btn-primary">
            🚀 Enviar Comando
          </button>
        </form>
      </div>

      {/* ── Auditoría de Eventos RPC en Tiempo Real ── */}
      <div className="raft-events-panel">
        <h3 className="raft-events-panel__title">Registro de Mensajes RPC y Quórum en Vivo</h3>
        <div className="raft-events-list">
          {clusterState.eventLogs.slice(0, 10).map((log) => (
            <div key={log.id} className={`raft-event-row raft-event-row--${log.type.toLowerCase()}`}>
              <span className="raft-event-type">{log.type}</span>
              <span className="raft-event-route">
                {log.source} ➔ {log.target}
              </span>
              <span className="raft-event-details">{JSON.stringify(log.details)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
