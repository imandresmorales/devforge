/**
 * @fileoverview Componente UI para el Auditor de Seguridad CSRF y Cookies SameSite (Mejora 71).
 *
 * Muestra:
 * - Generador de Tokens Synchronizer Token Pattern (STP) con TTL.
 * - Simulador de Peticiones HTTP (Safe vs Cross-Site Attack con/sin token y Sec-Fetch headers).
 * - Auditor en vivo de directivas de cookies (SameSite=Strict/Lax/None, HttpOnly, Secure).
 * - Recomendaciones de mitigación basadas en directrices OWASP CSRF Prevention Cheat Sheet.
 *
 * @module components/ui/CSRFAuditor/CSRFAuditor
 */
import { useState, useRef } from 'react'
import {
  CsrfTokenManager,
  auditCookieSecurity,
  auditIncomingRequest,
} from '../../../utils/csrfAuditor'
import './CSRFAuditor.css'

export default function CSRFAuditor() {
  const tokenManagerRef = useRef(new CsrfTokenManager({ ttlMs: 300000 })) // 5 min TTL
  const [activeSessionId, setActiveSessionId] = useState('user_session_4482')
  const [currentToken, setCurrentToken] = useState(() => tokenManagerRef.current.createToken('user_session_4482'))

  // Request Simulation state
  const [method, setMethod] = useState('POST')
  const [origin, setOrigin] = useState('https://evil-hacker.xyz')
  const [secFetchSite, setSecFetchSite] = useState('cross-site')
  const [sendToken, setSendToken] = useState(false)
  const [requestVerdict, setRequestVerdict] = useState(null)

  // Cookie Audit state
  const [cookieName, setCookieName] = useState('session_token')
  const [sameSite, setSameSite] = useState('None')
  const [isSecure, setIsSecure] = useState(false)
  const [isHttpOnly, setIsHttpOnly] = useState(false)

  const handleRegenerateToken = () => {
    const newToken = tokenManagerRef.current.createToken(activeSessionId)
    setCurrentToken(newToken)
  }

  const handleSimulateRequest = () => {
    const tokenToValidate = sendToken ? currentToken : ''
    const validation = tokenManagerRef.current.validateToken(activeSessionId, tokenToValidate)

    const audit = auditIncomingRequest(
      {
        method,
        origin,
        secFetchSite,
        hasCsrfToken: validation.valid,
        hasMutationIntent: ['POST', 'PUT', 'DELETE'].includes(method),
      },
      ['https://devforge.app']
    )

    setRequestVerdict(audit)
  }

  const cookieAudit = auditCookieSecurity({
    name: cookieName,
    sameSite,
    secure: isSecure,
    httpOnly: isHttpOnly,
  })

  return (
    <section className="csrf-auditor" aria-labelledby="csrf-title">
      <div className="csrf-auditor__header">
        <div>
          <span className="badge badge--brand">Ciberseguridad Web & OWASP Top 10</span>
          <h2 id="csrf-title" className="csrf-auditor__title">
            Auditor de Seguridad CSRF & Cookies SameSite
          </h2>
          <p className="csrf-auditor__desc">
            Prueba mecanismos de defensa contra <strong>Cross-Site Request Forgery (CSRF)</strong> mediante
            tokens criptográficos Synchronizer Token Pattern (STP), cabeceras Sec-Fetch-Site y directivas de cookies seguras.
          </p>
        </div>

        <div className="csrf-token-badge-container">
          <div className="csrf-token-box">
            <span className="csrf-token-label">Token CSRF de Sesión (Activo):</span>
            <code className="csrf-token-code">{currentToken}</code>
          </div>
          <button type="button" className="btn-secondary" onClick={handleRegenerateToken}>
            🔄 Renovar Token
          </button>
        </div>
      </div>

      <div className="csrf-grid">
        {/* ── Panel 1: Simulador de Petición HTTP / Ataque Cross-Origin ── */}
        <div className="csrf-panel">
          <h3 className="csrf-panel-title">🌐 Simulador de Solicitud HTTP Entrante</h3>
          <p className="csrf-panel-desc">
            Configura el origen de la petición, el método HTTP y si el atacante logró enviar un token CSRF válido.
          </p>

          <div className="csrf-form-row">
            <div className="csrf-field">
              <label>Método HTTP:</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="csrf-select">
                <option value="GET">GET (Lectura)</option>
                <option value="POST">POST (Crear / Mutar)</option>
                <option value="PUT">PUT (Actualizar)</option>
                <option value="DELETE">DELETE (Eliminar cuenta/datos)</option>
              </select>
            </div>

            <div className="csrf-field">
              <label>Cabecera Sec-Fetch-Site:</label>
              <select value={secFetchSite} onChange={(e) => setSecFetchSite(e.target.value)} className="csrf-select">
                <option value="same-origin">same-origin (Mismo dominio)</option>
                <option value="same-site">same-site (Subdominio)</option>
                <option value="cross-site">cross-site (Sitio externo atacante)</option>
              </select>
            </div>
          </div>

          <div className="csrf-field">
            <label>Origen (Origin / Referer header):</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="csrf-input"
              placeholder="https://evil-site.org"
            />
          </div>

          <div className="csrf-checkbox-field">
            <label>
              <input
                type="checkbox"
                checked={sendToken}
                onChange={(e) => setSendToken(e.target.checked)}
              />
              <span>Incluir cabecera <code>X-CSRF-Token</code> legítima</span>
            </label>
          </div>

          <button type="button" className="btn-primary csrf-simulate-btn" onClick={handleSimulateRequest}>
            🛡️ Evaluar Petición con Firewall CSRF
          </button>

          {requestVerdict && (
            <div className={`csrf-verdict-box csrf-verdict-box--${requestVerdict.passed ? 'pass' : 'fail'}`}>
              <div className="csrf-verdict-header">
                <strong>Veredicto WAF:</strong>
                <span className="badge badge--brand">{requestVerdict.verdict}</span>
              </div>
              <p className="csrf-verdict-summary">
                {requestVerdict.passed
                  ? '✅ Solicitud autorizada de forma segura. Cumple con las políticas anti-CSRF.'
                  : '🚨 ATAQUE CSRF DETECTADO Y BLOQUEADO (HTTP 403 Forbidden).'}
              </p>
              {requestVerdict.findings.length > 0 && (
                <ul className="csrf-findings-list">
                  {requestVerdict.findings.map((f, i) => (
                    <li key={i}>
                      <strong>[{f.severity}] {f.title}:</strong> {f.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Panel 2: Auditor de Directivas de Cookies ── */}
        <div className="csrf-panel">
          <div className="csrf-cookie-header">
            <h3 className="csrf-panel-title">🍪 Auditor de Directivas de Cookies</h3>
            <div className={`csrf-score-badge csrf-score-badge--${cookieAudit.rating.toLowerCase()}`}>
              Nota: {cookieAudit.rating} ({cookieAudit.score}/100)
            </div>
          </div>

          <div className="csrf-field">
            <label>Nombre de Cookie:</label>
            <input
              type="text"
              value={cookieName}
              onChange={(e) => setCookieName(e.target.value)}
              className="csrf-input"
            />
          </div>

          <div className="csrf-field">
            <label>Atributo SameSite:</label>
            <div className="csrf-samesite-options">
              {['Strict', 'Lax', 'None'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`btn-xs ${sameSite === opt ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSameSite(opt)}
                >
                  SameSite={opt}
                </button>
              ))}
            </div>
          </div>

          <div className="csrf-flags-grid">
            <label className="csrf-toggle-label">
              <input
                type="checkbox"
                checked={isHttpOnly}
                onChange={(e) => setIsHttpOnly(e.target.checked)}
              />
              <span>🔒 HttpOnly (Protege contra robo XSS)</span>
            </label>

            <label className="csrf-toggle-label">
              <input
                type="checkbox"
                checked={isSecure}
                onChange={(e) => setIsSecure(e.target.checked)}
              />
              <span>🔐 Secure (Solo sobre HTTPS cifrado)</span>
            </label>
          </div>

          <div className="csrf-cookie-issues-box">
            <span className="csrf-meta-title">Hallazgos de Seguridad de Cookie:</span>
            {cookieAudit.issues.length === 0 ? (
              <div className="csrf-clean-alert">
                ✨ ¡Configuración perfecta! La cookie está blindada contra CSRF, XSS y ataques Man-in-the-Middle.
              </div>
            ) : (
              <div className="csrf-issues-list">
                {cookieAudit.issues.map((iss, i) => (
                  <div key={i} className={`csrf-issue-item csrf-issue-item--${iss.severity.toLowerCase()}`}>
                    <span className="csrf-issue-tag">{iss.severity}</span>
                    <div>
                      <strong>{iss.rule}</strong>
                      <p>{iss.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
