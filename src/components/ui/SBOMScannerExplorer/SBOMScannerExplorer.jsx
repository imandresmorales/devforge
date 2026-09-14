/**
 * @fileoverview Componente SBOMScannerExplorer — Escáner de Dependencias y Generador SBOM (Mejora 89).
 *
 * Visualizador interactivo de riesgos en Supply Chain, análisis de CVEs/CVSS,
 * auditoría de licencias Copyleft y exportación en formatos CycloneDX v1.5 y SPDX v2.3.
 *
 * @module components/ui/SBOMScannerExplorer
 */
import { useState, useMemo } from 'react'
import {
  scanDependencies,
  generateCycloneDXSbom,
  generateSpdxTagValueSbom,
  SAMPLE_PROJECTS,
} from '../../../utils/sbomScanner'
import './SBOMScannerExplorer.css'

export default function SBOMScannerExplorer() {
  const [selectedKey, setSelectedKey] = useState('DEVFORGE_PROD')
  const [activeTab, setActiveTab] = useState('vulns') // 'vulns' | 'licenses' | 'cyclonedx' | 'spdx' | 'standards'

  const currentProject = SAMPLE_PROJECTS[selectedKey]

  const scanReport = useMemo(() => {
    return scanDependencies(currentProject)
  }, [currentProject])

  const cycloneDxJson = useMemo(() => {
    return JSON.stringify(generateCycloneDXSbom(currentProject), null, 2)
  }, [currentProject])

  const spdxText = useMemo(() => {
    return generateSpdxTagValueSbom(currentProject)
  }, [currentProject])

  return (
    <section className="sbom-explorer" aria-labelledby="sbom-title">
      {/* ── Encabezado ── */}
      <div className="sbom-explorer__header">
        <div className="sbom-explorer__title-row">
          <h2 id="sbom-title" className="sbom-explorer__title">
            <span>📦</span> Escáner de Dependencias & Generador SBOM (Supply Chain)
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span className="badge badge--brand">Mejora 89</span>
            <span className="badge badge--success">CycloneDX v1.5</span>
            <span className="badge badge--neutral">SPDX v2.3</span>
            <span className="badge badge--warning">NIST SSDF / EO 14028</span>
          </div>
        </div>
        <p className="sbom-explorer__desc">
          Auditoría de seguridad en la <strong>Cadena de Suministro de Software (Supply Chain)</strong>.
          Genera manifiestos SBOM para trazabilidad de componentes, detecta vulnerabilidades <strong>CVE conocidas</strong>
          y audita riesgos legales de licenciamiento restrictivo (Copyleft vs Permisivas).
        </p>
      </div>

      {/* ── Selector de Proyecto ── */}
      <div className="sbom-switcher">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Seleccionar Manifiesto:
          </label>
          <select
            className="sbom-select"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            <option value="DEVFORGE_PROD">🟢 DevForge (Producción — Conforme 100%)</option>
            <option value="LEGACY_VULNERABLE">🔴 Legacy Microservice (Vulnerable a CVEs y Copyleft)</option>
          </select>
        </div>

        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Versión: <strong>{currentProject.version}</strong> | Componentes: <strong>{scanReport.totalDependencies}</strong>
        </div>
      </div>

      {/* ── Puntuación de Seguridad & Métricas ── */}
      <div className="sbom-stats-grid">
        <div className="sbom-stat-card">
          <div
            className="sbom-stat-card__val"
            style={{
              color: scanReport.supplyChainScore >= 80 ? '#10b981' : scanReport.supplyChainScore >= 50 ? '#f59e0b' : '#ef4444',
            }}
          >
            {scanReport.supplyChainScore} / 100
          </div>
          <div className="sbom-stat-card__label">Puntuación Supply Chain</div>
        </div>

        <div className="sbom-stat-card">
          <div className="sbom-stat-card__val" style={{ color: scanReport.criticalCount > 0 ? '#ef4444' : '#10b981' }}>
            {scanReport.criticalCount}
          </div>
          <div className="sbom-stat-card__label">CVEs Críticos</div>
        </div>

        <div className="sbom-stat-card">
          <div className="sbom-stat-card__val" style={{ color: scanReport.highCount > 0 ? '#f97316' : '#10b981' }}>
            {scanReport.highCount}
          </div>
          <div className="sbom-stat-card__label">CVEs Altos</div>
        </div>

        <div className="sbom-stat-card">
          <div className="sbom-stat-card__val" style={{ color: scanReport.licenseRisks.length > 0 ? '#f59e0b' : '#10b981' }}>
            {scanReport.licenseRisks.length}
          </div>
          <div className="sbom-stat-card__label">Riesgos de Licencia</div>
        </div>

        <div className="sbom-stat-card">
          <div className="sbom-stat-card__val" style={{ color: scanReport.isCompliant ? '#10b981' : '#ef4444' }}>
            {scanReport.isCompliant ? 'CONFORME' : 'NO CONFORME'}
          </div>
          <div className="sbom-stat-card__label">Estado NIST SSDF</div>
        </div>
      </div>

      {/* ── Pestañas de Vista ── */}
      <div className="sbom-tabs">
        <button
          type="button"
          className={`sbom-tab ${activeTab === 'vulns' ? 'sbom-tab--active' : ''}`}
          onClick={() => setActiveTab('vulns')}
        >
          🛡️ Vulnerabilidades ({scanReport.vulnerabilities.length})
        </button>
        <button
          type="button"
          className={`sbom-tab ${activeTab === 'licenses' ? 'sbom-tab--active' : ''}`}
          onClick={() => setActiveTab('licenses')}
        >
          📜 Licencias & Compliance ({scanReport.licenseRisks.length})
        </button>
        <button
          type="button"
          className={`sbom-tab ${activeTab === 'cyclonedx' ? 'sbom-tab--active' : ''}`}
          onClick={() => setActiveTab('cyclonedx')}
        >
          📦 CycloneDX v1.5 (JSON)
        </button>
        <button
          type="button"
          className={`sbom-tab ${activeTab === 'spdx' ? 'sbom-tab--active' : ''}`}
          onClick={() => setActiveTab('spdx')}
        >
          📦 SPDX v2.3 (Tag-Value)
        </button>
        <button
          type="button"
          className={`sbom-tab ${activeTab === 'standards' ? 'sbom-tab--active' : ''}`}
          onClick={() => setActiveTab('standards')}
        >
          🏛️ Estándares EO 14028 & SSDF
        </button>
      </div>

      {/* ── Cuerpo de la Pestaña ── */}
      <div className="sbom-tab-body">
        {activeTab === 'vulns' && (
          <div className="sbom-vuln-list">
            {scanReport.vulnerabilities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: '#34d399' }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <p style={{ margin: '8px 0 0 0', fontWeight: 600 }}>
                  ¡Excelente! No se detectaron vulnerabilidades conocidas en las dependencias auditadas.
                </p>
              </div>
            ) : (
              scanReport.vulnerabilities.map((v, idx) => (
                <article key={idx} className={`sbom-vuln-card sbom-vuln-card--${v.severity}`}>
                  <div className="sbom-vuln-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span className="sbom-vuln-title">
                        {v.packageName} @ {v.installedVersion} — {v.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <span className="badge badge--error">{v.cve}</span>
                      <span className="badge badge--neutral">CVSS {v.cvss}</span>
                    </div>
                  </div>
                  <p className="sbom-vuln-desc">{v.description}</p>
                  <div className="sbom-vuln-remediation">
                    💡 Remediación recomendada: Actualizar a <strong>{v.packageName}@{v.fixedVersion}</strong>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {activeTab === 'licenses' && (
          <div>
            {scanReport.licenseRisks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: '#34d399' }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <p style={{ margin: '8px 0 0 0', fontWeight: 600 }}>
                  Todas las dependencias utilizan licencias permisivas (MIT, Apache 2.0, BSD). Cero riesgos de Copyleft.
                </p>
              </div>
            ) : (
              <div className="sbom-vuln-list">
                {scanReport.licenseRisks.map((lr, idx) => (
                  <article key={idx} className="sbom-vuln-card sbom-vuln-card--HIGH">
                    <div className="sbom-vuln-header">
                      <span className="sbom-vuln-title">
                        {lr.packageName} (Licencia: {lr.license})
                      </span>
                      <span className="badge badge--warning">RIESGO COPYLEFT</span>
                    </div>
                    <p className="sbom-vuln-desc">{lr.description}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'cyclonedx' && (
          <pre className="sbom-code-box">{cycloneDxJson}</pre>
        )}

        {activeTab === 'spdx' && (
          <pre className="sbom-code-box">{spdxText}</pre>
        )}

        {activeTab === 'standards' && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <h4 style={{ color: '#fff', margin: '0 0 var(--space-2) 0' }}>Estándares de Seguridad en Cadena de Suministro:</h4>
            <p>
              1. <strong>Executive Order 14028 (USA):</strong> Obliga a los proveedores de software gubernamental a proporcionar un SBOM verificable máquina-legible (CycloneDX o SPDX).
            </p>
            <p>
              2. <strong>NIST SP 800-218 (SSDF):</strong> Marco de Desarrollo de Software Seguro enfocado en prevenir ataques de Dependency Confusion, Typosquatting y manipulación de pipelines de compilación.
            </p>
            <p>
              3. <strong>SLSA (Supply-chain Levels for Software Artifacts):</strong> Garantiza la procedencia inmutable del código desde el commit hasta el binario empaquetado.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
