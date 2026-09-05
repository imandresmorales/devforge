/**
 * @fileoverview Componente JWTInspector — Inspector y validador criptográfico de tokens JWT (RFC 7519) (Mejora 56).
 *
 * CARACTERÍSTICAS:
 * - Decodificación visual de las 3 partes (Header, Payload, Signature) con coloreado sintáctico.
 * - Verificación en tiempo real de firma criptográfica HMAC-SHA256 con clave secreta compartida.
 * - Presets de auditoría: Tokens de producción, exploits alg:none, expiración y fuga de credenciales.
 * - Diagnóstico de seguridad con recomendaciones OWASP para APIs REST.
 *
 * @module components/ui/JWTInspector
 */
import { useState, useMemo } from 'react'
import {
  inspectJWT,
  createJWT,
  base64UrlEncode,
} from '../../../utils/jwtEngine'
import { useToast } from '../../../context/ToastContext'
import './JWTInspector.css'

const DEFAULT_SECRET = 'devforge_secure_jwt_secret_key_2026_production'

const JWT_PRESETS = [
  {
    label: 'Token de Producción Válido',
    type: 'Seguro',
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      sub: 'usr_devforge_992',
      name: 'Alex Morales',
      role: 'admin',
      iss: 'https://auth.devforge.io',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7200,
    },
    secret: DEFAULT_SECRET,
  },
  {
    label: 'Vulnerabilidad alg: none',
    type: 'Ataque Crítico',
    header: { alg: 'none', typ: 'JWT' },
    payload: {
      sub: 'admin_compromised',
      role: 'superadmin',
      is_root: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    secret: '',
  },
  {
    label: 'Token Expirado (Vencido)',
    type: 'Rechazo',
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      sub: 'usr_expired_001',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) - 3600, // Expirado hace 1 hora
    },
    secret: DEFAULT_SECRET,
  },
  {
    label: 'Fuga de Datos Sensibles',
    type: 'Mala Práctica',
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      sub: 'usr_leaked_55',
      password: 'PlainPassword123!',
      credit_card: '4532-xxxx-xxxx-1289',
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    secret: DEFAULT_SECRET,
  },
]

function JWTInspector() {
  const { addToast } = useToast()

  const [rawToken, setRawToken] = useState(() => {
    const p = JWT_PRESETS[0]
    return createJWT(p.header, p.payload, p.secret)
  })
  const [secret, setSecret] = useState(DEFAULT_SECRET)

  // Auditoría en tiempo real
  const inspection = useMemo(() => {
    return inspectJWT(rawToken, secret)
  }, [rawToken, secret])

  const handleLoadPreset = (preset) => {
    const token = createJWT(preset.header, preset.payload, preset.secret)
    setRawToken(token)
    setSecret(preset.secret)
    addToast({
      type: 'info',
      title: 'Preset Cargado',
      message: `Ejemplo "${preset.label}" cargado en el inspector.`,
    })
  }

  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text)
    addToast({
      type: 'success',
      title: 'Copiado al Portapapeles',
      message: `${label} copiado exitosamente.`,
    })
  }

  return (
    <section className="jwt-inspector-section" aria-label="Inspector y Validador Criptográfico de Tokens JWT">
      {/* ── Encabezado ── */}
      <div className="jwt-inspector-header">
        <div>
          <div className="jwt-badge-wrapper">
            <span className="badge badge--brand">🔐 Criptografía RFC 7519</span>
            <span className="badge badge--success">HMAC-SHA256</span>
          </div>
          <h2 className="jwt-inspector-title">
            Inspector, Decodificador & Validador de Tokens JWT
          </h2>
          <p className="jwt-inspector-subtitle">
            Inspecciona las 3 secciones de un token JWT, audita la vigencia de los claims y verifica la firma criptográfica en tiempo real contra ataques de falsificación.
          </p>
        </div>

        {/* Presets */}
        <div className="jwt-presets-bar">
          {JWT_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="jwt-preset-btn"
              onClick={() => handleLoadPreset(p)}
            >
              <span className="jwt-preset-title">{p.label}</span>
              <span className={`jwt-preset-tag jwt-preset-tag--${p.type === 'Seguro' ? 'secure' : p.type === 'Ataque Crítico' ? 'danger' : 'warning'}`}>
                {p.type}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Visualizador de Token Completo ── */}
      <div className="jwt-encoded-card">
        <div className="jwt-encoded-header">
          <label htmlFor="jwt-raw-input" className="jwt-label">
            Token JWT Codificado (Base64URL):
          </label>
          <button
            type="button"
            className="jwt-btn-copy"
            onClick={() => handleCopy(rawToken, 'Token JWT')}
          >
            Copiar Token
          </button>
        </div>

        <textarea
          id="jwt-raw-input"
          className="jwt-textarea jwt-raw-token-input"
          rows={3}
          value={rawToken}
          onChange={(e) => setRawToken(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        />

        {/* Formateo Coloreado de 3 partes */}
        {inspection.isValidFormat && inspection.rawParts && (
          <div className="jwt-colored-parts-preview">
            <span className="jwt-part jwt-part--header" title="Header (Algoritmo y Tipo)">
              {inspection.rawParts.header}
            </span>
            <span className="jwt-dot">.</span>
            <span className="jwt-part jwt-part--payload" title="Payload (Claims y Datos)">
              {inspection.rawParts.payload}
            </span>
            <span className="jwt-dot">.</span>
            <span className="jwt-part jwt-part--signature" title="Signature (Firma HMAC)">
              {inspection.rawParts.signature || '(sin firma)'}
            </span>
          </div>
        )}
      </div>

      {/* ── Paneles de Decodificación ── */}
      {inspection.isValidFormat ? (
        <div className="jwt-decoded-grid">
          {/* Panel Header */}
          <div className="jwt-panel-card jwt-panel-card--header">
            <div className="jwt-panel-header">
              <span className="jwt-panel-tag jwt-panel-tag--header">HEADER: ALGORITMO & TIPO</span>
              <span className="jwt-part-label">Parte 1</span>
            </div>
            <pre className="jwt-json-block">
              <code>{JSON.stringify(inspection.header, null, 2)}</code>
            </pre>
          </div>

          {/* Panel Payload */}
          <div className="jwt-panel-card jwt-panel-card--payload">
            <div className="jwt-panel-header">
              <span className="jwt-panel-tag jwt-panel-tag--payload">PAYLOAD: CLAIMS DE DATOS</span>
              <span className="jwt-part-label">Parte 2</span>
            </div>
            <pre className="jwt-json-block">
              <code>{JSON.stringify(inspection.payload, null, 2)}</code>
            </pre>
            <div className="jwt-claim-status">
              <strong>Estado de Expiración:</strong> {inspection.expiryStatus}
            </div>
          </div>

          {/* Panel Signature */}
          <div className="jwt-panel-card jwt-panel-card--signature">
            <div className="jwt-panel-header">
              <span className="jwt-panel-tag jwt-panel-tag--signature">SIGNATURE: VERIFICACIÓN CRIPTOGRÁFICA</span>
              <span className="jwt-part-label">Parte 3</span>
            </div>

            <div className="jwt-secret-input-box">
              <label htmlFor="jwt-secret-input" className="jwt-label">
                Clave Secreta Compartida (HMAC-SHA256):
              </label>
              <input
                id="jwt-secret-input"
                type="text"
                className="jwt-input"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Ingresa la clave secreta para validar..."
              />
            </div>

            {/* Badge de Verificación */}
            <div className="jwt-verification-badge-container">
              {inspection.isAlgNone ? (
                <div className="jwt-status-banner jwt-status-banner--critical">
                  🚨 <strong>VULNERABLE:</strong> El token utiliza <code>alg: "none"</code>. No posee firma criptográfica.
                </div>
              ) : !secret ? (
                <div className="jwt-status-banner jwt-status-banner--neutral">
                  ℹ️ Ingrese una clave secreta para verificar la firma digital.
                </div>
              ) : inspection.isSignatureValid ? (
                <div className="jwt-status-banner jwt-status-banner--valid">
                  🛡️ <strong>FIRMA VÁLIDA:</strong> La firma coincide exactamente con el contenido y la clave secreta.
                </div>
              ) : (
                <div className="jwt-status-banner jwt-status-banner--invalid">
                  ❌ <strong>FIRMA INVÁLIDA:</strong> El contenido del token fue alterado o la clave secreta es incorrecta.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="jwt-error-banner" role="alert">
          ⚠️ {inspection.error}
        </div>
      )}

      {/* ── Auditoría de Vulnerabilidades y Malas Prácticas ── */}
      {inspection.isValidFormat && inspection.securityWarnings.length > 0 && (
        <div className="jwt-audit-panel">
          <h3 className="jwt-audit-title">🛡️ Auditoría de Seguridad OWASP (Diagnóstico de Riesgos)</h3>
          <div className="jwt-audit-list">
            {inspection.securityWarnings.map((w, idx) => (
              <div key={idx} className={`jwt-audit-item jwt-audit-item--${w.level.toLowerCase()}`}>
                <div className="jwt-audit-item-top">
                  <span className={`badge badge--${w.level === 'CRITICAL' ? 'danger' : w.level === 'HIGH' ? 'warning' : 'neutral'}`}>
                    {w.level}
                  </span>
                  <strong>{w.title}</strong>
                </div>
                <p className="jwt-audit-desc">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default JWTInspector
