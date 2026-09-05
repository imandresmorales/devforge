/**
 * @fileoverview Componente PasswordCryptoExplorer — Explorador de hashing de contraseñas KDF y cálculo de entropía NIST (Mejora 58).
 *
 * CARACTERÍSTICAS:
 * - Calculador de entropía de Shannon conforme a NIST SP 800-63B en tiempo real.
 * - Comparativa de derivación de claves: Argon2id vs bcrypt vs PBKDF2 vs Hashes rápidos (MD5).
 * - Estimador de costes y tiempos de crackeo con clusters de GPUs modernas.
 * - Generador de contraseñas de alta entropía con un solo clic.
 *
 * @module components/ui/PasswordCryptoExplorer
 */
import { useState, useMemo } from 'react'
import {
  calculateEntropy,
  simulateKDFHashes,
  generateStrongPassword,
} from '../../../utils/passwordCrypto'
import { useToast } from '../../../context/ToastContext'
import './PasswordCryptoExplorer.css'

const PRESET_PASSWORDS = [
  { label: 'Común / Filtrada', pass: 'password123', type: 'Vulnerable' },
  { label: 'Básica con Números', pass: 'DevForge2024', type: 'Media' },
  { label: 'Compleja Alfanumérica', pass: 'kX9#mQ2$vL8!zW5@', type: 'Fuerte' },
  { label: 'Frase de Paso (Passphrase)', pass: 'correct-horse-battery-staple-2026', type: 'Muy Fuerte' },
]

function PasswordCryptoExplorer() {
  const { addToast } = useToast()

  const [password, setPassword] = useState('kX9#mQ2$vL8!zW5@')
  const [showPassword, setShowPassword] = useState(true)

  // Métricas de entropía
  const entropyReport = useMemo(() => {
    return calculateEntropy(password)
  }, [password])

  // Hashes KDF simulados
  const kdfList = useMemo(() => {
    return simulateKDFHashes(password)
  }, [password])

  const handleGeneratePassword = () => {
    const strong = generateStrongPassword({ length: 18 })
    setPassword(strong)
    addToast({
      type: 'success',
      title: 'Contraseña Generada',
      message: 'Nueva contraseña criptográficamente segura creada (18 caracteres).',
    })
  }

  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text)
    addToast({
      type: 'success',
      title: 'Copiado',
      message: `${label} copiado al portapapeles.`,
    })
  }

  return (
    <section className="password-crypto-section" aria-label="Explorador de Hashing KDF y Entropía NIST">
      {/* ── Encabezado ── */}
      <div className="password-crypto-header">
        <div>
          <div className="pw-badge-wrapper">
            <span className="badge badge--brand">🔒 OWASP ASVS v4.0 & NIST</span>
            <span className="badge badge--success">Argon2id / bcrypt / PBKDF2</span>
          </div>
          <h2 className="password-crypto-title">
            Explorador de Hashing KDF & Calculador de Entropía NIST
          </h2>
          <p className="password-crypto-subtitle">
            Audita la fuerza y entropía real de contraseñas, analiza cómo las funciones de derivación de claves (KDF) protegen contra fuerza bruta en GPUs y comprende por qué MD5 o SHA-256 plano son vulnerables.
          </p>
        </div>

        {/* Acciones */}
        <div className="pw-header-actions">
          <button
            type="button"
            className="btn-primary pw-btn-generate"
            onClick={handleGeneratePassword}
          >
            🎲 Generar Contraseña (18 chars)
          </button>
        </div>
      </div>

      {/* ── Campo de Entrada y Presets ── */}
      <div className="pw-input-card">
        <div className="pw-input-row">
          <div className="pw-input-wrapper">
            <label htmlFor="pw-test-input" className="pw-label">Contraseña a Evaluar:</label>
            <div className="pw-field-container">
              <input
                id="pw-test-input"
                type={showPassword ? 'text' : 'password'}
                className="pw-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa una contraseña..."
              />
              <button
                type="button"
                className="pw-toggle-vis"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          {/* Presets rápidos */}
          <div className="pw-presets-box">
            <span className="pw-presets-label">Ejemplos de Prueba:</span>
            <div className="pw-presets-list">
              {PRESET_PASSWORDS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="pw-preset-btn"
                  onClick={() => setPassword(p.pass)}
                >
                  <span>{p.label}</span>
                  <span className={`pw-preset-chip pw-preset-chip--${p.type === 'Muy Fuerte' || p.type === 'Fuerte' ? 'good' : p.type === 'Media' ? 'avg' : 'bad'}`}>
                    {p.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Medidor de Entropía NIST ── */}
        <div className="pw-entropy-gauge-card">
          <div className="pw-entropy-top">
            <div className="pw-entropy-title-box">
              <span className="pw-entropy-title">Entropía de Shannon (NIST SP 800-63B):</span>
              <span className="pw-entropy-bits">{entropyReport.entropyBits} bits</span>
            </div>
            <span className={`pw-strength-badge pw-strength-badge--${entropyReport.strength.toLowerCase()}`}>
              {entropyReport.strengthLabel}
            </span>
          </div>

          <div className="pw-gauge-track">
            <div
              className={`pw-gauge-fill pw-gauge-fill--${entropyReport.strength.toLowerCase()}`}
              style={{ width: `${Math.min(100, (entropyReport.entropyBits / 100) * 100)}%` }}
            />
          </div>

          <div className="pw-entropy-meta-row">
            <span>Longitud: <strong>{entropyReport.length} caracteres</strong></span>
            <span>Espacio de búsqueda: <strong>{entropyReport.poolSize} caracteres posibles</strong></span>
          </div>

          {/* Feedback de seguridad */}
          <div className="pw-feedback-list">
            {entropyReport.feedback.map((f, idx) => (
              <div key={idx} className="pw-feedback-item">
                <span>{entropyReport.strength === 'VERY_STRONG' || entropyReport.strength === 'STRONG' ? '✅' : '⚠️'}</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Matriz Comparativa de KDFs ── */}
      <div className="pw-kdf-section">
        <h3 className="pw-kdf-title">🧪 Comparativa de Hashing de Almacenamiento (KDF vs Hashes Rápidos)</h3>
        <p className="pw-kdf-subtitle">
          Observe cómo los algoritmos modernos ralentizan intencionalmente el cálculo de hash (Work Factor) para inutilizar ataques con tarjetas gráficas (RTX 4090).
        </p>

        <div className="pw-kdf-grid">
          {kdfList.map((kdf) => (
            <div
              key={kdf.id}
              className={`pw-kdf-card ${kdf.owaspCompliant ? 'pw-kdf-card--secure' : 'pw-kdf-card--vulnerable'}`}
            >
              <div className="pw-kdf-card-top">
                <div>
                  <h4 className="pw-kdf-name">{kdf.name}</h4>
                  <span className="pw-kdf-type">{kdf.type}</span>
                </div>
                <span className={`badge badge--${kdf.owaspCompliant ? 'success' : 'danger'}`}>
                  {kdf.security}
                </span>
              </div>

              <p className="pw-kdf-desc">{kdf.description}</p>

              <div className="pw-kdf-details">
                <div className="pw-kdf-detail-row">
                  <span>Parámetros de Coste:</span>
                  <strong>{kdf.costParams}</strong>
                </div>
                <div className="pw-kdf-detail-row">
                  <span>Resistencia a GPUs:</span>
                  <span className={kdf.owaspCompliant ? 'text-success' : 'text-danger'}>{kdf.gpuResistance}</span>
                </div>
                <div className="pw-kdf-detail-row">
                  <span>Tiempo de Crackeo estimado:</span>
                  <strong className={kdf.owaspCompliant ? 'text-success' : 'text-danger'}>{kdf.crackTimeRTX4090}</strong>
                </div>
              </div>

              {/* Hash Ejemplo */}
              <div className="pw-hash-box">
                <div className="pw-hash-header">
                  <span className="pw-hash-label">Estructura del Hash Almacenado:</span>
                  <button
                    type="button"
                    className="pw-btn-copy-hash"
                    onClick={() => handleCopy(kdf.sampleHash, `Hash ${kdf.name}`)}
                  >
                    Copiar
                  </button>
                </div>
                <code className="pw-hash-code">{kdf.sampleHash}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PasswordCryptoExplorer
