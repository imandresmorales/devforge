/**
 * @fileoverview Componente PBFTExplorer — Simulador Interactivo de Consenso PBFT.
 *
 * MEJORA 94: Algoritmo de Consenso Practical Byzantine Fault Tolerance (PBFT / Castro-Liskov).
 * Permite configurar nodos honestos, caídos (crash) o maliciosos (Byzantine),
 * ejecutar propuestas en tiempo real y observar las fases Pre-Prepare, Prepare y Commit.
 *
 * @module components/ui/PBFTExplorer
 */
import { useState } from 'react'
import {
  createPBFTCluster,
  runPBFTConsensus,
  calculateMaxFaultTolerance,
  calculateQuorumSize,
  NODE_BEHAVIORS
} from '../../../utils/pbftEngine.js'
import './PBFTExplorer.css'

export default function PBFTExplorer() {
  const [nodeCount, setNodeCount] = useState(4)
  const [byzantineNodes, setByzantineNodes] = useState(['node-3'])
  const [crashNodes, setCrashNodes] = useState([])
  const [txPayload, setTxPayload] = useState('Transferencia $25,000 USD a Custodia')
  const [activeTab, setActiveTab] = useState('nodes')
  const [consensusResult, setConsensusResult] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const maxFaulty = calculateMaxFaultTolerance(nodeCount)
  const quorum = calculateQuorumSize(nodeCount)

  // Alternar comportamiento de nodo
  const handleToggleBehavior = (nodeId) => {
    if (byzantineNodes.includes(nodeId)) {
      setByzantineNodes(prev => prev.filter(id => id !== nodeId))
      setCrashNodes(prev => [...prev, nodeId])
    } else if (crashNodes.includes(nodeId)) {
      setCrashNodes(prev => prev.filter(id => id !== nodeId))
    } else {
      setByzantineNodes(prev => [...prev, nodeId])
    }
    setConsensusResult(null)
  }

  const handleRunSimulation = () => {
    setIsSimulating(true)
    const cluster = createPBFTCluster(nodeCount, byzantineNodes, crashNodes)
    const proposal = {
      txId: `tx-${Date.now().toString(36)}`,
      payload: txPayload,
      timestamp: new Date().toISOString()
    }

    setTimeout(() => {
      const result = runPBFTConsensus(cluster, proposal)
      setConsensusResult(result)
      setIsSimulating(false)
    }, 400)
  }

  const handleResetCluster = () => {
    setByzantineNodes(['node-3'])
    setCrashNodes([])
    setConsensusResult(null)
  }

  return (
    <section className="pbft-explorer" aria-labelledby="pbft-title">
      <div className="pbft-header">
        <div className="pbft-header__badge">
          <span>MEJORA 94</span>
          <span className="pbft-badge-tag">Consenso Distribuido & Tolerancia a Fallas</span>
        </div>
        <h2 id="pbft-title" className="pbft-header__title">
          Simulador de Consenso PBFT (Practical Byzantine Fault Tolerance)
        </h2>
        <p className="pbft-header__desc">
          Demostración matemática del teorema de Castro-Liskov ($N \ge 3f + 1$). El clúster tolera hasta <strong>{maxFaulty}</strong> nodos maliciosos/caídos y requiere un quórum de <strong>{quorum}</strong> votos para confirmar de forma inmutable cada transacción.
        </p>
      </div>

      {/* Controles de Configuración */}
      <div className="pbft-controls-grid">
        <div className="pbft-card">
          <label className="pbft-label" htmlFor="pbft-nodes-select">
            Tamaño de la Red (Nodos N)
          </label>
          <select
            id="pbft-nodes-select"
            className="pbft-select"
            value={nodeCount}
            onChange={(e) => {
              const count = Number(e.target.value)
              setNodeCount(count)
              setByzantineNodes([])
              setCrashNodes([])
              setConsensusResult(null)
            }}
          >
            <option value={4}>4 Nodos (f=1, Quórum=3)</option>
            <option value={7}>7 Nodos (f=2, Quórum=5)</option>
            <option value={10}>10 Nodos (f=3, Quórum=7)</option>
            <option value={13}>13 Nodos (f=4, Quórum=9)</option>
          </select>
          <div className="pbft-meta-info">
            <span>Tolerancia $f_{'{max}'}$: <strong>{maxFaulty}</strong></span>
            <span>Quórum $2f+1$: <strong>{quorum}</strong></span>
          </div>
        </div>

        <div className="pbft-card">
          <label className="pbft-label" htmlFor="pbft-payload-input">
            Propuesta / Payload de Transacción
          </label>
          <input
            id="pbft-payload-input"
            type="text"
            className="pbft-input"
            value={txPayload}
            onChange={(e) => setTxPayload(e.target.value)}
            placeholder="Ej: Transferencia $25,000 USD..."
          />
          <div className="pbft-actions-row">
            <button
              className="pbft-btn pbft-btn--primary"
              onClick={handleRunSimulation}
              disabled={isSimulating}
            >
              {isSimulating ? 'Propagando Consenso...' : '▶ Ejecutar Rápido PBFT'}
            </button>
            <button
              className="pbft-btn pbft-btn--secondary"
              onClick={handleResetCluster}
              disabled={isSimulating}
            >
              ↺ Resetear
            </button>
          </div>
        </div>
      </div>

      {/* Mapa Visual de Nodos */}
      <div className="pbft-cluster-panel">
        <h3 className="pbft-section-title">
          Topología del Clúster de Réplicas (Haz clic en un nodo para cambiar su estado)
        </h3>
        <div className="pbft-nodes-grid">
          {Array.from({ length: nodeCount }).map((_, i) => {
            const nodeId = `node-${i}`
            const isPrimary = i === 0
            const isByzantine = byzantineNodes.includes(nodeId)
            const isCrash = crashNodes.includes(nodeId)
            const isCommitted = consensusResult?.committedNodes?.includes(nodeId)

            let statusClass = 'honest'
            let statusLabel = 'Honesto (Vota legal)'
            if (isByzantine) {
              statusClass = 'byzantine'
              statusLabel = 'Bizantino (Voto corrupto)'
            } else if (isCrash) {
              statusClass = 'crash'
              statusLabel = 'Caído (Sin respuesta)'
            }

            return (
              <button
                key={nodeId}
                type="button"
                className={`pbft-node-card pbft-node-card--${statusClass} ${isPrimary ? 'pbft-node-card--primary' : ''} ${isCommitted ? 'pbft-node-card--committed' : ''}`}
                onClick={() => handleToggleBehavior(nodeId)}
                title="Haz clic para alternar: Honesto -> Bizantino -> Caído -> Honesto"
              >
                <div className="pbft-node-header">
                  <span className="pbft-node-id">{nodeId}</span>
                  {isPrimary && <span className="pbft-primary-pill">👑 Primary Leader</span>}
                </div>
                <div className="pbft-node-status">
                  <span className="pbft-node-dot" />
                  <span>{statusLabel}</span>
                </div>
                <div className="pbft-node-state">
                  {isCommitted ? '✅ COMMITTED' : consensusResult ? '❌ REJECTED' : 'IDLE'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Resultados y Bitácora de Fases */}
      {consensusResult && (
        <div className="pbft-results-panel">
          <div className={`pbft-banner ${consensusResult.success ? 'pbft-banner--success' : 'pbft-banner--error'}`}>
            <div className="pbft-banner__icon">{consensusResult.success ? '🛡️' : '⚠️'}</div>
            <div className="pbft-banner__text">
              <h4>{consensusResult.success ? 'Consenso PBFT Alcanzado con Éxito' : 'Fallo de Consenso PBFT'}</h4>
              <p>
                {consensusResult.success
                  ? `Se alcanzaron ${consensusResult.committedNodes.length} confirmaciones legítimas sobre el quórum requerido (${quorum}/${nodeCount}). El estado fue aplicado sin corrupción.`
                  : `Se obtuvieron solo ${consensusResult.committedNodes.length} confirmaciones legítimas (se requerían ${quorum}). La transacción fue abortada para prevenir bifurcaciones o ataques de doble gasto.`}
              </p>
            </div>
          </div>

          <div className="pbft-tabs">
            <button
              className={`pbft-tab-btn ${activeTab === 'nodes' ? 'active' : ''}`}
              onClick={() => setActiveTab('nodes')}
            >
              Fases del Protocolo (Pre-Prepare / Prepare / Commit)
            </button>
            <button
              className={`pbft-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              Log de Auditoría Criptográfico
            </button>
          </div>

          {activeTab === 'nodes' ? (
            <div className="pbft-phases-flow">
              <div className="pbft-phase-step">
                <span className="pbft-phase-num">1</span>
                <div>
                  <h5>Fase Pre-Prepare</h5>
                  <p>Líder emite la propuesta con digest <code>{consensusResult.expectedDigest.slice(0, 16)}...</code></p>
                </div>
              </div>
              <div className="pbft-phase-step">
                <span className="pbft-phase-num">2</span>
                <div>
                  <h5>Fase Prepare</h5>
                  <p>Las réplicas validan el digest y difunden su voto cruzado en la red peer-to-peer.</p>
                </div>
              </div>
              <div className="pbft-phase-step">
                <span className="pbft-phase-num">3</span>
                <div>
                  <h5>Fase Commit & Execute</h5>
                  <p>Nodos con quórum $\ge 2f+1$ ejecutan la máquina de estados de forma determinista.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="pbft-audit-log">
              {consensusResult.auditLog.map((log, idx) => (
                <div key={idx} className="pbft-log-entry">
                  <span className="pbft-log-badge">{log.phase}</span>
                  <span className="pbft-log-msg">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
