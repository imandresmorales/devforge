/**
 * @fileoverview Componente UI para el Simulador de Protocolo Gossip / SWIM (Mejora 69).
 *
 * Muestra:
 * - Grafo de red P2P interactivo con 6 nodos distribuidos (N1, N2, N3, N4, N5, N6).
 * - Estados de membresía en tiempo real con colores dinámicos: ALIVE (Verde), SUSPECT (Amarillo), DEAD (Rojo).
 * - Simulación de fallos de nodo (aislamiento de red) y detección por Ping Directo / Indirecto (Ping-Req).
 * - Mecanismo de refutación con números de encarnación (Incarnation Counter).
 * - Registro de eventos de protocolo Gossip y diseminación epidémica de rumores.
 *
 * @module components/ui/GossipSimulator/GossipSimulator
 */
import { useState, useRef, useEffect } from 'react'
import {
  GossipClusterSimulator,
  MEMBER_STATES,
} from '../../../utils/gossipCluster'
import './GossipSimulator.css'

export default function GossipSimulator() {
  const clusterRef = useRef(null)
  if (!clusterRef.current) {
    clusterRef.current = new GossipClusterSimulator(['N1', 'N2', 'N3', 'N4', 'N5', 'N6'])
  }

  const [snapshot, setSnapshot] = useState(() => clusterRef.current.getSnapshot())
  const [selectedNodeId, setSelectedNodeId] = useState('N1')
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [lastStepEvents, setLastStepEvents] = useState([])

  const refreshState = (events = []) => {
    setSnapshot(clusterRef.current.getSnapshot())
    if (events.length > 0) {
      setLastStepEvents(events)
    }
  }

  const handleStep = () => {
    const events = clusterRef.current.stepProtocol()
    refreshState(events)
  }

  const handleToggleOnline = (nodeId, isOnline) => {
    if (isOnline) {
      clusterRef.current.isolateNode(nodeId)
    } else {
      clusterRef.current.reconnectNode(nodeId)
    }
    refreshState()
  }

  const handleRefute = (nodeId) => {
    clusterRef.current.refuteSuspicion(nodeId)
    refreshState()
  }

  const handleDeclareDead = (nodeId) => {
    clusterRef.current.declareDead(nodeId)
    refreshState()
  }

  // Auto-run interval
  useEffect(() => {
    let interval = null
    if (isAutoRunning) {
      interval = setInterval(() => {
        const events = clusterRef.current.stepProtocol()
        refreshState(events)
      }, 1200)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isAutoRunning])

  const selectedNode = snapshot.nodes.find((n) => n.id === selectedNodeId) || snapshot.nodes[0]

  return (
    <section className="gossip-simulator" aria-labelledby="gossip-title">
      <div className="gossip-simulator__header">
        <div>
          <span className="badge badge--brand">Sistemas P2P & Membresía SWIM</span>
          <h2 id="gossip-title" className="gossip-simulator__title">
            Simulador de Protocolo Gossip & Detección de Fallos SWIM
          </h2>
          <p className="gossip-simulator__desc">
            Visualiza el algoritmo descentralizado utilizado por Apache Cassandra, Consul y Amazon Dynamo para
            gestión de membresía en clústeres. Sondas periódicas por ping directo/indirecto y propagación epidémica de rumores.
          </p>
        </div>

        <div className="gossip-header-actions">
          <button
            type="button"
            className={`btn-secondary ${isAutoRunning ? 'btn-secondary--active' : ''}`}
            onClick={() => setIsAutoRunning(!isAutoRunning)}
          >
            {isAutoRunning ? '⏸️ Pausar Simulación' : '▶️ Auto-Run Gossip'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleStep}
          >
            ⚡ Paso de Protocolo (Tick)
          </button>
        </div>
      </div>

      {/* ── Topología de Nodos P2P ── */}
      <div className="gossip-nodes-grid">
        {snapshot.nodes.map((node) => {
          const isAlive = node.state === MEMBER_STATES.ALIVE
          const isSuspect = node.state === MEMBER_STATES.SUSPECT
          const isDead = node.state === MEMBER_STATES.DEAD
          const isSelected = node.id === selectedNodeId

          return (
            <div
              key={node.id}
              className={`gossip-node-card ${isSelected ? 'gossip-node-card--selected' : ''} ${!node.isOnline ? 'gossip-node-card--offline' : ''}`}
              onClick={() => setSelectedNodeId(node.id)}
            >
              <div className="gossip-node-card__header">
                <span className="gossip-node-id">{node.id}</span>
                <span className={`gossip-state-badge gossip-state-badge--${node.state.toLowerCase()}`}>
                  {isAlive && '🟢 ALIVE'}
                  {isSuspect && '🟡 SUSPECT'}
                  {isDead && '🔴 DEAD'}
                </span>
              </div>

              <div className="gossip-node-meta">
                <div>
                  <span className="gossip-meta-label">Encarnación:</span>
                  <span className="gossip-meta-val">#{node.incarnation}</span>
                </div>
                <div>
                  <span className="gossip-meta-label">Red Física:</span>
                  <span className={`gossip-meta-val ${node.isOnline ? 'gossip-text-online' : 'gossip-text-offline'}`}>
                    {node.isOnline ? 'Conectado' : 'Aislado (Fallo)'}
                  </span>
                </div>
              </div>

              <div className="gossip-node-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={`btn-xs ${node.isOnline ? 'btn-danger' : 'btn-success'}`}
                  onClick={() => handleToggleOnline(node.id, node.isOnline)}
                >
                  {node.isOnline ? '🔌 Desconectar' : '⚡ Reconectar'}
                </button>
                {isSuspect && (
                  <button
                    type="button"
                    className="btn-xs btn-primary"
                    onClick={() => handleRefute(node.id)}
                  >
                    🛡️ Refutar
                  </button>
                )}
                {isSuspect && (
                  <button
                    type="button"
                    className="btn-xs btn-danger"
                    onClick={() => handleDeclareDead(node.id)}
                  >
                    ☠️ Declarar Dead
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Vista Detallada de Tabla de Membresía del Nodo Seleccionado ── */}
      <div className="gossip-details-layout">
        <div className="gossip-table-panel">
          <h3 className="gossip-panel-title">
            📋 Tabla de Membresía Local del Nodo {selectedNode.id}
          </h3>

          <div className="gossip-members-table-wrapper">
            <table className="gossip-table">
              <thead>
                <tr>
                  <th>Nodo Peer</th>
                  <th>Estado Percibido</th>
                  <th>Encarnación</th>
                </tr>
              </thead>
              <tbody>
                {selectedNode.members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.id}</strong> {m.id === selectedNode.id && '(Este nodo)'}
                    </td>
                    <td>
                      <span className={`gossip-state-badge gossip-state-badge--${m.state.toLowerCase()}`}>
                        {m.state}
                      </span>
                    </td>
                    <td><code>#{m.incarnation}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Auditoría de Mensajes Gossip en Tiempo Real ── */}
        <div className="gossip-events-panel">
          <h3 className="gossip-panel-title">📡 Registro de Mensajes de Protocolo (Audit Log)</h3>
          <div className="gossip-events-list">
            {snapshot.eventLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="gossip-event-item">
                <span className="gossip-event-type">{log.type}</span>
                <span className="gossip-event-route">{log.source} ➔ {log.target}</span>
                <span className="gossip-event-details">{JSON.stringify(log.details)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
