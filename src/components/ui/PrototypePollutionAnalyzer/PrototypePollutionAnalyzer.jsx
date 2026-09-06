/**
 * @fileoverview Componente UI para el Analizador y Mitigador de Prototype Pollution (Mejora 68).
 *
 * Muestra:
 * - Selector de payloads JSON de ataque (Bypass de Auth, constructor.prototype, DoS).
 * - Editor interactivo de JSON con análisis de riesgo en tiempo real (CRITICAL, HIGH, SAFE).
 * - Comparador de Vulnerabilidad: Merge Inseguro vs SafeDeepMerge.
 * - Guía de mitigación y mejores prácticas defensivas en Node.js y React.
 *
 * @module components/ui/PrototypePollutionAnalyzer/PrototypePollutionAnalyzer
 */
import { useState, useMemo } from 'react'
import {
  analyzePrototypePollution,
  safeDeepMerge,
  POLLUTION_PRESETS,
} from '../../../utils/prototypePollutionGuard'
import './PrototypePollutionAnalyzer.css'

export default function PrototypePollutionAnalyzer() {
  const [selectedPresetId, setSelectedPresetId] = useState(POLLUTION_PRESETS[0].id)
  const [jsonInput, setJsonInput] = useState(POLLUTION_PRESETS[0].payload)
  const [activeTab, setActiveTab] = useState('analysis') // 'analysis' | 'comparison' | 'hardening'

  const handleSelectPreset = (e) => {
    const pId = e.target.value
    setSelectedPresetId(pId)
    const preset = POLLUTION_PRESETS.find((p) => p.id === pId)
    if (preset) {
      setJsonInput(preset.payload)
    }
  }

  const analysis = useMemo(() => {
    return analyzePrototypePollution(jsonInput)
  }, [jsonInput])

  const sanitizedResult = useMemo(() => {
    if (!analysis.parsedObject) return null
    const target = {}
    safeDeepMerge(target, analysis.parsedObject)
    return JSON.stringify(target, null, 2)
  }, [analysis])

  return (
    <section className="proto-analyzer" aria-labelledby="proto-title">
      <div className="proto-analyzer__header">
        <div>
          <span className="badge badge--brand">Seguridad JavaScript & CWE-1321</span>
          <h2 id="proto-title" className="proto-analyzer__title">
            Analizador y Mitigador de Prototype Pollution (Anti-Pollution Guard)
          </h2>
          <p className="proto-analyzer__desc">
            Audita objetos y estructuras JSON en busca de inyecciones a la cadena de prototipos (`__proto__`, `constructor.prototype`).
            Demuestra cómo sanitizar recursivamente datos no confiables para evitar escalada de privilegios y bypass de autenticación.
          </p>
        </div>

        <div className="proto-preset-selector">
          <label htmlFor="proto-preset-select" className="proto-preset-label">
            Vector de Prueba:
          </label>
          <select
            id="proto-preset-select"
            className="select proto-select"
            value={selectedPresetId}
            onChange={handleSelectPreset}
          >
            {POLLUTION_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="proto-layout">
        {/* ── Editor de JSON ── */}
        <div className="proto-editor-panel">
          <div className="proto-panel-header">
            <h3 className="proto-panel-title">Payload JSON de Entrada</h3>
            <span className="proto-editor-hint">Edita el JSON para auditar en tiempo real</span>
          </div>

          <textarea
            className="textarea proto-textarea"
            rows={10}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* ── Panel de Análisis y Resultados ── */}
        <div className="proto-results-panel">
          <div className="proto-results-top">
            <div className="proto-risk-indicator">
              <span className={`proto-risk-badge proto-risk-badge--${analysis.riskLevel.toLowerCase()}`}>
                {analysis.riskLevel === 'CRITICAL' && '🚨 CRÍTICO: PROTOTYPE POLLUTION'}
                {analysis.riskLevel === 'HIGH' && '⚠️ ALTO RIESGO'}
                {analysis.riskLevel === 'SAFE' && '🛡️ SEGURO / SANITIZADO'}
              </span>
              <span className="proto-score-label">Severidad: {analysis.score}/100</span>
            </div>

            <div className="proto-tabs-nav">
              <button
                type="button"
                className={`proto-tab-btn ${activeTab === 'analysis' ? 'proto-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('analysis')}
              >
                Vulnerabilidades ({analysis.findings.length})
              </button>
              <button
                type="button"
                className={`proto-tab-btn ${activeTab === 'comparison' ? 'proto-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('comparison')}
              >
                Merge Seguro
              </button>
              <button
                type="button"
                className={`proto-tab-btn ${activeTab === 'hardening' ? 'proto-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('hardening')}
              >
                Hardening
              </button>
            </div>
          </div>

          <div className="proto-tab-body">
            {activeTab === 'analysis' && (
              <div className="proto-findings-list">
                {analysis.error && (
                  <div className="proto-error-box">
                    <span>⚠️ {analysis.error}</span>
                  </div>
                )}

                {analysis.findings.length === 0 && !analysis.error && (
                  <div className="proto-clean-box">
                    <span className="proto-clean-icon">✅</span>
                    <h4>No se detectaron claves prototípicas peligrosas.</h4>
                    <p>El objeto no intenta modificar la cadena de herencia de JavaScript.</p>
                  </div>
                )}

                {analysis.findings.map((f, idx) => (
                  <div key={idx} className={`proto-finding-card proto-finding-card--${f.severity.toLowerCase()}`}>
                    <div className="proto-finding-head">
                      <span className="proto-finding-badge">{f.severity}</span>
                      <code className="proto-finding-key">{f.path}</code>
                    </div>
                    <p className="proto-finding-desc">{f.description}</p>
                    <div className="proto-finding-impact">
                      <strong>Impacto de Seguridad:</strong> {f.impact}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'comparison' && (
              <div className="proto-comparison-view">
                <div className="proto-comparison-col">
                  <h4 className="proto-comp-title">🛡️ Resultado tras SafeDeepMerge:</h4>
                  <pre className="proto-code-block">
                    <code>{sanitizedResult || '// Sin datos válidos'}</code>
                  </pre>
                  <p className="proto-comp-note">
                    Las claves prohibidas (`__proto__`, `constructor`) fueron descartadas automáticamente.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'hardening' && (
              <div className="proto-hardening-view">
                <h4 className="proto-hard-title">🛡️ Estrategias de Protección en Producción</h4>
                <div className="proto-hard-list">
                  <div className="proto-hard-item">
                    <strong>1. Congelar Object.prototype en el arranque:</strong>
                    <code>Object.freeze(Object.prototype);</code>
                  </div>
                  <div className="proto-hard-item">
                    <strong>2. Usar objetos sin prototipo como diccionarios:</strong>
                    <code>const safeDict = Object.create(null); // o new Map()</code>
                  </div>
                  <div className="proto-hard-item">
                    <strong>3. Flag nativo de Node.js (v12+):</strong>
                    <code>node --disable-proto=delete app.js</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
