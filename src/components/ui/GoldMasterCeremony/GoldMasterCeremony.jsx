/**
 * @fileoverview Componente GoldMasterCeremony — Celebración y Certificación Oficial 100 Mejoras.
 *
 * MEJORA 100: Hito Final y Ceremonia de Lanzamiento Gold Master DevForge 1.0.
 * Valida la consumación de las 100 mejoras de ingeniería de software y genera un diploma
 * digital con firma criptográfica de integridad verificable.
 *
 * @module components/ui/GoldMasterCeremony
 */
import { useState, useMemo } from 'react'
import {
  generateGoldMasterCertificate,
  SPECIALIZATION_PILLARS
} from '../../../utils/goldMasterEngine.js'
import './GoldMasterCeremony.css'

export default function GoldMasterCeremony() {
  const [recipientName, setRecipientName] = useState('Alex Andrés Morales')
  const [isEditingName, setIsEditingName] = useState(false)
  const [certificate, setCertificate] = useState(() => generateGoldMasterCertificate('Alex Andrés Morales', { testsPassingCount: 485 }))
  const [isCelebrationActive, setIsCelebrationActive] = useState(true)

  const handleUpdateName = (e) => {
    e.preventDefault()
    setIsEditingName(false)
    const newCert = generateGoldMasterCertificate(recipientName, { testsPassingCount: 485 })
    setCertificate(newCert)
  }

  const handlePrintCertificate = () => {
    window.print()
  }

  return (
    <section className="gm-ceremony" aria-labelledby="gm-title">
      {/* Efecto de confeti y fuegos artificiales decorativo */}
      <div className="gm-fireworks-container" aria-hidden="true">
        <span className="gm-spark gm-spark--1" />
        <span className="gm-spark gm-spark--2" />
        <span className="gm-spark gm-spark--3" />
        <span className="gm-spark gm-spark--4" />
      </div>

      <div className="gm-header">
        <div className="gm-header__badge">
          <span>🏆 HITO CULMINADO — MEJORA 100 / 100</span>
          <span className="gm-badge-tag">DevForge 1.0 Gold Master Edition</span>
        </div>
        <h2 id="gm-title" className="gm-header__title">
          Gran Ceremonia de Lanzamiento & Certificación Oficial de Ingeniero de Software
        </h2>
        <p className="gm-header__desc">
          ¡Felicitaciones! Se ha completado el <strong>100% del roadmap de ingeniería de software (100 Mejoras Atómicas)</strong>. Este diploma digital acredita el dominio pleno en desarrollo Frontend, Arquitectura de Sistemas Distribuidos, Ciberseguridad Ofensiva/Defensiva, Criptografía Avanzada e Inteligencia Artificial en Cliente.
        </p>
      </div>

      {/* Controles del Diploma */}
      <div className="gm-controls-card">
        <div className="gm-name-form">
          <label className="gm-label" htmlFor="gm-name-input">Nombre del Ingeniero Acreditado:</label>
          <div className="gm-name-input-group">
            <input
              id="gm-name-input"
              type="text"
              className="gm-input"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Ingresa tu nombre..."
            />
            <button className="gm-btn gm-btn--update" onClick={handleUpdateName}>
              ✍️ Actualizar Diploma
            </button>
            <button className="gm-btn gm-btn--print" onClick={handlePrintCertificate}>
              🖨️ Imprimir / Guardar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Diploma Digital Oficial */}
      <div className="gm-diploma-wrapper">
        <div className="gm-diploma-frame">
          <div className="gm-diploma-border">
            <div className="gm-diploma-inner">
              <div className="gm-diploma-watermark">DEVFORGE 100</div>

              <div className="gm-diploma-header">
                <div className="gm-logo-badge">🛡️ DEVFORGE ARCHITECTURE & SECURITY</div>
                <h3 className="gm-diploma-main-title">CERTIFICADO DE EXCELENCIA TÉCNICA</h3>
                <span className="gm-diploma-subtitle">ACREDITACIÓN DE INGENIERÍA DE SOFTWARE FULL-STACK Y SISTEMAS DISTRIBUIDOS</span>
              </div>

              <div className="gm-diploma-body">
                <p className="gm-certifies-text">Por la presente se certifica que:</p>
                <h4 className="gm-recipient-name">{certificate.recipient}</h4>
                <p className="gm-achievement-desc">
                  Ha culminado con distinción <strong>Summa Cum Laude</strong> el programa riguroso de <strong>100 Mejoras de Software</strong>, demostrando competencia en sistemas tolerantes a fallas (PBFT/Raft), criptografía homomórfica, seguridad OWASP/OAuth PKCE y arquitectura de alto rendimiento.
                </p>
              </div>

              {/* Pilares Validados */}
              <div className="gm-pillars-grid">
                {SPECIALIZATION_PILLARS.map((p, idx) => (
                  <div key={idx} className="gm-pillar-chip">
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>

              {/* Pie del Diploma con Sello Criptográfico */}
              <div className="gm-diploma-footer">
                <div className="gm-footer-col">
                  <span className="gm-col-label">ID de Certificado:</span>
                  <code className="gm-code-val">{certificate.certificateId}</code>
                  <span className="gm-col-sub">Fecha: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>

                <div className="gm-gold-seal">
                  <div className="gm-seal-inner">
                    <span>★ ★ ★</span>
                    <strong>100%</strong>
                    <small>VERIFIED</small>
                  </div>
                </div>

                <div className="gm-footer-col gm-footer-col--right">
                  <span className="gm-col-label">Sello Criptográfico SHA-256:</span>
                  <code className="gm-code-val">{certificate.cryptographicSeal.slice(0, 24)}...</code>
                  <span className="gm-col-sub">Comité de Arquitectura DevForge</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
