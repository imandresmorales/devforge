/**
 * @fileoverview Componente SEOAuditorLive — Auditor de Salud SEO y Diagnóstico de Indexabilidad en Vivo.
 *
 * Ejecuta una auditoría en tiempo real del documento HTML actual, evaluando la jerarquía de encabezados (H1),
 * metadatos OpenGraph, Canonical, longitud de título y atributos alt en imágenes.
 *
 * @module components/ui/SEOAuditorLive
 */

import { useState, useEffect } from 'react'
import { auditSeoHealth } from '../../../utils/seoAuditorEngine'
import './SEOAuditorLive.css'

export default function SEOAuditorLive() {
  const [report, setReport] = useState(() => auditSeoHealth())
  const [isAuditing, setIsAuditing] = useState(false)

  const handleRunAudit = () => {
    setIsAuditing(true)
    setTimeout(() => {
      setReport(auditSeoHealth())
      setIsAuditing(false)
    }, 200)
  }

  useEffect(() => {
    handleRunAudit()
  }, [])

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return '#34d399'
      case 'B':
        return '#60a5fa'
      case 'C':
        return '#fbbf24'
      default:
        return '#f87171'
    }
  }

  return (
    <div className="seo-auditor-card" role="region" aria-label="Auditor de Salud SEO en Vivo">
      <div className="seo-auditor-card__header">
        <div className="seo-auditor-card__badge">⚡ Mejora 112</div>
        <h3 className="seo-auditor-card__title">Auditor de Salud SEO en Vivo & Google Search Readiness</h3>
        <p className="seo-auditor-card__subtitle">
          Audita el DOM activo de DevForge en tiempo real para verificar el cumplimiento de Google Search Essentials y directrices semánticas.
        </p>
      </div>

      {/* Grid de Puntuación Global */}
      <div className="seo-auditor-score-banner">
        <div className="seo-auditor-score-box">
          <span className="seo-auditor-score-value text-gradient">{report.score}</span>
          <span className="seo-auditor-score-max">/ 100</span>
          <span className="seo-auditor-grade-badge" style={{ backgroundColor: `${getGradeColor(report.grade)}20`, color: getGradeColor(report.grade), borderColor: `${getGradeColor(report.grade)}50` }}>
            Grado {report.grade}
          </span>
        </div>

        <div className="seo-auditor-summary-stats">
          <div className="seo-auditor-stat-pill seo-auditor-stat-pill--pass">
            <span>✅ {report.passedCount} Aprobados</span>
          </div>
          <div className="seo-auditor-stat-pill seo-auditor-stat-pill--warn">
            <span>🟡 {report.warningCount} Advertencias</span>
          </div>
          <div className="seo-auditor-stat-pill seo-auditor-stat-pill--fail">
            <span>🔴 {report.errorCount} Críticos</span>
          </div>

          <button
            type="button"
            className="seo-auditor-btn seo-auditor-btn--re-audit"
            onClick={handleRunAudit}
            disabled={isAuditing}
          >
            {isAuditing ? '⏳ Auditando...' : '🔄 Re-ejecutar Auditoría'}
          </button>
        </div>
      </div>

      {/* Lista de Verificaciones */}
      <div className="seo-auditor-checks-list">
        {report.checks.map((check) => (
          <div key={check.id} className={`seo-auditor-check-item seo-auditor-check-item--${check.status}`}>
            <div className="seo-auditor-check-item__status-icon">
              {check.status === 'pass' ? '✅' : check.status === 'warn' ? '🟡' : '🔴'}
            </div>
            <div className="seo-auditor-check-item__body">
              <div className="seo-auditor-check-item__title-row">
                <strong className="seo-auditor-check-item__name">{check.name}</strong>
                <span className="seo-auditor-check-item__category-badge">{check.category.toUpperCase()}</span>
              </div>
              <p className="seo-auditor-check-item__msg">{check.message}</p>
            </div>
            <div className="seo-auditor-check-item__weight">
              <span>{check.status === 'pass' ? `+${check.scoreWeight} pts` : check.status === 'warn' ? `+${Math.floor(check.scoreWeight * 0.5)} pts` : '0 pts'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
