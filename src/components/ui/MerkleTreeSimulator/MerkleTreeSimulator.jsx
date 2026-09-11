/**
 * @fileoverview Componente UI para el Simulador de Árboles de Merkle y Pruebas Criptográficas (Mejora 78).
 *
 * Muestra:
 * - Diagrama de árbol binario de hashes con niveles interactivos (Hojas, Nodos Intermedios y Merkle Root).
 * - Generador de Pruebas de Inclusión (Merkle Proofs) en tiempo real con resaltado visual del camino de auditoría.
 * - Verificador criptográfico estático O(log N).
 * - Laboratorio de manipulación/tampering de datos para observar el efecto avalancha en la raíz criptográfica.
 *
 * @module components/ui/MerkleTreeSimulator/MerkleTreeSimulator
 */
import { useState, useRef } from 'react'
import { MerkleTree } from '../../../utils/merkleTree'
import './MerkleTreeSimulator.css'

const INITIAL_TRANSACTIONS = [
  'Tx0: Alice -> Bob $120.00',
  'Tx1: Bob -> Charlie $45.50',
  'Tx2: Dave -> Exchange 1.5 ETH',
  'Tx3: Eve -> Miner Fee 0.002 BTC',
]

export default function MerkleTreeSimulator() {
  const treeRef = useRef(new MerkleTree(INITIAL_TRANSACTIONS))
  const [selectedLeafIdx, setSelectedLeafIdx] = useState(0)
  const [proofResult, setProofResult] = useState(null)
  const [newTxText, setNewTxText] = useState('')
  const [, setTick] = useState(0)

  const tree = treeRef.current
  const snapshot = tree.getSnapshot()
  const activeProof = tree.getProof(selectedLeafIdx)

  const handleSelectLeaf = (idx) => {
    setSelectedLeafIdx(idx)
    setProofResult(null)
  }

  const handleVerifyProof = () => {
    const targetData = tree.rawLeaves[selectedLeafIdx]
    const proof = tree.getProof(selectedLeafIdx)
    const isValid = MerkleTree.verifyProof(targetData, proof, tree.root)

    setProofResult({
      isValid,
      leafData: targetData,
      proofSteps: proof,
      verifiedRoot: tree.root,
    })
  }

  const handleTamperSelected = () => {
    const currentVal = tree.rawLeaves[selectedLeafIdx]
    tree.tamperLeaf(selectedLeafIdx, `${currentVal} (CORRUPTED_TAMPERED)`)
    setProofResult(null)
    setTick((t) => t + 1)
  }

  const handleResetTree = () => {
    treeRef.current = new MerkleTree(INITIAL_TRANSACTIONS)
    setSelectedLeafIdx(0)
    setProofResult(null)
    setTick((t) => t + 1)
  }

  const handleAddLeaf = () => {
    if (!newTxText.trim()) return
    const updatedLeaves = [...tree.rawLeaves, newTxText.trim()]
    treeRef.current = new MerkleTree(updatedLeaves)
    setNewTxText('')
    setProofResult(null)
    setTick((t) => t + 1)
  }

  return (
    <section className="merkle-simulator" aria-labelledby="merkle-title">
      <div className="merkle-simulator__header">
        <div>
          <span className="badge badge--brand">Criptografía de Bloques & Integridad</span>
          <h2 id="merkle-title" className="merkle-simulator__title">
            Simulador de Árboles de Merkle & Pruebas Criptográficas (Merkle Proofs)
          </h2>
          <p className="merkle-simulator__desc">
            Visualiza la estructura de datos fundamental detrás de <strong>Bitcoin, Ethereum, Git y Certificate Transparency</strong>.
            Verifica la inclusión de datos en tiempo $O(\log N)$ sin transferir el conjunto de datos completo.
          </p>
        </div>

        <div className="merkle-actions">
          <button type="button" className="btn-secondary" onClick={handleResetTree}>
            🔄 Restaurar Árbol
          </button>
        </div>
      </div>

      {/* ── Merkle Root Highlight Banner ── */}
      <div className="merkle-root-banner">
        <div className="merkle-root-label">
          <span>👑 Merkle Root (Criptográficamente Verificada):</span>
          <code className="merkle-root-code">{snapshot.root}</code>
        </div>
        <div className="merkle-root-meta">
          <span>Hojas: <strong>{snapshot.leafCount}</strong></span>
          <span>Altura del Árbol: <strong>{snapshot.layers.length} niveles</strong></span>
        </div>
      </div>

      {/* ── Diagrama del Árbol de Merkle (Jerarquía Visual) ── */}
      <div className="merkle-tree-container">
        <h3 className="merkle-section-title">🌳 Estructura Jerárquica del Árbol Binario</h3>

        <div className="merkle-layers">
          {snapshot.layers.slice().reverse().map((layer, reverseIdx) => {
            const levelIdx = snapshot.layers.length - 1 - reverseIdx
            const isRootLevel = levelIdx === snapshot.layers.length - 1
            const isLeavesLevel = levelIdx === 0

            return (
              <div key={levelIdx} className="merkle-layer-row">
                <span className="merkle-layer-label">
                  {isRootLevel ? 'Raíz (Nivel ' + levelIdx + ')' : isLeavesLevel ? 'Hojas (Nivel 0)' : 'Nivel ' + levelIdx}
                </span>
                <div className="merkle-layer-nodes">
                  {layer.map((hash, nodeIdx) => {
                    const isSelected = isLeavesLevel && nodeIdx === selectedLeafIdx
                    return (
                      <div
                        key={nodeIdx}
                        className={`merkle-node-card ${isRootLevel ? 'merkle-node-card--root' : ''} ${isSelected ? 'merkle-node-card--selected' : ''}`}
                        onClick={() => isLeavesLevel && handleSelectLeaf(nodeIdx)}
                        style={{ cursor: isLeavesLevel ? 'pointer' : 'default' }}
                      >
                        <span className="merkle-node-hash" title={hash}>
                          {hash.substring(0, 10)}...{hash.substring(54)}
                        </span>
                        {isLeavesLevel && (
                          <div className="merkle-leaf-preview">
                            {snapshot.rawLeaves[nodeIdx]}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Panel de Auditoría y Verificación de Pruebas ── */}
      <div className="merkle-controls-grid">
        {/* Panel Izquierdo: Selección y Manipulación */}
        <div className="merkle-panel">
          <h3 className="merkle-panel-title">🔍 Inspección de Transacción Seleccionada</h3>
          <p className="merkle-panel-desc">
            Transacción actual: <strong>#{selectedLeafIdx}</strong>
          </p>

          <div className="merkle-selected-card">
            <span className="merkle-meta-tag">Contenido de la Hoja:</span>
            <div className="merkle-leaf-content">{snapshot.rawLeaves[selectedLeafIdx]}</div>
            <span className="merkle-meta-tag">Hash Criptográfico de la Hoja:</span>
            <code className="merkle-hash-small">{snapshot.layers[0][selectedLeafIdx]}</code>
          </div>

          <div className="merkle-btn-group">
            <button type="button" className="btn-primary" onClick={handleVerifyProof}>
              🛡️ Generar & Verificar Merkle Proof
            </button>
            <button type="button" className="btn-danger" onClick={handleTamperSelected}>
              ⚠️ Manipular Datos (Simular Fraude)
            </button>
          </div>

          {/* Añadir nueva transacción */}
          <div className="merkle-add-form">
            <label>Añadir Nueva Hoja al Árbol:</label>
            <div className="merkle-input-group">
              <input
                type="text"
                placeholder="Tx4: Bob -> Alice $10..."
                value={newTxText}
                onChange={(e) => setNewTxText(e.target.value)}
                className="merkle-input"
              />
              <button type="button" className="btn-secondary" onClick={handleAddLeaf}>
                + Añadir
              </button>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Desglose de la Prueba Criptográfica O(log N) */}
        <div className="merkle-panel">
          <h3 className="merkle-panel-title">📜 Camino de Auditoría (Audit Path O(log N))</h3>
          <p className="merkle-panel-desc">
            Solo se requieren <strong>{activeProof.length} hashes hermanos</strong> para probar matemáticamente la existencia de esta transacción en la raíz.
          </p>

          <div className="merkle-proof-steps">
            {activeProof.map((step, idx) => (
              <div key={idx} className="merkle-proof-step">
                <span className="badge badge--brand">Paso #{idx + 1} ({step.position})</span>
                <code className="merkle-sibling-hash">{step.hash}</code>
              </div>
            ))}
          </div>

          {proofResult && (
            <div className={`merkle-verification-result merkle-verification-result--${proofResult.isValid ? 'valid' : 'invalid'}`}>
              <div className="merkle-result-title">
                {proofResult.isValid ? '✅ PRUEBA CRIPTOGRÁFICA VÁLIDA' : '🚨 PRUEBA INVÁLIDA: DATOS CORRUPTOS'}
              </div>
              <p className="merkle-result-desc">
                {proofResult.isValid
                  ? 'La transacción está incluida inequívocamente en la Merkle Root. Integridad 100% garantizada.'
                  : 'El hash calculado difiere de la Merkle Root esperada. Los datos fueron alterados en tránsito o en almacenamiento.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
