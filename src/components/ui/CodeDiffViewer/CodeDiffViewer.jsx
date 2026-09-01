/**
 * @fileoverview Componente CodeDiffViewer — Comparador visual de diferencias de código side-by-side y unificado (Mejora 50).
 *
 * CARACTERÍSTICAS:
 * - Algoritmo LCS para comparación precisa línea por línea.
 * - Modo Unificado (+ verde / - rojo) y Modo Side-by-Side (doble columna).
 * - Indicadores numéricos de adiciones (+N) y eliminaciones (-M).
 * - Presets de refactorizaciones de código comunes.
 *
 * @module components/ui/CodeDiffViewer
 */
import { useState, useMemo } from 'react'
import { DIFF_PRESETS, computeLineDiff } from '../../../utils/diffHelper'
import './CodeDiffViewer.css'

function CodeDiffViewer() {
  const [selectedPresetId, setSelectedPresetId] = useState(DIFF_PRESETS[0].id)
  const [oldCode, setOldCode] = useState(DIFF_PRESETS[0].oldCode)
  const [newCode, setNewCode] = useState(DIFF_PRESETS[0].newCode)
  const [viewMode, setViewMode] = useState('unified') // 'unified' | 'split'

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id)
    setOldCode(preset.oldCode)
    setNewCode(preset.newCode)
  }

  const { diffLines, additions, deletions } = useMemo(() => {
    return computeLineDiff(oldCode, newCode)
  }, [oldCode, newCode])

  return (
    <section className="diff-viewer-section" aria-label="Comparador de diferencias de código">
      <div className="diff-header">
        <div>
          <h2 className="diff-title">🔍 Comparador Visual de Código (Diff Viewer)</h2>
          <p className="diff-subtitle">
            Visualiza y compara diferencias entre versiones de código con cálculo LCS y vista unificada o en paralelo.
          </p>
        </div>

        {/* Presets y Modo de Vista */}
        <div className="diff-controls-bar">
          <div className="diff-presets">
            {DIFF_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`preset-chip${selectedPresetId === p.id ? ' preset-chip--active' : ''}`}
                onClick={() => handleSelectPreset(p)}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="diff-view-modes">
            <button
              type="button"
              className={`pill-btn${viewMode === 'unified' ? ' pill-btn--active' : ''}`}
              onClick={() => setViewMode('unified')}
            >
              Unificada (Unified)
            </button>
            <button
              type="button"
              className={`pill-btn${viewMode === 'split' ? ' pill-btn--active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              Paralela (Side-by-Side)
            </button>
          </div>
        </div>
      </div>

      <div className="diff-container">
        {/* Métricas de Cambio */}
        <div className="diff-stats-bar">
          <div className="diff-stats-badges">
            <span className="diff-stat-add">+{additions} líneas añadidas</span>
            <span className="diff-stat-del">-{deletions} líneas eliminadas</span>
            <span className="diff-stat-total">{diffLines.length} líneas totales analizadas</span>
          </div>
        </div>

        {/* Visor de Diferencias */}
        {viewMode === 'unified' ? (
          <div className="diff-unified-box">
            <table className="diff-table">
              <tbody>
                {diffLines.map((line, idx) => (
                  <tr key={idx} className={`diff-row diff-row--${line.type}`}>
                    <td className="diff-ln diff-ln-old">{line.oldLineNum || ''}</td>
                    <td className="diff-ln diff-ln-new">{line.newLineNum || ''}</td>
                    <td className="diff-sign">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </td>
                    <td className="diff-code">
                      <code>{line.text}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Modo Side-by-Side */
          <div className="diff-split-grid">
            <div className="diff-split-pane">
              <div className="diff-split-title">Versión Original (Anterior)</div>
              <textarea
                className="diff-split-textarea"
                rows={10}
                value={oldCode}
                onChange={(e) => setOldCode(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div className="diff-split-pane">
              <div className="diff-split-title">Versión Modificada (Nueva)</div>
              <textarea
                className="diff-split-textarea"
                rows={10}
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                spellCheck={false}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default CodeDiffViewer
