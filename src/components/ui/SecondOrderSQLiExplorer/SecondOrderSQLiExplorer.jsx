/**
 * @fileoverview Componente SecondOrderSQLiExplorer — Auditor de Inyección SQL de Segundo Orden (Mejora 92).
 *
 * Muestra el ciclo de ataque en dos etapas (Almacenamiento pasivo y Disparo secundario en batch jobs)
 * y la protección absoluta mediante Prepared Statements ($1).
 *
 * @module components/ui/SecondOrderSQLiExplorer
 */
import { useState, useRef } from 'react'
import {
  SimulatedDatabase,
  SECOND_ORDER_SQLI_PAYLOADS,
} from '../../../utils/secondOrderSqliAuditor'
import './SecondOrderSQLiExplorer.css'

export default function SecondOrderSQLiExplorer() {
  const [usernameInput, setUsernameInput] = useState("admin'--")
  const [emailInput, setEmailInput] = useState('attacker@evil-corp.com')
  const [selectedPayloadId, setSelectedPayloadId] = useState('payload-bypass')

  const [storedUser, setStoredUser] = useState(null)
  const [auditResults, setAuditResults] = useState(null)
  const [activeTab, setActiveTab] = useState('cheatsheet')

  const dbRef = useRef(null)
  if (!dbRef.current) {
    dbRef.current = new SimulatedDatabase()
  }
  const db = dbRef.current

  // Cambiar payload preconfigurado
  const handleSelectPayload = (id) => {
    setSelectedPayloadId(id)
    const p = SECOND_ORDER_SQLI_PAYLOADS.find((item) => item.id === id)
    if (p) {
      setUsernameInput(p.payload)
    }
  }

  // Paso 1: Almacenar en base de datos
  const handleStoreUser = (e) => {
    e.preventDefault()
    if (!usernameInput.trim()) return

    const user = db.insertUser(usernameInput, emailInput)
    setStoredUser(user)
    setAuditResults(null)
  }

  // Paso 2: Disparar auditoría secundaria
  const handleTriggerAudit = () => {
    if (!storedUser) return

    const vulnRes = db.executeVulnerableProfileAudit(storedUser.username)
    const secureRes = db.executeParameterizedProfileAudit(storedUser.username)

    setAuditResults({
      vuln: vulnRes,
      secure: secureRes,
    })
  }

  return (
    <section className="sqli-explorer" aria-labelledby="sqli-title">
      {/* ── Encabezado ── */}
      <div className="sqli-explorer__header">
        <div className="sqli-explorer__title-row">
          <h2 id="sqli-title" className="sqli-explorer__title">
            <span>🛡️</span> Auditor de Inyección SQL de Segundo Orden (CWE-89 Stored SQLi)
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span className="badge badge--brand">Mejora 92</span>
            <span className="badge badge--error">CWE-89 Stored</span>
            <span className="badge badge--success">Prepared Statements $1</span>
            <span className="badge badge--warning">OWASP Top 10</span>
          </div>
        </div>
        <p className="sqli-explorer__desc">
          En la <strong>Inyección SQL de Segundo Orden (Second-Order SQLi)</strong>, el payload malicioso no ataca la primera consulta de inserción;
          se almacena de forma duradera en la base de datos y se ejecuta cuando un <strong>proceso secundario</strong> (reportes nocturnos, jobs de auditoría)
          reutiliza y concatena el valor sin parametrizar.
        </p>
      </div>

      {/* ── Paso 1: Almacenamiento del Payload ── */}
      <div className="sqli-steps-box">
        <div className="sqli-step-title">
          1. Fase de Registro / Almacenamiento (Paso 1: Inocuo)
        </div>

        <div style={{ marginBottom: 'var(--space-2)' }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginRight: '8px' }}>
            Payloads Predefinidos:
          </label>
          <select
            className="sqli-input"
            style={{ maxWidth: '300px', padding: '4px 8px' }}
            value={selectedPayloadId}
            onChange={(e) => handleSelectPayload(e.target.value)}
          >
            {SECOND_ORDER_SQLI_PAYLOADS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <form onSubmit={handleStoreUser} className="sqli-input-row">
          <input
            type="text"
            className="sqli-input"
            placeholder="Username (Payload SQL)..."
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
          />
          <input
            type="email"
            className="sqli-input"
            placeholder="Email..."
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <button type="submit" className="sqli-btn sqli-btn--primary">
            1. Guardar en Base de Datos 💾
          </button>
        </form>

        {storedUser && (
          <div style={{ fontSize: 'var(--text-xs)', color: '#38bdf8' }}>
            ✅ Usuario registrado en BD con ID <strong>#{storedUser.id}</strong> (Username almacenado: <code>{storedUser.username}</code>).
          </div>
        )}
      </div>

      {/* ── Paso 2: Disparo del Proceso Secundario ── */}
      <div className="sqli-steps-box">
        <div className="sqli-step-title">
          2. Fase de Ejecución Secundaria (Paso 2: Disparo del Exploit)
        </div>
        <p style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Un reporte administrativo posterior consulta las cuentas registradas por su nombre de usuario.
        </p>

        <button
          type="button"
          className="sqli-btn sqli-btn--danger"
          onClick={handleTriggerAudit}
          disabled={!storedUser}
        >
          2. Ejecutar Auditoría / Reporte Backend ⚡
        </button>
      </div>

      {/* ── Comparativa Lado a Lado ── */}
      {auditResults && (
        <div className="sqli-compare-grid">
          {/* Vulnerable */}
          <article className="sqli-card sqli-card--vuln">
            <div className="sqli-card__header">
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#ef4444' }}>
                🔴 Modo Vulnerable (Concatenación Dinámica)
              </span>
              <span className={`badge ${auditResults.vuln.isCompromised ? 'badge--error' : 'badge--neutral'}`}>
                {auditResults.vuln.isCompromised ? '🚨 EXPLOIT EXITOSO' : 'NORMAL'}
              </span>
            </div>
            <div className="sqli-sql-block">
              {auditResults.vuln.rawSql}
            </div>
            <p style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.72rem', color: '#f87171' }}>
              {auditResults.vuln.message}
            </p>
            <div className="sqli-rows-box">
              {JSON.stringify(auditResults.vuln.affectedRows, null, 2)}
            </div>
          </article>

          {/* Seguro */}
          <article className="sqli-card sqli-card--secure">
            <div className="sqli-card__header">
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#10b981' }}>
                🟢 Modo Seguro (Prepared Statements $1)
              </span>
              <span className="badge badge--success">🛡️ INYECCIÓN NEUTRALIZADA</span>
            </div>
            <div className="sqli-sql-block" style={{ color: '#10b981' }}>
              {auditResults.secure.preparedSql}
              <br />
              <span style={{ color: '#94a3b8' }}>Param $1 = {JSON.stringify(auditResults.secure.params[0])}</span>
            </div>
            <p style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.72rem', color: '#34d399' }}>
              {auditResults.secure.message}
            </p>
            <div className="sqli-rows-box">
              {JSON.stringify(auditResults.secure.affectedRows, null, 2)}
            </div>
          </article>
        </div>
      )}
    </section>
  )
}
