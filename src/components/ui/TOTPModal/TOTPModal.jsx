/**
 * @fileoverview Componente TOTPModal — Generador y verificador interactivo de códigos 2FA TOTP (Mejora 51).
 *
 * CARACTERÍSTICAS:
 * - Temporizador circular animado con cuenta regresiva de 30 segundos.
 * - Código TOTP de 6 dígitos autogenerado y reactivo al tiempo.
 * - Verificador de códigos en tiempo real con feedback de validez.
 * - Copiado rápido de la clave secreta y visualizador de URI otpauth.
 *
 * @module components/ui/TOTPModal
 */
import { useState, useEffect } from 'react'
import Modal from '../Modal/Modal.jsx'
import {
  generateBase32Secret,
  generateTOTP,
  verifyTOTP,
  generateOtpAuthURI,
} from '../../../utils/totp'
import { useToast } from '../../../context/ToastContext'
import './TOTPModal.css'

function TOTPModal({ isOpen, onClose }) {
  const [secret, setSecret] = useState('DEVFORGE2FASECRET')
  const [totpData, setTotpData] = useState(generateTOTP('DEVFORGE2FASECRET'))
  const [testCode, setTestCode] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const { addToast } = useToast()

  // Timer de 1 segundo para recalcular el código y la barra de 30s
  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      setTotpData(generateTOTP(secret))
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, secret])

  const handleGenerateNewSecret = () => {
    const newSec = generateBase32Secret(16)
    setSecret(newSec)
    setTotpData(generateTOTP(newSec))
    setTestCode('')
    setVerificationResult(null)
    addToast({
      type: 'info',
      title: 'Nueva Clave Secreta',
      message: 'Se ha generado una nueva semilla Base32 de 16 caracteres.',
    })
  }

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(totpData.code)
    addToast({
      type: 'success',
      title: 'Código Copiado',
      message: `Código ${totpData.code} copiado al portapapeles.`,
    })
  }

  const handleCopySecret = () => {
    navigator.clipboard?.writeText(secret)
    addToast({
      type: 'info',
      title: 'Clave Secreta Copiada',
      message: 'Clave Base32 copiada para configurar tu app de 2FA.',
    })
  }

  const handleVerify = (e) => {
    e?.preventDefault()
    if (!testCode.trim()) return

    const res = verifyTOTP(testCode, secret)
    setVerificationResult(res)
  }

  const otpUri = generateOtpAuthURI('alex@devforge.io', secret, 'DevForge')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔐 Autenticación de Dos Factores (2FA / TOTP)">
      <div className="totp-modal">
        {/* Panel Superior: Generador con Temporizador de 30s */}
        <div className="totp-generator-card">
          <div className="totp-timer-container">
            <svg className="totp-timer-svg" viewBox="0 0 36 36">
              <path
                className="totp-timer-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="totp-timer-progress"
                strokeDasharray={`${(totpData.remainingSeconds / 30) * 100}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="totp-seconds">{totpData.remainingSeconds}s</span>
          </div>

          <div className="totp-code-box">
            <span className="totp-code-label">Código de Seguridad Dinámico:</span>
            <div className="totp-code-display" onClick={handleCopyCode} title="Clic para copiar código">
              <span className="totp-digits">{totpData.code.slice(0, 3)}</span>
              <span className="totp-digits-sep"> </span>
              <span className="totp-digits">{totpData.code.slice(3, 6)}</span>
            </div>
            <span className="totp-subtext">Expira en {totpData.remainingSeconds} segundos</span>
          </div>
        </div>

        {/* Panel Medio: Clave Secreta y URI */}
        <div className="totp-secret-card">
          <div className="totp-secret-row">
            <div className="totp-secret-info">
              <span className="totp-secret-label">Clave Secreta (Base32):</span>
              <code className="totp-secret-val">{secret}</code>
            </div>
            <div className="totp-secret-actions">
              <button type="button" className="btn-secondary totp-btn-sm" onClick={handleCopySecret}>
                📋 Copiar
              </button>
              <button type="button" className="btn-secondary totp-btn-sm" onClick={handleGenerateNewSecret}>
                🔄 Nueva
              </button>
            </div>
          </div>
          <div className="totp-uri-preview">
            <span>URI OTPAuth: </span>
            <code>{otpUri}</code>
          </div>
        </div>

        {/* Panel Inferior: Verificador Interactivo */}
        <form className="totp-verifier-card" onSubmit={handleVerify}>
          <label className="form-label" htmlFor="totp-test-input">
            🧪 Probar Verificador de Código 2FA:
          </label>
          <div className="totp-verify-row">
            <input
              id="totp-test-input"
              type="text"
              maxLength={6}
              className="totp-input-field"
              value={testCode}
              onChange={(e) => {
                setTestCode(e.target.value.replace(/\D/g, ''))
                setVerificationResult(null)
              }}
              placeholder="Ingresa 6 dígitos…"
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={testCode.length !== 6}
            >
              Verificar
            </button>
          </div>

          {verificationResult !== null && (
            <div
              className={`totp-status-banner${
                verificationResult.isValid ? ' totp-status-banner--success' : ' totp-status-banner--error'
              }`}
            >
              {verificationResult.isValid ? (
                <span>✅ ¡Código 2FA Verificado Correctamente! (Ventana válida)</span>
              ) : (
                <span>❌ Código inválido o expirado. Asegúrate de sincronizar la hora.</span>
              )}
            </div>
          )}
        </form>

        <div className="totp-footer-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default TOTPModal
