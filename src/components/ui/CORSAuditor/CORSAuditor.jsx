/**
 * @fileoverview Componente UI para el Auditor de Seguridad CORS (Mejora 64).
 *
 * Muestra:
 * - Selector de presets de vulnerabilidad (Reflected Origin, Null Origin, Subdomain Bypass, Hardened).
 * - Editor interactivo de cabeceras HTTP de solicitud y respuesta CORS.
 * - Medidor de Riesgo OWASP (CRITICAL, HIGH, MEDIUM, SAFE) con desglose de hallazgos.
 * - Generador de Prueba de Concepto (PoC) de exfiltración de credenciales.
 * - Generador de configuraciones seguras para servidores Express.js y Nginx.
 *
 * @module components/ui/CORSAuditor/CORSAuditor
 */
import { useState, useMemo } from 'react'
import { auditCORSHeaders, CORS_PRESETS } from '../../../utils/corsAuditor'
import './CORSAuditor.css'

export default function CORSAuditor() {
  const [selectedPresetId, setSelectedPresetId] = useState(CORS_PRESETS[0].id)
  const [requestOrigin, setRequestOrigin] = useState(CORS_PRESETS[0].requestOrigin)
  const [targetOrigin, setTargetOrigin] = useState(CORS_PRESETS[0].targetOrigin)
  const [allowOrigin, setAllowOrigin] = useState(CORS_PRESETS[0].allowOrigin)
  const [allowCredentials, setAllowCredentials] = useState(CORS_PRESETS[0].allowCredentials)
  const [allowMethods, setAllowMethods] = useState(CORS_PRESETS[0].allowMethods)
  const [allowHeaders, setAllowHeaders] = useState(CORS_PRESETS[0].allowHeaders)
  const [maxAge, setMaxAge] = useState(CORS_PRESETS[0].maxAge)
  const [activeTab, setActiveTab] = useState('findings') // 'findings' | 'poc' | 'remediation'

  const handleSelectPreset = (e) => {
    const pId = e.target.value
    setSelectedPresetId(pId)
    const preset = CORS_PRESETS.find((p) => p.id === pId)
    if (preset) {
      setRequestOrigin(preset.requestOrigin)
      setTargetOrigin(preset.targetOrigin)
      setAllowOrigin(preset.allowOrigin)
      setAllowCredentials(preset.allowCredentials)
      setAllowMethods(preset.allowMethods)
      setAllowHeaders(preset.allowHeaders)
      setMaxAge(preset.maxAge)
    }
  }

  const auditResult = useMemo(() => {
    return auditCORSHeaders({
      requestOrigin,
      targetOrigin,
      allowOrigin,
      allowCredentials,
      allowMethods,
      allowHeaders,
      maxAge,
    })
  }, [requestOrigin, targetOrigin, allowOrigin, allowCredentials, allowMethods, allowHeaders, maxAge])

  return (
    <section className="cors-auditor" aria-labelledby="cors-title">
      <div className="cors-auditor__header">
        <div>
          <span className="badge badge--brand">Seguridad OWASP</span>
          <h2 id="cors-title" className="cors-auditor__title">
            Auditor de Seguridad CORS & Escáner de Misconfigurations
          </h2>
          <p className="cors-auditor__desc">
            Audita políticas de Cross-Origin Resource Sharing en busca de fugas de sesión,
            orígenes "null" inseguros, reflexión arbitraria y genera PoCs de explotación y parches de remediación.
          </p>
        </div>

        <div className="cors-preset-selector">
          <label htmlFor="cors-preset-select" className="cors-preset-label">
            Escenario de Prueba:
          </label>
          <select
            id="cors-preset-select"
            className="select cors-select"
            value={selectedPresetId}
            onChange={handleSelectPreset}
          >
            {CORS_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="cors-auditor__layout">
        {/* ── Panel de Configuración de Cabeceras ── */}
        <div className="cors-form-panel">
          <h3 className="cors-panel-title">Cabeceras HTTP de la Petición & Respuesta</h3>

          <div className="cors-field-group">
            <label className="cors-field-label">Request Origin (Header: Origin)</label>
            <input
              type="text"
              className="input cors-input"
              value={requestOrigin}
              onChange={(e) => setRequestOrigin(e.target.value)}
              placeholder="https://attacker.com o null"
            />
          </div>

          <div className="cors-field-group">
            <label className="cors-field-label">Target API Endpoint</label>
            <input
              type="text"
              className="input cors-input"
              value={targetOrigin}
              onChange={(e) => setTargetOrigin(e.target.value)}
              placeholder="https://api.devforge.io"
            />
          </div>

          <div className="cors-field-group">
            <label className="cors-field-label">Access-Control-Allow-Origin</label>
            <input
              type="text"
              className="input cors-input"
              value={allowOrigin}
              onChange={(e) => setAllowOrigin(e.target.value)}
              placeholder="* o https://trusted.com"
            />
          </div>

          <div className="cors-field-checkbox">
            <label className="cors-checkbox-label">
              <input
                type="checkbox"
                checked={allowCredentials}
                onChange={(e) => setAllowCredentials(e.target.checked)}
              />
              <span>Access-Control-Allow-Credentials: true (Permite Cookies / Auth)</span>
            </label>
          </div>

          <div className="cors-field-grid">
            <div className="cors-field-group">
              <label className="cors-field-label">Access-Control-Allow-Methods</label>
              <input
                type="text"
                className="input cors-input"
                value={allowMethods}
                onChange={(e) => setAllowMethods(e.target.value)}
              />
            </div>
            <div className="cors-field-group">
              <label className="cors-field-label">Access-Control-Max-Age (s)</label>
              <input
                type="number"
                className="input cors-input"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Panel de Resultados & Auditoría ── */}
        <div className="cors-results-panel">
          <div className="cors-risk-header">
            <div>
              <span className="cors-risk-caption">Evaluación de Riesgo OWASP</span>
              <div className="cors-risk-indicator">
                <span className={`cors-risk-badge cors-risk-badge--${auditResult.riskLevel.toLowerCase()}`}>
                  {auditResult.riskLevel === 'CRITICAL' && '🚨 CRÍTICO'}
                  {auditResult.riskLevel === 'HIGH' && '⚠️ ALTO'}
                  {auditResult.riskLevel === 'MEDIUM' && '⚡ MEDIO'}
                  {auditResult.riskLevel === 'LOW' && 'ℹ️ BAJO'}
                  {auditResult.riskLevel === 'SAFE' && '🛡️ SEGURO'}
                </span>
                <span className="cors-risk-score">Score: {auditResult.score}/100</span>
              </div>
            </div>

            <div className="cors-tabs-nav">
              <button
                type="button"
                className={`cors-tab-btn ${activeTab === 'findings' ? 'cors-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('findings')}
              >
                Vulnerabilidades ({auditResult.findings.length})
              </button>
              <button
                type="button"
                className={`cors-tab-btn ${activeTab === 'poc' ? 'cors-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('poc')}
              >
                PoC Exploit
              </button>
              <button
                type="button"
                className={`cors-tab-btn ${activeTab === 'remediation' ? 'cors-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('remediation')}
              >
                Parches de Servidor
              </button>
            </div>
          </div>

          <div className="cors-tab-content">
            {activeTab === 'findings' && (
              <div className="cors-findings-list">
                {auditResult.findings.length === 0 ? (
                  <div className="cors-findings-clean">
                    <span className="cors-clean-icon">✅</span>
                    <h4>No se detectaron vectores de ataque CORS evidentes.</h4>
                    <p>La política respeta las restricciones de origen único y rechaza orígenes arbitrarios.</p>
                  </div>
                ) : (
                  auditResult.findings.map((finding) => (
                    <div key={finding.id} className={`cors-finding-card cors-finding-card--${finding.severity.toLowerCase()}`}>
                      <div className="cors-finding-header">
                        <span className="cors-finding-severity">{finding.severity}</span>
                        <h4 className="cors-finding-title">{finding.title}</h4>
                      </div>
                      <p className="cors-finding-desc">{finding.description}</p>
                      <div className="cors-finding-impact">
                        <strong>Impacto:</strong> {finding.impact}
                      </div>
                      <div className="cors-finding-remed">
                        <strong>Remediación:</strong> {finding.remediation}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'poc' && (
              <div className="cors-poc-container">
                <div className="cors-poc-intro">
                  Prueba de Concepto (Exploit PoC) en JavaScript / Fetch para reproducir en laboratorios:
                </div>
                <pre className="cors-code-block">
                  <code>{auditResult.pocCode}</code>
                </pre>
              </div>
            )}

            {activeTab === 'remediation' && (
              <div className="cors-remediation-container">
                <div className="cors-remed-section">
                  <h4 className="cors-remed-title">🛡️ Configuración Segura en Express.js (Node.js)</h4>
                  <pre className="cors-code-block">
                    <code>{auditResult.serverConfigs.express}</code>
                  </pre>
                </div>
                <div className="cors-remed-section">
                  <h4 className="cors-remed-title">🛡️ Configuración Segura en Nginx Reverse Proxy</h4>
                  <pre className="cors-code-block">
                    <code>{auditResult.serverConfigs.nginx}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
