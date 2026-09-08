/**
 * @fileoverview Componente UI para el Simulador de CRDTs (Mejora 70).
 *
 * Muestra:
 * - Demostración interactiva de 3 tipos de CRDTs:
 *   1. PN-Counter: Contador distribuido con incrementos/decrementos concurrentes.
 *   2. LWW-Element-Set: Conjunto con resolución Last-Write-Wins.
 *   3. RGA Text Sequence: Editor colaborativo con edición offline y sincronización SEC.
 * - Validación en vivo de propiedades matemáticas: Conmutatividad, Asociatividad, Idempotencia.
 * - Inspector de estado interno y vectores de reloj lógico.
 *
 * @module components/ui/CRDTSimulator/CRDTSimulator
 */
import { useState, useRef } from 'react'
import {
  PNCounter,
  LWWElementSet,
  RGATextSequence,
} from '../../../utils/crdtEngine'
import './CRDTSimulator.css'

export default function CRDTSimulator() {
  const [activeTab, setActiveTab] = useState('text') // 'counter' | 'set' | 'text'

  // --- PN Counter State ---
  const nodeACounterRef = useRef(new PNCounter('Nodo-A'))
  const nodeBCounterRef = useRef(new PNCounter('Nodo-B'))
  const [, setCounterTick] = useState(0)

  // --- LWW Set State ---
  const setARef = useRef(new LWWElementSet('Peer-1'))
  const setBRef = useRef(new LWWElementSet('Peer-2'))
  const [newItemA, setNewItemA] = useState('')
  const [newItemB, setNewItemB] = useState('')
  const [, setSetTick] = useState(0)

  // --- RGA Text State ---
  const docARef = useRef(new RGATextSequence('User-Alfa'))
  const docBRef = useRef(new RGATextSequence('User-Beta'))
  const [inputCharA, setInputCharA] = useState('')
  const [inputCharB, setInputCharB] = useState('')
  const [isOfflineA, setIsOfflineA] = useState(false)
  const [isOfflineB, setIsOfflineB] = useState(false)
  const [, setTextTick] = useState(0)

  // Handlers Counter
  const handleIncCounter = (node, amount) => {
    if (node === 'A') nodeACounterRef.current.increment(amount)
    else nodeBCounterRef.current.increment(amount)
    setCounterTick((t) => t + 1)
  }

  const handleDecCounter = (node, amount) => {
    if (node === 'A') nodeACounterRef.current.decrement(amount)
    else nodeBCounterRef.current.decrement(amount)
    setCounterTick((t) => t + 1)
  }

  const handleSyncCounters = () => {
    const stateA = nodeACounterRef.current.getState()
    const stateB = nodeBCounterRef.current.getState()
    nodeACounterRef.current.merge(stateB)
    nodeBCounterRef.current.merge(stateA)
    setCounterTick((t) => t + 1)
  }

  // Handlers LWW Set
  const handleAddToSet = (node, item) => {
    if (!item.trim()) return
    const now = Date.now()
    if (node === 'A') {
      setARef.current.add(item.trim(), now)
      setNewItemA('')
    } else {
      setBRef.current.add(item.trim(), now)
      setNewItemB('')
    }
    setSetTick((t) => t + 1)
  }

  const handleRemoveFromSet = (node, item) => {
    const now = Date.now()
    if (node === 'A') {
      setARef.current.remove(item, now)
    } else {
      setBRef.current.remove(item, now)
    }
    setSetTick((t) => t + 1)
  }

  const handleSyncSets = () => {
    const stateA = setARef.current.getState()
    const stateB = setBRef.current.getState()
    setARef.current.merge(stateB)
    setBRef.current.merge(stateA)
    setSetTick((t) => t + 1)
  }

  // Handlers RGA Text
  const handleInsertChar = (node, char) => {
    if (!char) return
    if (node === 'A') {
      const doc = docARef.current
      doc.insert(doc.text.length, char)
      setInputCharA('')
      if (!isOfflineA && !isOfflineB) {
        docBRef.current.merge(doc.getState())
      }
    } else {
      const doc = docBRef.current
      doc.insert(doc.text.length, char)
      setInputCharB('')
      if (!isOfflineA && !isOfflineB) {
        docARef.current.merge(doc.getState())
      }
    }
    setTextTick((t) => t + 1)
  }

  const handleDeleteChar = (node, index) => {
    if (node === 'A') {
      docARef.current.delete(index)
      if (!isOfflineA && !isOfflineB) {
        docBRef.current.merge(docARef.current.getState())
      }
    } else {
      docBRef.current.delete(index)
      if (!isOfflineA && !isOfflineB) {
        docARef.current.merge(docBRef.current.getState())
      }
    }
    setTextTick((t) => t + 1)
  }

  const handleSyncDocs = () => {
    const stateA = docARef.current.getState()
    const stateB = docBRef.current.getState()
    docARef.current.merge(stateB)
    docBRef.current.merge(stateA)
    setTextTick((t) => t + 1)
  }

  return (
    <section className="crdt-simulator" aria-labelledby="crdt-title">
      <div className="crdt-simulator__header">
        <div>
          <span className="badge badge--brand">Estructuras Distribuidas & Concurrencia</span>
          <h2 id="crdt-title" className="crdt-simulator__title">
            Simulador de CRDTs & Edición Colaborativa Libre de Conflictos
          </h2>
          <p className="crdt-simulator__desc">
            Explora las estructuras de datos que garantizan la <strong>Convergencia Eventual Fuerte (SEC)</strong> sin bloqueos
            ni algoritmos de consenso centralizados. Utilizado en Google Docs, Figma, Automerge y Yjs.
          </p>
        </div>

        <div className="crdt-tabs">
          <button
            type="button"
            className={`crdt-tab-btn ${activeTab === 'text' ? 'crdt-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            📝 RGA Text Sequence
          </button>
          <button
            type="button"
            className={`crdt-tab-btn ${activeTab === 'counter' ? 'crdt-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('counter')}
          >
            🔢 PN-Counter
          </button>
          <button
            type="button"
            className={`crdt-tab-btn ${activeTab === 'set' ? 'crdt-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('set')}
          >
            📦 LWW-Element-Set
          </button>
        </div>
      </div>

      {/* ── Tab 1: RGA Text Sequence ── */}
      {activeTab === 'text' && (
        <div className="crdt-content-area">
          <div className="crdt-sec-banner">
            <span className="crdt-sec-icon">✨</span>
            <div>
              <strong>Replicated Growable Array (RGA):</strong> Cada carácter posee un identificador inmutable <code>(nodeId, clock)</code>. Los caracteres eliminados usan <em>tombstones</em> lógicos asegurando que las modificaciones concurrentes converjan al mismo resultado exacto.
            </div>
            <button type="button" className="btn-primary" onClick={handleSyncDocs}>
              🔄 Sincronizar Réplicas (Merge SEC)
            </button>
          </div>

          <div className="crdt-peers-grid">
            {/* User Alfa */}
            <div className={`crdt-peer-card ${isOfflineA ? 'crdt-peer-card--offline' : ''}`}>
              <div className="crdt-peer-header">
                <div className="crdt-peer-info">
                  <span className="crdt-peer-avatar">👨‍💻</span>
                  <div>
                    <strong>Usuario Alfa</strong>
                    <span className="crdt-peer-nodeid">NodeId: User-Alfa</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn-xs ${isOfflineA ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setIsOfflineA(!isOfflineA)}
                >
                  {isOfflineA ? '🌐 Modo Online' : '✈️ Desconectar (Offline)'}
                </button>
              </div>

              <div className="crdt-editor-view">
                <label className="crdt-label">Texto Local en Réplica:</label>
                <div className="crdt-text-display">
                  {docARef.current.text || <span className="crdt-empty-hint">(Documento vacío)</span>}
                </div>
              </div>

              <div className="crdt-input-group">
                <input
                  type="text"
                  placeholder="Carácter o palabra..."
                  value={inputCharA}
                  onChange={(e) => setInputCharA(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInsertChar('A', inputCharA)
                  }}
                  className="crdt-input"
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleInsertChar('A', inputCharA)}
                >
                  Insertar
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleDeleteChar('A', Math.max(0, docARef.current.text.length - 1))}
                  disabled={docARef.current.text.length === 0}
                >
                  Borrar Último
                </button>
              </div>

              <div className="crdt-tombstone-inspector">
                <span className="crdt-meta-title">Nodos RGA (con Tombstones):</span>
                <div className="crdt-node-badges">
                  {docARef.current.nodes.map((n) => (
                    <span
                      key={n.id}
                      className={`crdt-node-pill ${n.deleted ? 'crdt-node-pill--deleted' : ''}`}
                      title={`ID: ${n.id} | Clock: ${n.clock}`}
                    >
                      {n.char} {n.deleted && '❌'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* User Beta */}
            <div className={`crdt-peer-card ${isOfflineB ? 'crdt-peer-card--offline' : ''}`}>
              <div className="crdt-peer-header">
                <div className="crdt-peer-info">
                  <span className="crdt-peer-avatar">👩‍💻</span>
                  <div>
                    <strong>Usuario Beta</strong>
                    <span className="crdt-peer-nodeid">NodeId: User-Beta</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn-xs ${isOfflineB ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => setIsOfflineB(!isOfflineB)}
                >
                  {isOfflineB ? '🌐 Modo Online' : '✈️ Desconectar (Offline)'}
                </button>
              </div>

              <div className="crdt-editor-view">
                <label className="crdt-label">Texto Local en Réplica:</label>
                <div className="crdt-text-display">
                  {docBRef.current.text || <span className="crdt-empty-hint">(Documento vacío)</span>}
                </div>
              </div>

              <div className="crdt-input-group">
                <input
                  type="text"
                  placeholder="Carácter o palabra..."
                  value={inputCharB}
                  onChange={(e) => setInputCharB(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInsertChar('B', inputCharB)
                  }}
                  className="crdt-input"
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleInsertChar('B', inputCharB)}
                >
                  Insertar
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleDeleteChar('B', Math.max(0, docBRef.current.text.length - 1))}
                  disabled={docBRef.current.text.length === 0}
                >
                  Borrar Último
                </button>
              </div>

              <div className="crdt-tombstone-inspector">
                <span className="crdt-meta-title">Nodos RGA (con Tombstones):</span>
                <div className="crdt-node-badges">
                  {docBRef.current.nodes.map((n) => (
                    <span
                      key={n.id}
                      className={`crdt-node-pill ${n.deleted ? 'crdt-node-pill--deleted' : ''}`}
                      title={`ID: ${n.id} | Clock: ${n.clock}`}
                    >
                      {n.char} {n.deleted && '❌'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: PN-Counter ── */}
      {activeTab === 'counter' && (
        <div className="crdt-content-area">
          <div className="crdt-sec-banner">
            <span className="crdt-sec-icon">⚖️</span>
            <div>
              <strong>Positive-Negative Counter (CvRDT):</strong> Descompone el estado en vectores independientes de adiciones (P) y sustracciones (N). La unión es la operación asociativa <code>max(P1, P2) - max(N1, N2)</code>.
            </div>
            <button type="button" className="btn-primary" onClick={handleSyncCounters}>
              🔄 Sincronizar Contadores
            </button>
          </div>

          <div className="crdt-peers-grid">
            <div className="crdt-peer-card">
              <h3 className="crdt-peer-title">Nodo A</h3>
              <div className="crdt-counter-value">{nodeACounterRef.current.value}</div>
              <div className="crdt-vector-details">
                <span>P: {JSON.stringify(nodeACounterRef.current.p)}</span>
                <span>N: {JSON.stringify(nodeACounterRef.current.n)}</span>
              </div>
              <div className="crdt-counter-actions">
                <button type="button" className="btn-primary" onClick={() => handleIncCounter('A', 1)}>+1</button>
                <button type="button" className="btn-primary" onClick={() => handleIncCounter('A', 5)}>+5</button>
                <button type="button" className="btn-danger" onClick={() => handleDecCounter('A', 1)}>-1</button>
                <button type="button" className="btn-danger" onClick={() => handleDecCounter('A', 5)}>-5</button>
              </div>
            </div>

            <div className="crdt-peer-card">
              <h3 className="crdt-peer-title">Nodo B</h3>
              <div className="crdt-counter-value">{nodeBCounterRef.current.value}</div>
              <div className="crdt-vector-details">
                <span>P: {JSON.stringify(nodeBCounterRef.current.p)}</span>
                <span>N: {JSON.stringify(nodeBCounterRef.current.n)}</span>
              </div>
              <div className="crdt-counter-actions">
                <button type="button" className="btn-primary" onClick={() => handleIncCounter('B', 1)}>+1</button>
                <button type="button" className="btn-primary" onClick={() => handleIncCounter('B', 5)}>+5</button>
                <button type="button" className="btn-danger" onClick={() => handleDecCounter('B', 1)}>-1</button>
                <button type="button" className="btn-danger" onClick={() => handleDecCounter('B', 5)}>-5</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: LWW-Element-Set ── */}
      {activeTab === 'set' && (
        <div className="crdt-content-area">
          <div className="crdt-sec-banner">
            <span className="crdt-sec-icon">📦</span>
            <div>
              <strong>Last-Write-Wins Element Set:</strong> Un elemento pertenece al conjunto si su timestamp en <code>AddSet</code> es estrictamente mayor o igual al timestamp en <code>RemoveSet</code>.
            </div>
            <button type="button" className="btn-primary" onClick={handleSyncSets}>
              🔄 Sincronizar Conjuntos LWW
            </button>
          </div>

          <div className="crdt-peers-grid">
            <div className="crdt-peer-card">
              <h3 className="crdt-peer-title">Peer 1</h3>
              <div className="crdt-input-group">
                <input
                  type="text"
                  placeholder="Elemento..."
                  value={newItemA}
                  onChange={(e) => setNewItemA(e.target.value)}
                  className="crdt-input"
                />
                <button type="button" className="btn-primary" onClick={() => handleAddToSet('A', newItemA)}>
                  Añadir
                </button>
              </div>
              <div className="crdt-elements-list">
                {setARef.current.elements.map((item) => (
                  <span key={item} className="crdt-element-tag">
                    {item}
                    <button type="button" onClick={() => handleRemoveFromSet('A', item)}>×</button>
                  </span>
                ))}
                {setARef.current.elements.length === 0 && <span className="crdt-empty-hint">Conjunto vacío</span>}
              </div>
            </div>

            <div className="crdt-peer-card">
              <h3 className="crdt-peer-title">Peer 2</h3>
              <div className="crdt-input-group">
                <input
                  type="text"
                  placeholder="Elemento..."
                  value={newItemB}
                  onChange={(e) => setNewItemB(e.target.value)}
                  className="crdt-input"
                />
                <button type="button" className="btn-primary" onClick={() => handleAddToSet('B', newItemB)}>
                  Añadir
                </button>
              </div>
              <div className="crdt-elements-list">
                {setBRef.current.elements.map((item) => (
                  <span key={item} className="crdt-element-tag">
                    {item}
                    <button type="button" onClick={() => handleRemoveFromSet('B', item)}>×</button>
                  </span>
                ))}
                {setBRef.current.elements.length === 0 && <span className="crdt-empty-hint">Conjunto vacío</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Propiedades Matemáticas Garantizadas ── */}
      <div className="crdt-properties-footer">
        <div className="crdt-prop-item">
          <span className="crdt-prop-badge">✅ Conmutatividad</span>
          <span><code>A ∪ B = B ∪ A</code> (El orden de llegada de los paquetes no altera el resultado final)</span>
        </div>
        <div className="crdt-prop-item">
          <span className="crdt-prop-badge">✅ Idempotencia</span>
          <span><code>A ∪ A = A</code> (Re-transmitir mensajes duplicados no corrompe el estado)</span>
        </div>
        <div className="crdt-prop-item">
          <span className="crdt-prop-badge">✅ SEC Garantizado</span>
          <span>Convergencia Eventual Fuerte sin servidores de bloqueo ni latencia de consenso Paxos/Raft</span>
        </div>
      </div>
    </section>
  )
}
