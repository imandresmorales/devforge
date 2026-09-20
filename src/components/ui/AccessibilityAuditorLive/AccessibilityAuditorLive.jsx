/**
 * @fileoverview Componente AccessibilityAuditorLive — Auditor de Accesibilidad WCAG 2.1/2.2 AAA en Vivo.
 *
 * Realiza una inspección profunda del DOM activo de la aplicación, evaluando etiquetas de formulario,
 * nombres accesibles, landmarks semánticos, tabindex y enlaces de salto con visualizador de reglas y sugerencias de remediación.
 *
 * @module components/ui/AccessibilityAuditorLive
 */

import { useState, useEffect } from 'react'
import { auditDomAccessibility } from '../../../utils/accessibilityAuditorEngine'
import './AccessibilityAuditorLive.css'

export default function AccessibilityAuditorLive() {
  const [report, setReport] = useState(() => auditDomAccessibility())
  const [isAuditing, setIsAuditing] = useState(false)

  const handleRunAudit = () => {
    setIsAuditing(true)
    setTimeout(() => {
      setReport(auditDomAccessibility())
      setIsAuditing(false)
    }, 250)
  }

  useEffect(() => {
    handleRunAudit()
  }, [])

  return (
    <div className="a11y-auditor-card" role="region" aria-label="Auditor de Accesibilidad WCAG AAA">
      <div className="a11y-auditor-card__header">
        <div className="a11y-auditor-card__badge">⚡ Mejora 118</div>
        <h3 className="a11y-auditor-card__title">Auditor de Accesibilidad Automatizado en Vivo (WCAG AAA)</h3>
        <p className="a11y-auditor-card__subtitle">
          Verifica en tiempo real el cumplimiento de las Pautas de Accesibilidad para el Contenido Web (WCAG 2.1/2.2) evaluando formularios, enlaces interactivos y estructura semántica.
        </p>
      </div>

      {/* Score Banner */}
      <div className="a11y-auditor-score-banner">
        <div className="a11y-auditor-score-box">
          <span className="a11y-auditor-score-value text-gradient">{report.score}</span>
          <span className="a11y-auditor-score-max">/ 100</span>
          <span className={`a11y-auditor-grade-badge a11y-auditor-grade-badge--${report.grade.toLowerCase()}`}>
            Grado {report.grade}
          </span>
        </div>

        <div className="a11y-auditor-summary-stats">
          <div className="a11y-auditor-stat-pill a11y-auditor-stat-pill--pass">
            <span>✅ {report.passedCount} Cumplidos</span>
          </div>
          <div className="a11y-auditor-stat-pill a11y-auditor-stat-pill--warn">
            <span>🟡 {report.warningCount} Advertencias</span>
          </div>
          <div className="a11y-auditor-stat-pill a11y-auditor-stat-pill--fail">
            <span>🔴 {report.errorCount} Críticos</span>
          </div>

          <button
            type="button"
            className="a11y-auditor-btn a11y-auditor-btn--re-audit"
            onClick={handleRunAudit}
            disabled={isAuditing}
          >
            {isAuditing ? '⏳ Auditando...' : '🔄 Re-ejecutar Auditoría DOM'}
          </button>
        </div>
      </div>

      {/* Lista de Reglas Auditadas */}
      <div className="a11y-auditor-rules-list">
        {report.rules.map((rule) => (
          <div key={rule.id} className={`a11y-auditor-rule-item a11y-auditor-rule-item--${rule.status}`}>
            <div className="a11y-auditor-rule-icon">
              {rule.status === 'pass' ? '✅' : rule.status === 'warn' ? '🟡' : '🔴'}
            </div>
            <div className="a11y-auditor-rule-body">
              <div className="a11y-auditor-rule-title-row">
                <strong className="a11y-auditor-rule-name">{rule.name}</strong>
                <span className="a11y-auditor-rule-criterion">{rule.wcagCriterion}</span>
              </div>
              <p className="a11y-auditor-rule-msg">{rule.message}</p>
              {rule.status !== 'pass' && (
                <div className="a11y-auditor-rule-remediation">
                  <strong>💡 Remediación:</strong> {rule.remediation}
                </div>
              )}
            </div>
            <div className="a11y-auditor-rule-weight">
              <span>{rule.status === 'pass' ? `+${rule.scoreWeight} pts` : rule.status === 'warn' ? `+${Math.floor(rule.scoreWeight * 0.5)} pts` : '0 pts'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
