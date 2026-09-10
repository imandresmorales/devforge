/**
 * @fileoverview Componente UI para el Analizador y Sanitizador Anti-SSRF (Mejora 77).
 *
 * Muestra:
 * - Selector de vectores de ataque SSRF conocidos (AWS IMDSv1, File Protocol, Decimal IP, Localhost, Private RFC 1918).
 * - Motor de desofuscación y normalización de IPs en tiempo real.
 * - Firewall de validación previa al envío (Pre-flight Security Gate) con veredicto BLOCKED_SSRF / ALLOWED_SAFE.
 * - Guía de mitigación OWASP Server-Side Request Forgery Prevention.
 *
 * @module components/ui/SSRFDefender/SSRFDefender
 */
import { useState } from 'react'
import { validateSafeUrl } from '../../../utils/ssrfDefender'
import './SSRFDefender.css'

const ATTACK_PRESETS = [
  {
    name: '☁️ AWS Metadata Exfiltration (CWE-918)',
    url: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
    desc: 'Intento de extraer tokens temporales IAM de la instancia EC2 mediante IMDSv1.',
  },
  {
    name: '📂 File Protocol /etc/passwd (LFI/SSRF)',
    url: 'file:///etc/passwd',
    desc: 'Uso del esquema file:// para lectura de archivos confidenciales del sistema operativo.',
  },
  {
    name: '🔢 IP Ofuscada en Entero Decimal',
    url: 'http://2130706433:8080/admin/api/keys',
    desc: '2130706433 equivale a 127.0.0.1 para evadir filtros de texto basados en string matching.',
  },
  {
    name: '🏠 Red Privada RFC 1918 (Router/DB)',
    url: 'http://192.168.1.1:80/admin/reboot',
    desc: 'Intento de forzar al servidor a interactuar con dispositivos en la red LAN interna.',
  },
  {
    name: '🦫 Gopher Protocol / Redis Exploitation',
    url: 'gopher://127.0.0.1:6379/_FLUSHALL',
    desc: 'Esquema gopher:// utilizado para enviar comandos binarios crudos a servidores Redis/Memcached internos.',
  },
  {
    name: '🟢 API Pública Legítima (Safe)',
    url: 'https://api.github.com/repos/devforge/app',
    desc: 'Petición legítima hacia un dominio público seguro sobre HTTPS.',
  },
]

export default function SSRFDefender() {
  const [inputUrl, setInputUrl] = useState(ATTACK_PRESETS[0].url)
  const [auditResult, setAuditResult] = useState(() => validateSafeUrl(ATTACK_PRESETS[0].url))

  const handleSelectPreset = (preset) => {
    setInputUrl(preset.url)
    setAuditResult(validateSafeUrl(preset.url))
  }

  const handleAudit = () => {
    setAuditResult(validateSafeUrl(inputUrl))
  }

  return (
    <section className="ssrf-defender" aria-labelledby="ssrf-title">
      <div className="ssrf-defender__header">
        <div>
          <span className="badge badge--brand">Ciberseguridad Web & OWASP Top 10</span>
          <h2 id="ssrf-title" className="ssrf-defender__title">
            Analizador y Firewall Anti-SSRF (Server-Side Request Forgery)
          </h2>
          <p className="ssrf-defender__desc">
            Protege tus endpoints que realizan peticiones salientes (Webhooks, proxies, descarga de avatares).
            Valida esquemas permitidos, desofusca IPs y bloquea accesos a redes privadas y servicios de metadatos Cloud (AWS/GCP).
          </p>
        </div>
      </div>

      <div className="ssrf-grid">
        {/* ── Panel 1: Entrada de URL y Vectores de Prueba ── */}
        <div className="ssrf-panel">
          <h3 className="ssrf-panel-title">🎯 Vectores de Ataque Comunes</h3>
          <div className="ssrf-presets-list">
            {ATTACK_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className={`ssrf-preset-btn ${inputUrl === p.url ? 'ssrf-preset-btn--active' : ''}`}
                onClick={() => handleSelectPreset(p)}
              >
                <strong>{p.name}</strong>
                <span>{p.desc}</span>
              </button>
            ))}
          </div>

          <div className="ssrf-field">
            <label>URL a Inspeccionar:</label>
            <div className="ssrf-input-row">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="ssrf-input"
                placeholder="https://..."
              />
              <button type="button" className="btn-primary" onClick={handleAudit}>
                🛡️ Auditar URL
              </button>
            </div>
          </div>
        </div>

        {/* ── Panel 2: Resultados del Análisis y Veredicto Firewall ── */}
        <div className="ssrf-panel">
          <div className="ssrf-verdict-header">
            <h3 className="ssrf-panel-title">📋 Diagnóstico de Seguridad</h3>
            <span className={`ssrf-verdict-tag ssrf-verdict-tag--${auditResult.isValid ? 'safe' : 'blocked'}`}>
              {auditResult.verdict}
            </span>
          </div>

          {auditResult.parsed && (
            <div className="ssrf-parsed-box">
              <span className="ssrf-meta-title">Desglose del Parser Criptográfico:</span>
              <div className="ssrf-parsed-grid">
                <div><span>Esquema:</span> <code>{auditResult.parsed.protocol}</code></div>
                <div><span>Hostname:</span> <code>{auditResult.parsed.hostname}</code></div>
                <div><span>IP Normalizada:</span> <code className="ssrf-ip-highlight">{auditResult.parsed.normalizedIp}</code></div>
                <div><span>Puerto:</span> <code>{auditResult.parsed.port}</code></div>
              </div>
            </div>
          )}

          <div className="ssrf-issues-container">
            <span className="ssrf-meta-title">Hallazgos y Reglas de Bloqueo:</span>
            {auditResult.issues.length === 0 ? (
              <div className="ssrf-clean-alert">
                ✨ ¡URL Segura! Pertenece a una IP pública global con esquema HTTP/HTTPS permitido. La solicitud saliente puede ser ejecutada sin riesgo de SSRF.
              </div>
            ) : (
              <div className="ssrf-issues-list">
                {auditResult.issues.map((iss, i) => (
                  <div key={i} className="ssrf-issue-card">
                    <span className="ssrf-issue-sev">{iss.severity}</span>
                    <div>
                      <strong>{iss.title}</strong>
                      <p>{iss.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Directrices de Mitigación OWASP ── */}
      <div className="ssrf-footer-checklist">
        <div className="ssrf-check-item">
          <span className="ssrf-check-icon">🔒</span>
          <div>
            <strong>1. Lista Blanca Estricta de Esquemas:</strong>
            <p>Acepte únicamente <code>http://</code> y <code>https://</code>. Inhabilite manejadores de protocolos como <code>file://</code> o <code>gopher://</code> en cURL/Axios/Fetch.</p>
          </div>
        </div>
        <div className="ssrf-check-item">
          <span className="ssrf-check-icon">🛡️</span>
          <div>
            <strong>2. Resolución DNS Previa y Validación de IP:</strong>
            <p>Resuelva el nombre de dominio antes de la conexión y verifique que la IP de destino no caiga en rangos privados RFC 1918 ni en <code>169.254.169.254</code>.</p>
          </div>
        </div>
        <div className="ssrf-check-item">
          <span className="ssrf-check-icon">🚫</span>
          <div>
            <strong>3. Deshabilitar Redirecciones HTTP Automáticas:</strong>
            <p>No siga redirecciones 3xx a ciegas; valide la URL destino de cada salto para prevenir ataques de bypass de primer nivel.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
