/**
 * @fileoverview Componente UI para el Monitor y Auditor de Fugas de Información PII y DLP (Mejora 83).
 *
 * Muestra:
 * - Inspector de Fugas de Información en tiempo real con Presets de prueba.
 * - Validación matemática de Checksums (Luhn para Tarjetas de Crédito, Módulo 23 para DNI).
 * - Selector de Política de Enmascaramiento (Máscara Parcial, Redacción Total, Hash Criptográfico).
 * - Comparativa en paralelo: Payload Original (Inseguro) vs Sanitizado (Cumple GDPR / PCI-DSS).
 * - Desglose de Hallazgos por Nivel de Severidad (CRITICAL, HIGH, MEDIUM).
 *
 * @module components/ui/DLPScanner/DLPScanner
 */
import { useState, useMemo } from 'react'
import { scanAndSanitize, MASK_STRATEGIES, SEVERITY_LEVELS } from '../../../utils/dlpScanner'
import './DLPScanner.css'

const SAMPLE_PRESETS = [
  {
    id: 'pci_leak',
    label: '💳 Fuga PCI-DSS (Tarjetas & CVV)',
    text: `POST /api/v1/checkout HTTP/1.1
Host: api.devforge.app
Content-Type: application/json

{
  "customer": "Mario Casas",
  "card_number": "4532-0151-1283-0366",
  "expiry": "12/28",
  "email": "mario.casas@netflix.com"
}`,
  },
  {
    id: 'dev_secrets_leak',
    label: '🔑 Fuga de API Keys & Tokens JWT',
    text: `[DEBUG LOG 2026-09-11 14:32:01]
Configurando conexión con proveedores externos:
OPENAI_API_KEY=sk-proj-9876543210abcdef9876543210abcdef98
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AUTH_HEADER=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`,
  },
  {
    id: 'gdpr_pii_leak',
    label: '📋 Fuga GDPR (DNI & SSN)',
    text: `Reporte de Empleados RRHH:
- Nombre: Carmen Ruiz | DNI: 12345678Z | Email: carmen.ruiz@santander.es
- Contratista US: John Smith | SSN: 123-45-6789 | Email: jsmith@remote.io`,
  },
  {
    id: 'clean_payload',
    label: '✨ Payload Limpio (100% Compliant)',
    text: `GET /api/v1/public/catalog?category=books&limit=10 HTTP/1.1
Host: devforge.app
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)

{"status": "ok", "items": [{"id": 1, "title": "Clean Code Handbook"}]}`,
  },
]

export default function DLPScanner() {
  const [selectedPreset, setSelectedPreset] = useState('pci_leak')
  const [inputText, setInputText] = useState(SAMPLE_PRESETS[0].text)
  const [strategy, setStrategy] = useState(MASK_STRATEGIES.PARTIAL)

  const scanResult = useMemo(() => {
    return scanAndSanitize(inputText, { strategy })
  }, [inputText, strategy])

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id)
    setInputText(preset.text)
  }

  const criticalCount = scanResult.findings.filter((f) => f.severity === SEVERITY_LEVELS.CRITICAL).length
  const highCount = scanResult.findings.filter((f) => f.severity === SEVERITY_LEVELS.HIGH).length
  const mediumCount = scanResult.findings.filter((f) => f.severity === SEVERITY_LEVELS.MEDIUM).length

  return (
    <section className="dlp-scanner" aria-labelledby="dlp-title">
      {/* ── Header ── */}
      <div className="dlp-header">
        <div>
          <span className="badge badge--brand">Ciberseguridad & Compliance (GDPR / PCI-DSS)</span>
          <h2 id="dlp-title" className="dlp-title">
            Monitor y Auditor de Fugas de Información PII & DLP
          </h2>
          <p className="dlp-desc">
            Escanea, detecta y sanitiza en tiempo real datos sensibles (Tarjetas de crédito con algoritmo de Luhn,
            API Keys de OpenAI/AWS, tokens JWT y documentos de identidad).
          </p>
        </div>

        {/* Status Score */}
        <div className="dlp-compliance-card">
          <div className="dlp-compliance-head">
            <span>Estado de Cumplimiento:</span>
            <span className={`badge badge--${scanResult.isCompliant ? 'success' : 'danger'}`}>
              {scanResult.isCompliant ? '🛡️ COMPLIANT (0 FUGAS)' : '🚨 NO COMPLIANT'}
            </span>
          </div>
          <div className="dlp-risk-bar-container">
            <span className="dlp-risk-label">Riesgo de Fuga: <strong>{scanResult.riskScore}%</strong></span>
            <div className="dlp-risk-bar">
              <div
                className="dlp-risk-fill"
                style={{
                  width: `${scanResult.riskScore}%`,
                  background: scanResult.riskScore > 50 ? '#ef4444' : scanResult.riskScore > 0 ? '#f59e0b' : '#10b981',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Presets Selector ── */}
      <div className="dlp-presets-row">
        <span className="dlp-presets-label">Cargar Payload de Prueba:</span>
        <div className="dlp-preset-buttons">
          {SAMPLE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`btn-xs ${selectedPreset === p.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSelectPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Selector de Estrategia ── */}
      <div className="dlp-strategy-row">
        <span className="dlp-strategy-label">Política de Enmascaramiento:</span>
        <div className="dlp-strategy-buttons">
          <button
            type="button"
            className={`btn-xs ${strategy === MASK_STRATEGIES.PARTIAL ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStrategy(MASK_STRATEGIES.PARTIAL)}
          >
            🛡️ Máscara Parcial (ej. **** 0366)
          </button>
          <button
            type="button"
            className={`btn-xs ${strategy === MASK_STRATEGIES.REDACT ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStrategy(MASK_STRATEGIES.REDACT)}
          >
            🚫 Redacción Total ([REDACTED])
          </button>
        </div>
      </div>

      {/* ── Comparativa Side-by-Side ── */}
      <div className="dlp-comparison-grid">
        {/* Editor Original */}
        <div className="dlp-panel">
          <div className="dlp-panel-head">
            <span className="dlp-panel-title">Payload Original (Inseguro)</span>
            <small>{inputText.length} caracteres</small>
          </div>
          <textarea
            className="dlp-textarea"
            rows={8}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value)
              setSelectedPreset('custom')
            }}
            placeholder="Pega aquí el JSON, log o payload a inspeccionar..."
          />
        </div>

        {/* Salida Sanitizada */}
        <div className="dlp-panel">
          <div className="dlp-panel-head">
            <span className="dlp-panel-title" style={{ color: '#4ade80' }}>
              Payload Sanitizado (DLP Sanitized)
            </span>
            <span className="badge badge--success">Safe for Logs/Analytics</span>
          </div>
          <pre className="dlp-sanitized-output">{scanResult.sanitizedText}</pre>
        </div>
      </div>

      {/* ── Resumen de Hallazgos y Severidades ── */}
      <div className="dlp-findings-section">
        <div className="dlp-findings-header">
          <h4>Vulnerabilidades y Fugas Detectadas ({scanResult.findings.length})</h4>
          <div className="dlp-severity-tags">
            <span className="badge badge--danger">CRITICAL: {criticalCount}</span>
            <span className="badge badge--warning">HIGH: {highCount}</span>
            <span className="badge badge--neutral">MEDIUM: {mediumCount}</span>
          </div>
        </div>

        {scanResult.findings.length === 0 ? (
          <div className="dlp-empty-findings">
            <span>✅ No se detectó ninguna fuga de información PII ni credenciales en el texto analizado.</span>
          </div>
        ) : (
          <div className="dlp-findings-table-wrap">
            <table className="dlp-table">
              <thead>
                <tr>
                  <th>Tipo de Fuga</th>
                  <th>Severidad</th>
                  <th>Valor Detectado</th>
                  <th>Valor Sanitizado</th>
                </tr>
              </thead>
              <tbody>
                {scanResult.findings.map((f, i) => (
                  <tr key={i}>
                    <td><strong>{f.ruleName}</strong></td>
                    <td>
                      <span className={`badge badge--${f.severity === SEVERITY_LEVELS.CRITICAL ? 'danger' : f.severity === SEVERITY_LEVELS.HIGH ? 'warning' : 'neutral'}`}>
                        {f.severity}
                      </span>
                    </td>
                    <td><code className="dlp-raw-val">{f.rawValue}</code></td>
                    <td><code className="dlp-masked-val">{f.maskedValue}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
