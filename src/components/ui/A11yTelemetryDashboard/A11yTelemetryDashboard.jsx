/**
 * @fileoverview Componente A11yTelemetryDashboard — Centro de Comando y Telemetría de Accesibilidad WCAG AAA.
 *
 * Muestra el Scorecard Global de Accesibilidad consolidando los 6 pilares evaluados en tiempo real,
 * el estado de certificación WCAG 2.2 Nivel AAA y permite la exportación estructurada del informe de conformidad.
 *
 * @module components/ui/A11yTelemetryDashboard
 */

import { useState } from 'react'
import { generateA11yTelemetry, exportA11yReportJson } from '../../../utils/a11yTelemetryEngine'
import './A11yTelemetryDashboard.css'

export default function A11yTelemetryDashboard() {
  const [telemetry, setTelemetry] = useState(() => generateA11yTelemetry())
  const [copied, setCopied] = useState(false)

  const handleCopyReport = () => {
    const json = exportA11yReportJson(telemetry)
    navigator.clipboard?.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefresh = () => {
    setTelemetry(generateA11yTelemetry())
  }

  return (
    <div className="a11y-dashboard-card" role="region" aria-label="Centro de Comando de Accesibilidad WCAG AAA">
      <div className="a11y-dashboard-card__header">
        <div className="a11y-dashboard-card__badge">⚡ Mejora 120 (Hito de Accesibilidad)</div>
        <h3 className="a11y-dashboard-card__title">Centro de Comando & Telemetría de Accesibilidad WCAG 2.2 AAA</h3>
        <p className="a11y-dashboard-card__subtitle">
          Consolida las métricas globales de los 6 pilares de accesibilidad de DevForge, certificando el cumplimiento total de los estándares internacionales de diseño universal.
        </p>
      </div>

      {/* Hero Scorecard */}
      <div className="a11y-scorecard-banner">
        <div className="a11y-scorecard-main">
          <span className="a11y-scorecard-value text-gradient">{telemetry.overallScore}%</span>
          <div className="a11y-scorecard-info">
            <span className="a11y-scorecard-badge">🏆 {telemetry.conformanceLevel}</span>
            <small className="a11y-scorecard-version">{telemetry.auditorVersion}</small>
          </div>
        </div>

        <div className="a11y-scorecard-actions">
          <button
            type="button"
            className="a11y-dash-btn a11y-dash-btn--refresh"
            onClick={handleRefresh}
          >
            🔄 Actualizar Telemetría
          </button>
          <button
            type="button"
            className="a11y-dash-btn a11y-dash-btn--export"
            onClick={handleCopyReport}
          >
            {copied ? '✅ Reporte JSON Copiado' : '📋 Exportar Scorecard JSON'}
          </button>
        </div>
      </div>

      {/* Grid de los 6 Pilares de Accesibilidad */}
      <div className="a11y-pillars-grid">
        {telemetry.pillars.map((pillar) => (
          <div key={pillar.id} className="a11y-pillar-card">
            <div className="a11y-pillar-header">
              <span className="a11y-pillar-icon" aria-hidden="true">{pillar.icon}</span>
              <div className="a11y-pillar-title-box">
                <span className="a11y-pillar-name">{pillar.name}</span>
                <span className="a11y-pillar-weight text-muted">Peso: {pillar.weight}%</span>
              </div>
              <span className="a11y-pillar-score font-mono font-bold text-success">{pillar.score}%</span>
            </div>

            {/* Barra de Progreso Accesible */}
            <div
              className="a11y-progress-bar"
              role="progressbar"
              aria-valuenow={pillar.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={pillar.name}
            >
              <div
                className="a11y-progress-fill"
                style={{ width: `${pillar.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
