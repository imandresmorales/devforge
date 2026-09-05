/**
 * @fileoverview Componente PKIExplorer — Inspector interactivo de certificados X.509 y Cadena de Confianza SSL/TLS (Mejora 62).
 *
 * CARACTERÍSTICAS:
 * - Árbol interactivo de la Cadena de Confianza (Root CA -> Intermediate CA -> Server Leaf).
 * - Verificador de nombres de host (Hostname Verification conforme a RFC 6125 y CWE-297) con soporte wildcard (*.domain.com).
 * - Diagnóstico en tiempo real de expiración, firmas y autoridades de certificación no confiables.
 * - Presets de auditoría para demostración de errores comunes de SSL/TLS.
 *
 * @module components/ui/PKIExplorer
 */
import { useState, useMemo } from 'react'
import {
  PKI_PRESETS,
  auditCertificateChain,
} from '../../../utils/pkiEngine'
import { useToast } from '../../../context/ToastContext'
import './PKIExplorer.css'

function PKIExplorer() {
  const { addToast } = useToast()

  const [selectedPresetId, setSelectedPresetId] = useState('valid_production')
  const [hostnameInput, setHostnameInput] = useState('api.devforge.io')

  const currentChain = useMemo(() => {
    return PKI_PRESETS.find((p) => p.id === selectedPresetId) || PKI_PRESETS[0]
  }, [selectedPresetId])

  const auditReport = useMemo(() => {
    return auditCertificateChain(currentChain, hostnameInput)
  }, [currentChain, hostnameInput])

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id)
    if (preset.id === 'expired_certificate') {
      setHostnameInput('legacy.devforge.io')
    } else if (preset.id === 'untrusted_self_signed') {
      setHostnameInput('internal-dev.local')
    } else {
      setHostnameInput('api.devforge.io')
    }

    addToast({
      type: 'info',
      title: 'Cadena PKI Cargada',
      message: `${preset.name} cargado en el inspector.`,
    })
  }

  return (
    <section className="pki-explorer-section" aria-label="Inspector de Certificados X.509 y Cadena de Confianza PKI">
      {/* ── Encabezado ── */}
      <div className="pki-explorer-header">
        <div>
          <div className="pki-badge-wrapper">
            <span className="badge badge--brand">📜 Public Key Infrastructure (PKI)</span>
            <span className="badge badge--success">X.509 v3 & SSL/TLS Chain</span>
          </div>
          <h2 className="pki-explorer-title">
            Inspector de Certificados X.509 & Cadena de Confianza SSL/TLS
          </h2>
          <p className="pki-explorer-subtitle">
            Visualiza la jerarquía criptográfica de autoridades certificadoras, valida la coincidencia de nombres de host (SAN) y diagnostica fallas de certificados antes de que afecten a tus usuarios.
          </p>
        </div>

        {/* Presets */}
        <div className="pki-presets-bar">
          {PKI_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`pki-preset-btn ${selectedPresetId === p.id ? 'pki-preset-btn--active' : ''}`}
              onClick={() => handleSelectPreset(p)}
            >
              <span className="pki-preset-title">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Diagnóstico y Verificador de Hostname ── */}
      <div className="pki-audit-banner-card">
        <div className="pki-audit-top">
          <div className="pki-grade-box">
            <span className={`pki-grade-badge pki-grade-badge--${auditReport.grade.toLowerCase()}`}>
              {auditReport.grade}
            </span>
            <div>
              <div className="pki-grade-title">
                {auditReport.isSecure ? 'Conexión HTTPS Segura y Certificada' : 'Advertencia de Seguridad SSL/TLS'}
              </div>
              <div className="pki-grade-summary">{auditReport.summary}</div>
            </div>
          </div>

          {/* Input de Hostname a probar */}
          <div className="pki-host-tester">
            <label htmlFor="pki-host-input" className="pki-label">Validar Hostname Conectado:</label>
            <div className="pki-host-input-row">
              <input
                id="pki-host-input"
                type="text"
                className="pki-input"
                value={hostnameInput}
                onChange={(e) => setHostnameInput(e.target.value)}
                placeholder="ej. api.devforge.io"
              />
              <span className={`pki-host-match-badge ${auditReport.hostnameMatched ? 'pki-host-match-badge--ok' : 'pki-host-match-badge--fail'}`}>
                {auditReport.hostnameMatched ? `✅ Coincide (${auditReport.matchedSan})` : '❌ Discrepancia de Dominio'}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Problemas Detectados */}
        {auditReport.issues.length > 0 && (
          <div className="pki-issues-list">
            {auditReport.issues.map((issue, idx) => (
              <div key={idx} className={`pki-issue-item pki-issue-item--${issue.level.toLowerCase()}`}>
                <span className={`badge badge--${issue.level === 'CRITICAL' ? 'danger' : 'warning'}`}>
                  {issue.level}
                </span>
                <div>
                  <strong>{issue.title}</strong>
                  <p>{issue.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Árbol Visual de la Cadena de Confianza ── */}
      <div className="pki-chain-tree-card">
        <h3 className="pki-chain-title">🏛️ Jerarquía de la Cadena de Confianza (Chain of Trust)</h3>

        <div className="pki-chain-steps">
          {/* Nivel 1: Root CA */}
          {currentChain.root && (
            <div className={`pki-cert-node pki-cert-node--root ${currentChain.root.isTrustedRoot ? '' : 'pki-cert-node--untrusted'}`}>
              <div className="pki-node-header">
                <span className="pki-node-type">🏛️ 1. Root Certificate Authority (Trust Anchor)</span>
                <span className="pki-node-cn">{currentChain.root.subject.CN}</span>
              </div>
              <div className="pki-node-body">
                <div className="pki-node-meta">
                  <span>Organización: <strong>{currentChain.root.subject.O} ({currentChain.root.subject.C})</strong></span>
                  <span>Algoritmo: <strong>{currentChain.root.keyAlgorithm}</strong></span>
                  <span>Confianza del Sistema: <strong className={currentChain.root.isTrustedRoot ? 'text-success' : 'text-danger'}>
                    {currentChain.root.isTrustedRoot ? '✅ Certificado Raíz Confiable' : '❌ No reconocido en Trust Store'}
                  </strong></span>
                </div>
              </div>
            </div>
          )}

          <div className="pki-chain-arrow">⬇️ Firma Digitalmente a la CA Intermedia</div>

          {/* Nivel 2: Intermediate CA */}
          {currentChain.intermediate ? (
            <div className="pki-cert-node pki-cert-node--intermediate">
              <div className="pki-node-header">
                <span className="pki-node-type">🏢 2. Intermediate Certificate Authority</span>
                <span className="pki-node-cn">{currentChain.intermediate.subject.CN}</span>
              </div>
              <div className="pki-node-body">
                <div className="pki-node-meta">
                  <span>Emisor: <strong>{currentChain.intermediate.issuer.CN}</strong></span>
                  <span>Serial: <code>{currentChain.intermediate.serialNumber}</code></span>
                  <span>Válido hasta: <strong>{new Date(currentChain.intermediate.validity.notAfter).toLocaleDateString()}</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pki-cert-node pki-cert-node--empty">
              <span>(Sin CA Intermedia — Certificado Autofirmado Directo)</span>
            </div>
          )}

          <div className="pki-chain-arrow">⬇️ Emite y Firma el Certificado del Servidor</div>

          {/* Nivel 3: Server Leaf Certificate */}
          <div className={`pki-cert-node pki-cert-node--leaf ${auditReport.isExpired ? 'pki-cert-node--expired' : ''}`}>
            <div className="pki-node-header">
              <span className="pki-node-type">💻 3. Server End-Entity Certificate (Leaf)</span>
              <span className="pki-node-cn">{currentChain.leaf.subject.CN}</span>
            </div>
            <div className="pki-node-body">
              <div className="pki-node-meta">
                <span>Organización: <strong>{currentChain.leaf.subject.O}</strong></span>
                <span>Emisor (CA): <strong>{currentChain.leaf.issuer.CN}</strong></span>
                <span>Vigencia: <strong className={auditReport.isExpired ? 'text-danger' : 'text-success'}>
                  {new Date(currentChain.leaf.validity.notBefore).toLocaleDateString()} al {new Date(currentChain.leaf.validity.notAfter).toLocaleDateString()}
                  {auditReport.isExpired ? ' (EXPIRADO)' : ' (VÁLIDO)'}
                </strong></span>
              </div>

              {/* Subject Alternative Names */}
              <div className="pki-sans-box">
                <span className="pki-sans-title">Subject Alternative Names (SANs / Dominios Cubiertos):</span>
                <div className="pki-sans-tags">
                  {currentChain.leaf.sans.map((san) => (
                    <span key={san} className="pki-san-tag"><code>{san}</code></span>
                  ))}
                </div>
              </div>

              {/* Thumbprint */}
              {currentChain.leaf.thumbprint && (
                <div className="pki-thumbprint-box">
                  <span className="pki-thumbprint-label">SHA-256 Fingerprint:</span>
                  <code className="pki-thumbprint-code">{currentChain.leaf.thumbprint}</code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PKIExplorer
