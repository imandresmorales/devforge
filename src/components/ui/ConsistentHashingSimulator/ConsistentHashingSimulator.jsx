/**
 * @fileoverview Componente UI para el Simulador de Consistent Hashing y Particionamiento Horizontal (Mejora 74).
 *
 * Muestra:
 * - Visualización SVG del Anillo Hash Circular (0° a 360°) con Nodos Virtuales (vnodes) y Claves proyectadas.
 * - Adición y remoción dinámica de nodos físicos para observar el rebalanceo mínimo de claves (K/N).
 * - Comparativa de impacto de migración: Consistent Hashing (~20-25% migrado) vs Modulo Hashing Clásico (~75-80% migrado).
 * - Inspector de distribución por partición, replicación física y métricas de dispersión de carga.
 *
 * @module components/ui/ConsistentHashingSimulator/ConsistentHashingSimulator
 */
import { useState, useRef, useEffect } from 'react'
import { ConsistentHashRing } from '../../../utils/consistentHashing'
import './ConsistentHashingSimulator.css'

const NODE_COLORS = {
  'Node-A': '#6366f1', // Indigo
  'Node-B': '#10b981', // Emerald
  'Node-C': '#f59e0b', // Amber
  'Node-D': '#ec4899', // Pink
  'Node-E': '#8b5cf6', // Purple
}

const INITIAL_KEYS = [
  'user:101', 'user:102', 'order:884', 'session:a9f', 'cart:332',
  'invoice:551', 'cache:home', 'token:jwt_4', 'profile:alex', 'metric:cpu'
]

export default function ConsistentHashingSimulator() {
  const ringRef = useRef(null)
  if (!ringRef.current) {
    ringRef.current = new ConsistentHashRing({ vnodes: 3, nodes: ['Node-A', 'Node-B', 'Node-C'] })
    INITIAL_KEYS.forEach((k) => ringRef.current.put(k, { timestamp: Date.now() }))
  }

  const [snapshot, setSnapshot] = useState(() => ringRef.current.getSnapshot())
  const [newKeyInput, setNewKeyInput] = useState('')
  const [selectedKey, setSelectedKey] = useState(INITIAL_KEYS[0])
  const [vnodesSetting, setVnodesSetting] = useState(3)

  const refresh = () => {
    setSnapshot(ringRef.current.getSnapshot())
  }

  const handleAddNode = (nodeId) => {
    ringRef.current.addNode(nodeId, vnodesSetting)
    refresh()
  }

  const handleRemoveNode = (nodeId) => {
    ringRef.current.removeNode(nodeId)
    refresh()
  }

  const handleAddKey = () => {
    if (!newKeyInput.trim()) return
    ringRef.current.put(newKeyInput.trim(), { addedAt: Date.now() })
    setSelectedKey(newKeyInput.trim())
    setNewKeyInput('')
    refresh()
  }

  const handlePopulateKeys = () => {
    for (let i = 0; i < 15; i++) {
      const k = `data:${Math.random().toString(36).substring(2, 7)}`
      ringRef.current.put(k, { auto: true })
    }
    refresh()
  }

  const availableNodes = ['Node-A', 'Node-B', 'Node-C', 'Node-D', 'Node-E']
  const nextCandidate = availableNodes.find((n) => !snapshot.physicalNodes.includes(n))
  const migrationImpact = nextCandidate ? ringRef.current.simulateMigrationImpact(nextCandidate, 'add') : null

  // SVG dimensions for circular ring
  const size = 320
  const center = size / 2
  const radius = 120

  return (
    <section className="consistent-hashing" aria-labelledby="ch-title">
      <div className="consistent-hashing__header">
        <div>
          <span className="badge badge--brand">Bases de Datos Distribuidas & Sharding</span>
          <h2 id="ch-title" className="consistent-hashing__title">
            Simulador de Sharding & Anillo de Hash Consistente
          </h2>
          <p className="consistent-hashing__desc">
            Visualiza el algoritmo utilizado por <strong>Amazon DynamoDB, Apache Cassandra, Discord y Memcached</strong> para
            distribuir particiones horizontalmente minimizando la migración de datos ante el escalado o caída de servidores.
          </p>
        </div>

        <div className="ch-quick-actions">
          <button type="button" className="btn-secondary" onClick={handlePopulateKeys}>
            ⚡ Generar 15 Claves Aleatorias
          </button>
        </div>
      </div>

      <div className="ch-grid">
        {/* ── Panel 1: Anillo Hash Circular (SVG 360°) ── */}
        <div className="ch-panel ch-ring-panel">
          <h3 className="ch-panel-title">🔄 Anillo Hash Circular (0° - 360°)</h3>
          <p className="ch-panel-desc">
            Espacio de hash <code>2^32</code>. Cada clave se asigna al primer nodo virtual encontrado en sentido horario.
          </p>

          <div className="ch-svg-wrapper">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ch-svg">
              {/* Outer track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="var(--color-border, #334155)"
                strokeWidth="4"
                strokeDasharray="4 4"
              />

              {/* Degrees markers */}
              <text x={center} y={center - radius - 10} textAnchor="middle" className="ch-svg-text">0° / 360°</text>
              <text x={center + radius + 15} y={center + 4} textAnchor="start" className="ch-svg-text">90°</text>
              <text x={center} y={center + radius + 16} textAnchor="middle" className="ch-svg-text">180°</text>
              <text x={center - radius - 15} y={center + 4} textAnchor="end" className="ch-svg-text">270°</text>

              {/* Virtual Node Tokens */}
              {snapshot.ringTokens.map((vn, idx) => {
                const rad = (vn.degrees - 90) * (Math.PI / 180)
                const x = center + radius * Math.cos(rad)
                const y = center + radius * Math.sin(rad)
                const color = NODE_COLORS[vn.physicalNode] || '#6366f1'

                return (
                  <g key={idx} className="ch-node-marker">
                    <circle cx={x} cy={y} r="8" fill={color} stroke="#0f172a" strokeWidth="2" />
                    <title>{`${vn.vnodeId} @ ${vn.degrees}°`}</title>
                  </g>
                )
              })}

              {/* Stored Keys Markers */}
              {snapshot.keys.map((k, idx) => {
                const rad = (k.degrees - 90) * (Math.PI / 180)
                const x = center + (radius - 18) * Math.cos(rad)
                const y = center + (radius - 18) * Math.sin(rad)
                const isSelected = k.key === selectedKey

                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r={isSelected ? '6' : '3.5'}
                    fill={isSelected ? '#38bdf8' : '#ffffff'}
                    stroke={isSelected ? '#0369a1' : '#000'}
                    strokeWidth="1.5"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedKey(k.key)}
                  >
                    <title>{`Clave: ${k.key} (${k.primaryNode})`}</title>
                  </circle>
                )
              })}
            </svg>
          </div>

          <div className="ch-legend">
            {snapshot.physicalNodes.map((node) => (
              <span key={node} className="ch-legend-item">
                <span className="ch-legend-dot" style={{ background: NODE_COLORS[node] || '#6366f1' }} />
                <strong>{node}</strong> ({snapshot.stats.distribution[node] || 0} claves)
              </span>
            ))}
          </div>
        </div>

        {/* ── Panel 2: Controles de Clúster y Migración de Datos ── */}
        <div className="ch-panel">
          <h3 className="ch-panel-title">⚙️ Topología del Clúster y Escalado</h3>

          <div className="ch-cluster-nodes">
            <span className="ch-label">Nodos Activos en el Clúster:</span>
            <div className="ch-nodes-buttons">
              {availableNodes.map((n) => {
                const isActive = snapshot.physicalNodes.includes(n)
                return (
                  <button
                    key={n}
                    type="button"
                    className={`btn-xs ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                    style={isActive ? { background: NODE_COLORS[n], borderColor: NODE_COLORS[n] } : {}}
                    onClick={() => (isActive ? handleRemoveNode(n) : handleAddNode(n))}
                    disabled={isActive && snapshot.physicalNodes.length <= 1}
                  >
                    {isActive ? `✓ ${n} (Activo)` : `+ Añadir ${n}`}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Insertar Clave */}
          <div className="ch-input-group">
            <input
              type="text"
              placeholder="Nombre de clave (ej. user:99)..."
              value={newKeyInput}
              onChange={(e) => setNewKeyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddKey()
              }}
              className="ch-input"
            />
            <button type="button" className="btn-primary" onClick={handleAddKey}>
              Guardar Clave
            </button>
          </div>

          {/* Inspector de Clave Seleccionada */}
          {selectedKey && (
            <div className="ch-key-card">
              <span className="ch-meta-title">Detalles de Partición de Clave:</span>
              <div className="ch-key-detail">
                <strong>Clave:</strong> <code>{selectedKey}</code>
              </div>
              <div className="ch-key-detail">
                <strong>Nodo Primario:</strong>{' '}
                <span className="badge badge--brand">{ringRef.current.getNode(selectedKey)}</span>
              </div>
              <div className="ch-key-detail">
                <strong>Réplicas de Respaldo:</strong>{' '}
                <code>{ringRef.current.getReplicationNodes(selectedKey, 2).join(' ➔ ')}</code>
              </div>
            </div>
          )}

          {/* Comparativa de Migración */}
          {migrationImpact && (
            <div className="ch-migration-box">
              <span className="ch-meta-title">🚀 Impacto de Escalado (Añadir {nextCandidate}):</span>
              <div className="ch-migration-stats">
                <div>
                  <span className="ch-mig-label">Consistent Hashing:</span>
                  <span className="ch-mig-val ch-mig-val--good">
                    ~{migrationImpact.migrationPercent}% claves migradas ({migrationImpact.migratedKeysCount} de {snapshot.keys.length})
                  </span>
                </div>
                <div>
                  <span className="ch-mig-label">Modulo Hash (hash % N):</span>
                  <span className="ch-mig-val ch-mig-val--bad">
                    ~{Number(((snapshot.physicalNodes.length / (snapshot.physicalNodes.length + 1)) * 100).toFixed(1))}% claves migradas (Tormenta de Caché)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
