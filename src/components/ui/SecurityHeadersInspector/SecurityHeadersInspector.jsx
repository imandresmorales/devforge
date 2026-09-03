/**
 * @fileoverview Componente SecurityHeadersInspector — Auditor interactivo de cabeceras de seguridad HTTP OWASP (Mejora 53).
 *
 * CARACTERÍSTICAS:
 * - Indicador de grado visual (A+, A, B, C, D, F) y porcentaje de seguridad (0 a 100%).
 * - Presets predefinidos y editor interactivo para auditar cabeceras personalizadas.
 * - Desglose de vulnerabilidades detectadas (XSS, Clickjacking, MIME Sniffing, MitM).
 * - Generador de snippets de configuración para Express (Helmet), Next.js y Nginx.
 *
 * @module components/ui/SecurityHeadersInspector
 */
import { useState, useMemo } from 'react'
import {
  PRESET_HEADER_CONFIGS,
  auditSecurityHeaders,
  generateServerConfigSnippet,
} from '../../../utils/securityHeaders'
import { useToast } from '../../../context/ToastContext'
import './SecurityHeadersInspector.css'

function SecurityHeadersInspector() {
  const [selectedPresetId, setSelectedPresetId] = useState('devforge_secure')
  const [customHeadersText, setCustomHeadersText] = useState(
    JSON.stringify(PRESET_HEADER_CONFIGS[0].headers, null, 2)
  )
  const [activeSnippetTab, setActiveSnippetTab] = useState('express')
  const { addToast } = useToast()

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id)
    setCustomHeadersText(JSON.stringify(preset.headers, null, 2))
  }

  const auditReport = useMemo(() => {
    try {
      const parsed = JSON.parse(customHeadersText)
      return auditSecurityHeaders(parsed)
    } catch {
      return auditSecurityHeaders({})
    }
  }, [customHeadersText])

  const snippetCode = useMemo(() => {
    return generateServerConfigSnippet(activeSnippetTab)
  }, [activeSnippetTab])

  const handleCopySnippet = () => {
    navigator.clipboard?.writeText(snippetCode)
    addToast({
      type: 'success',
      title: 'Snippet Copiado',
      message: `Configuración para ${activeSnippetTab.toUpperCase()} copiada al portapapeles.`,
    })
  }

  return (
    <section className="headers-inspector-section" aria-label="Auditor de cabeceras HTTP de seguridad">
      <div className="headers-inspector-header">
        <div>
          <h2 className="headers-inspector-title">🛡️ Auditor de Cabeceras de Seguridad HTTP (OWASP)</h2>
          <p className="headers-inspector-subtitle">
            Audita las cabeceras de respuesta HTTP de tu aplicación web, evalúa defensas contra XSS y Clickjacking, y exporta configuraciones seguras.
          </p>
        </div>

        {/* Selector de Presets */}
        <div className="headers-presets-bar">
          {PRESET_HEADER_CONFIGS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-chip${selectedPresetId === preset.id ? ' preset-chip--active' : ''}`}
              onClick={() => handleSelectPreset(preset)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="headers-inspector-grid">
        {/* Panel Izquierdo: Grado y Editor JSON de Cabeceras */}
        <div className="headers-left-pane">
          <div className="headers-score-card">
            <div className={`headers-grade-badge headers-grade-badge--${auditReport.grade.replace('+', 'plus').toLowerCase()}`}>
              {auditReport.grade}
            </div>
            <div className="headers-score-details">
              <span className="headers-score-val">{auditReport.score} / 100 pts</span>
              <span className="headers-score-sub">
                {auditReport.secureCount} seguras · {auditReport.weakCount} débiles · {auditReport.missingCount} ausentes
              </span>
            </div>
          </div>

          <div className="headers-editor-card">
            <div className="headers-editor-top">
              <span className="headers-editor-title">Cabeceras HTTP en Evaluación (JSON):</span>
            </div>
            <textarea
              className="headers-textarea"
              rows={12}
              value={customHeadersText}
              onChange={(e) => {
                setCustomHeadersText(e.target.value)
                setSelectedPresetId('')
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Panel Derecho: Lista de Auditoría de Cabeceras */}
        <div className="headers-audit-card">
          <h3 className="headers-audit-heading">Desglose de Cabeceras Analizadas</h3>
          <div className="headers-audit-list">
            {auditReport.results.map((item) => (
              <div
                key={item.key}
                className={`headers-rule-item headers-rule-item--${item.status.toLowerCase()}`}
              >
                <div className="headers-rule-top">
                  <span className="headers-rule-name">{item.name}</span>
                  <span
                    className={`badge badge--${
                      item.status === 'SECURE' ? 'success' : item.status === 'WEAK' ? 'warning' : 'error'
                    }`}
                  >
                    {item.status === 'SECURE' ? '✅ Segura' : item.status === 'WEAK' ? '⚠️ Débil' : '❌ Ausente'}
                  </span>
                </div>
                <div className="headers-rule-desc">{item.description}</div>
                <div className="headers-rule-reason">
                  <small><strong>Diagnóstico:</strong> {item.reason}</small>
                </div>
                {item.currentValue && (
                  <div className="headers-rule-curr">
                    <code>{item.key}: {item.currentValue}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exportador de Snippets para Servidores */}
      <div className="headers-snippets-card">
        <div className="headers-snippets-top">
          <div className="headers-snippets-tabs">
            <button
              type="button"
              className={`pill-btn${activeSnippetTab === 'express' ? ' pill-btn--active' : ''}`}
              onClick={() => setActiveSnippetTab('express')}
            >
              Express (Helmet)
            </button>
            <button
              type="button"
              className={`pill-btn${activeSnippetTab === 'nginx' ? ' pill-btn--active' : ''}`}
              onClick={() => setActiveSnippetTab('nginx')}
            >
              Nginx (.conf)
            </button>
            <button
              type="button"
              className={`pill-btn${activeSnippetTab === 'nextjs' ? ' pill-btn--active' : ''}`}
              onClick={() => setActiveSnippetTab('nextjs')}
            >
              Next.js (next.config)
            </button>
          </div>

          <button type="button" className="btn-secondary headers-copy-btn" onClick={handleCopySnippet}>
            📋 Copiar Configuración
          </button>
        </div>

        <pre className="headers-snippet-code">
          <code>{snippetCode}</code>
        </pre>
      </div>
    </section>
  )
}

export default SecurityHeadersInspector
