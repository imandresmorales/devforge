/**
 * @fileoverview Componente OAuthPKCEExplorer — Auditor de Seguridad OAuth 2.0 con PKCE.
 *
 * MEJORA 97: Proof Key for Code Exchange (RFC 7636) y Seguridad de Autorización.
 * Generador interactivo de Code Verifier y Code Challenge (S256), constructor de URLs
 * de autorización `/authorize`, simulador de canje en `/token` y defensa contra ataques MITM.
 *
 * @module components/ui/OAuthPKCEExplorer
 */
import { useState, useMemo } from 'react'
import {
  generateCodeVerifier,
  computeCodeChallenge,
  buildAuthorizationRequest,
  runPKCEAttackSimulation
} from '../../../utils/oauthPkceAuditor.js'
import './OAuthPKCEExplorer.css'

export default function OAuthPKCEExplorer() {
  const [verifierLength, setVerifierLength] = useState(64)
  const [method, setMethod] = useState('S256')
  const [clientId, setClientId] = useState('devforge-spa-client')
  const [redirectUri, setRedirectUri] = useState('https://app.devforge.io/callback')
  const [scope, setScope] = useState('openid profile email api:write')

  // Generar petición activa
  const [verifier, setVerifier] = useState(() => generateCodeVerifier(64))
  const [simulationResult, setSimulationResult] = useState(null)
  const [activeTab, setActiveTab] = useState('flow')

  const challenge = useMemo(() => {
    return computeCodeChallenge(verifier, method)
  }, [verifier, method])

  const authRequest = useMemo(() => {
    return buildAuthorizationRequest({
      clientId,
      redirectUri,
      scope,
      method,
      customVerifier: verifier
    })
  }, [clientId, redirectUri, scope, method, verifier])

  const handleRegenerateVerifier = () => {
    const newVer = generateCodeVerifier(verifierLength)
    setVerifier(newVer)
    setSimulationResult(null)
  }

  const handleRunAttackSimulation = () => {
    const result = runPKCEAttackSimulation(authRequest)
    setSimulationResult(result)
  }

  return (
    <section className="pkce-explorer" aria-labelledby="pkce-title">
      <div className="pkce-header">
        <div className="pkce-header__badge">
          <span>MEJORA 97</span>
          <span className="pkce-badge-tag">Seguridad de Autorización & RFC 7636</span>
        </div>
        <h2 id="pkce-title" className="pkce-header__title">
          Auditor de Flujos OAuth 2.0 con PKCE (Proof Key for Code Exchange)
        </h2>
        <p className="pkce-header__desc">
          Protección estándar de la industria contra ataques de intercepción de Authorization Code (CWE-384). El cliente genera un secreto en memoria (<code>code_verifier</code>) y solo envía su hash criptográfico (<code>code_challenge</code>) en la URL pública.
        </p>
      </div>

      {/* Panel Criptográfico de Verifier & Challenge */}
      <div className="pkce-crypto-card">
        <div className="pkce-crypto-header">
          <span className="pkce-crypto-icon">🔐</span>
          <h4>Generador Criptográfico de Claves Epímeras PKCE</h4>
          <button
            className="pkce-btn-mini"
            onClick={handleRegenerateVerifier}
          >
            🎲 Generar Nuevo Verifier
          </button>
        </div>

        <div className="pkce-crypto-grid">
          <div className="pkce-crypto-item">
            <div className="pkce-crypto-label">
              <span>1. Code Verifier (Secreto en Memoria del Cliente)</span>
              <span className="pkce-entropy-tag">{verifier.length} caracteres ({verifier.length * 6} bits de entropía)</span>
            </div>
            <div className="pkce-code-display pkce-code-display--verifier">
              <code>{verifier}</code>
            </div>
            <div className="pkce-crypto-hint">
              Nunca se transmite en la petición inicial de autorización GET /authorize.
            </div>
          </div>

          <div className="pkce-crypto-item">
            <div className="pkce-crypto-label">
              <span>2. Code Challenge = Base64URL(SHA-256(verifier))</span>
              <span className="pkce-method-tag">Método: {method}</span>
            </div>
            <div className="pkce-code-display pkce-code-display--challenge">
              <code>{challenge}</code>
            </div>
            <div className="pkce-crypto-hint">
              Parámetro público y seguro enviado en la URL de autorización.
            </div>
          </div>
        </div>
      </div>

      {/* Petición /authorize Generada */}
      <div className="pkce-url-panel">
        <h3 className="pkce-section-title">URL de Autorización Construida (/authorize)</h3>
        <div className="pkce-url-box">
          <code>{authRequest.authorizeUrl}</code>
        </div>
        <div className="pkce-params-tags">
          <span className="pkce-param-badge"><code>client_id: {clientId}</code></span>
          <span className="pkce-param-badge"><code>response_type: code</code></span>
          <span className="pkce-param-badge"><code>code_challenge: {challenge.slice(0, 12)}...</code></span>
          <span className="pkce-param-badge"><code>code_challenge_method: {method}</code></span>
          <span className="pkce-param-badge"><code>state: {authRequest.state} (Anti-CSRF)</code></span>
        </div>
      </div>

      {/* Simulador de Ataque y Canje */}
      <div className="pkce-simulation-panel">
        <div className="pkce-sim-header">
          <div>
            <h3 className="pkce-section-title">Prueba de Intrusión: Interceptación de Authorization Code</h3>
            <p className="pkce-sim-desc">
              Simula qué ocurre cuando un malware o atacante en red intercepta el código de autorización y pretende canjearlo en <code>/token</code> sin poseer el <code>code_verifier</code>.
            </p>
          </div>
          <button
            className="pkce-btn-attack"
            onClick={handleRunAttackSimulation}
          >
            ⚔️ Ejecutar Simulación de Ataque
          </button>
        </div>

        {simulationResult && (
          <div className="pkce-sim-results">
            <div className={`pkce-banner ${simulationResult.attackThwarted ? 'pkce-banner--safe' : 'pkce-banner--warn'}`}>
              <span className="pkce-banner-icon">{simulationResult.attackThwarted ? '🛡️' : '⚠️'}</span>
              <div>
                <h4>{simulationResult.attackThwarted ? 'Ataque MITM Neutralizado por PKCE' : 'Vulnerabilidad Detectada'}</h4>
                <p>
                  El atacante interceptó el código <code>{simulationResult.issuedCode}</code>, pero el servidor de autorización rechazó la emisión del JWT de acceso debido a la ausencia/falsedad del <code>code_verifier</code>.
                </p>
              </div>
            </div>

            <div className="pkce-comparison-grid">
              <div className="pkce-case-card pkce-case-card--legit">
                <h5>🟢 Cliente Legítimo (Posee el Verifier)</h5>
                <div className="pkce-case-body">
                  <p>Envía: <code>code + original_code_verifier</code></p>
                  <p>Respuesta Servidor: <strong>200 OK</strong></p>
                  <div className="pkce-token-preview">
                    <span>Access Token Emitido:</span>
                    <code>{simulationResult.legitimateExchange.accessToken?.slice(0, 36)}...</code>
                  </div>
                </div>
              </div>

              <div className="pkce-case-card pkce-case-card--attacker">
                <h5>🔴 Atacante Interceptor (Código Robado sin Verifier)</h5>
                <div className="pkce-case-body">
                  <p>Envía: <code>code (robado de URL) + sin verifier</code></p>
                  <p>Respuesta Servidor: <strong>400 Bad Request (invalid_grant)</strong></p>
                  <div className="pkce-token-error">
                    {simulationResult.attackerExchangeNoVerifier.description}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
