/**
 * @fileoverview Componente UI para el Explorador de Autenticación Biométrica WebAuthn & FIDO2 (Mejora 75).
 *
 * Muestra:
 * - Registro interactivo de Passkeys (Apple Touch ID, Windows Hello, YubiKey 5).
 * - Simulación de Inicio de Sesión Passwordless (1-Click Biometric Login con desafío criptográfico y firma).
 * - Bóveda de Passkeys de hardware con detalles de AAGUID, claves públicas ECDSA P-256 y contador anti-replay.
 * - Diagrama del flujo de protocolo FIDO2 / W3C Web Authentication Level 3.
 *
 * @module components/ui/WebAuthnExplorer/WebAuthnExplorer
 */
import { useState, useRef } from 'react'
import {
  WebAuthnRPServer,
  AUTHENTICATOR_MODELS,
  generateChallenge,
} from '../../../utils/webAuthnEngine'
import './WebAuthnExplorer.css'

export default function WebAuthnExplorer() {
  const rpServerRef = useRef(null)
  if (!rpServerRef.current) {
    rpServerRef.current = new WebAuthnRPServer({ rpId: 'devforge.app', rpName: 'DevForge Identity' })
    // Registrar una passkey inicial para demo
    const initialOpt = rpServerRef.current.generateRegistrationOptions({ id: 'usr_demo', username: 'alex@devforge.app' })
    rpServerRef.current.verifyRegistrationResponse({
      credentialId: 'cred_icloud_keychain_884',
      authenticatorModel: 'APPLE_TOUCH_ID',
      publicKey: 'MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEx829034821',
    }, initialOpt.challenge)
  }

  const [selectedDevice, setSelectedDevice] = useState('APPLE_TOUCH_ID')
  const [userName, setUserName] = useState('developer@devforge.app')
  const [activeTab, setActiveTab] = useState('login') // 'login' | 'register' | 'vault'
  const [ceremonyStatus, setCeremonyStatus] = useState(null)
  const [, setTick] = useState(0)

  const passkeys = Array.from(rpServerRef.current.passkeyVault.values())

  const handleRegisterPasskey = () => {
    setCeremonyStatus({ step: 'PROMPTING_BIOMETRICS', message: 'Esperando confirmación de huella / rostro en el dispositivo...' })

    setTimeout(() => {
      const server = rpServerRef.current
      const options = server.generateRegistrationOptions({ id: 'usr_active', username: userName })

      const fakeCredId = `cred_${selectedDevice.toLowerCase()}_${generateChallenge(8)}`
      const res = server.verifyRegistrationResponse({
        credentialId: fakeCredId,
        authenticatorModel: selectedDevice,
      }, options.challenge)

      if (res.success) {
        setCeremonyStatus({
          step: 'SUCCESS',
          type: 'register',
          message: '✅ ¡Passkey creada y respaldada en el enclave de seguridad!',
          details: res.passkey,
        })
      } else {
        setCeremonyStatus({ step: 'ERROR', message: res.error })
      }
      setTick((t) => t + 1)
    }, 600)
  }

  const handlePasswordlessLogin = (passkey) => {
    setCeremonyStatus({ step: 'PROMPTING_BIOMETRICS', message: `Verificando presencia del usuario con ${passkey.authenticatorName}...` })

    setTimeout(() => {
      const server = rpServerRef.current
      const authOptions = server.generateAuthenticationOptions(passkey.userId)

      const res = server.verifyAuthenticationResponse({
        credentialId: passkey.credentialId,
        counter: passkey.signCounter + 1,
      }, authOptions.challenge)

      if (res.success) {
        setCeremonyStatus({
          step: 'SUCCESS',
          type: 'login',
          message: '🔓 ¡Autenticación Biométrica Exitosa! Sesión iniciada sin contraseña.',
          details: res.passkeyUsed,
        })
      } else {
        setCeremonyStatus({ step: 'ERROR', message: res.error })
      }
      setTick((t) => t + 1)
    }, 500)
  }

  const handleRevoke = (credId) => {
    rpServerRef.current.revokePasskey(credId)
    setTick((t) => t + 1)
  }

  return (
    <section className="webauthn-explorer" aria-labelledby="webauthn-title">
      <div className="webauthn-explorer__header">
        <div>
          <span className="badge badge--brand">Seguridad Criptográfica & FIDO2</span>
          <h2 id="webauthn-title" className="webauthn-explorer__title">
            Motor de Autenticación Biométrica WebAuthn & Passkeys
          </h2>
          <p className="webauthn-explorer__desc">
            Experimenta el estándar moderno <strong>Passwordless</strong> respaldado por Apple, Google y Microsoft.
            Claves asimétricas ECDSA P-256 generadas en enclaves de hardware (Secure Enclave / TPM 2.0) inmunes al phishing.
          </p>
        </div>

        <div className="webauthn-tabs">
          <button
            type="button"
            className={`webauthn-tab-btn ${activeTab === 'login' ? 'webauthn-tab-btn--active' : ''}`}
            onClick={() => { setActiveTab('login'); setCeremonyStatus(null); }}
          >
            🔐 Login Passwordless
          </button>
          <button
            type="button"
            className={`webauthn-tab-btn ${activeTab === 'register' ? 'webauthn-tab-btn--active' : ''}`}
            onClick={() => { setActiveTab('register'); setCeremonyStatus(null); }}
          >
            ➕ Registrar Passkey
          </button>
          <button
            type="button"
            className={`webauthn-tab-btn ${activeTab === 'vault' ? 'webauthn-tab-btn--active' : ''}`}
            onClick={() => { setActiveTab('vault'); setCeremonyStatus(null); }}
          >
            🛡️ Bóveda de Claves ({passkeys.length})
          </button>
        </div>
      </div>

      {/* ── Tab 1: Login Passwordless con 1 Clic ── */}
      {activeTab === 'login' && (
        <div className="webauthn-panel">
          <h3 className="webauthn-panel-title">⚡ Inicio de Sesión Biométrico (Assertion Ceremony)</h3>
          <p className="webauthn-panel-desc">
            Haz clic en tu autenticador registrado para validar tu identidad mediante criptografía de clave pública y firma digital.
          </p>

          <div className="webauthn-passkeys-list">
            {passkeys.map((pk) => (
              <div key={pk.credentialId} className="webauthn-passkey-card">
                <div className="webauthn-passkey-icon">{pk.icon}</div>
                <div className="webauthn-passkey-info">
                  <strong>{pk.authenticatorName}</strong>
                  <span className="webauthn-passkey-meta">
                    Contador de Firma: #{pk.signCounter} | AAGUID: <code>{pk.aaguid.substring(0, 8)}...</code>
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handlePasswordlessLogin(pk)}
                >
                  👆 Usar Passkey
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 2: Registro de Nueva Passkey ── */}
      {activeTab === 'register' && (
        <div className="webauthn-panel">
          <h3 className="webauthn-panel-title">➕ Registro de Credencial FIDO2 (Creation Ceremony)</h3>

          <div className="webauthn-form-grid">
            <div className="webauthn-field">
              <label>Usuario / Correo:</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="webauthn-input"
              />
            </div>

            <div className="webauthn-field">
              <label>Seleccionar Autenticador FIDO2 de Hardware:</label>
              <div className="webauthn-device-options">
                {Object.entries(AUTHENTICATOR_MODELS).map(([key, dev]) => (
                  <button
                    key={key}
                    type="button"
                    className={`webauthn-device-btn ${selectedDevice === key ? 'webauthn-device-btn--selected' : ''}`}
                    onClick={() => setSelectedDevice(key)}
                  >
                    <span className="webauthn-dev-icon">{dev.icon}</span>
                    <span className="webauthn-dev-name">{dev.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary webauthn-register-btn"
            onClick={handleRegisterPasskey}
          >
            🛡️ Generar Par de Claves en Hardware (Touch/Face ID)
          </button>
        </div>
      )}

      {/* ── Tab 3: Bóveda de Passkeys Almacenadas ── */}
      {activeTab === 'vault' && (
        <div className="webauthn-panel">
          <h3 className="webauthn-panel-title">🗄️ Bóveda de Claves Públicas FIDO2 (Relying Party Vault)</h3>
          <div className="webauthn-table-wrapper">
            <table className="webauthn-table">
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th>ID de Credencial</th>
                  <th>Algoritmo</th>
                  <th>Contador Anti-Replay</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {passkeys.map((pk) => (
                  <tr key={pk.credentialId}>
                    <td>
                      <span style={{ marginRight: '0.4rem' }}>{pk.icon}</span>
                      <strong>{pk.authenticatorName}</strong>
                    </td>
                    <td><code>{pk.credentialId}</code></td>
                    <td><span className="badge badge--brand">{pk.algorithm}</span></td>
                    <td><code>#{pk.signCounter}</code></td>
                    <td>
                      <button
                        type="button"
                        className="btn-xs btn-danger"
                        onClick={() => handleRevoke(pk.credentialId)}
                      >
                        Revocar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Estado de la Ceremonia Criptográfica ── */}
      {ceremonyStatus && (
        <div className={`webauthn-status-box webauthn-status-box--${ceremonyStatus.step.toLowerCase()}`}>
          <div className="webauthn-status-title">
            {ceremonyStatus.step === 'PROMPTING_BIOMETRICS' && '🔄 Solicitando Aprobación Biométrica...'}
            {ceremonyStatus.step === 'SUCCESS' && '🎉 Ceremonia WebAuthn Completada'}
            {ceremonyStatus.step === 'ERROR' && '❌ Fallo en Ceremonia FIDO2'}
          </div>
          <p className="webauthn-status-desc">{ceremonyStatus.message}</p>
        </div>
      )}

      {/* ── Beneficios de Seguridad FIDO2 ── */}
      <div className="webauthn-footer-props">
        <div className="webauthn-prop-item">
          <span className="webauthn-prop-tag">🛡️ Inmune a Phishing</span>
          <p>La clave privada nunca sale del chip TPM/Secure Enclave y está atada criptográficamente al dominio <code>devforge.app</code>.</p>
        </div>
        <div className="webauthn-prop-item">
          <span className="webauthn-prop-tag">🚫 Sin Fugas de Servidor</span>
          <p>El servidor solo almacena la clave pública; una brecha de datos del backend no expone credenciales de acceso.</p>
        </div>
        <div className="webauthn-prop-item">
          <span className="webauthn-prop-tag">🔄 Protección Anti-Replay</span>
          <p>Cada firma incrementa un contador monótono en hardware que invalida intentos de repetición de paquetes.</p>
        </div>
      </div>
    </section>
  )
}
