/**
 * @fileoverview Modal de Consentimiento OAuth 2.0 interactivo (Mejora 30).
 *
 * CARACTERÍSTICAS:
 * - Simula la pantalla de autorización OAuth (Google / GitHub).
 * - Muestra permisos solicitados (perfil público y correo electrónico).
 * - Genera el código de autorización tras la confirmación del usuario.
 *
 * @module components/ui/OAuthConsentModal
 */
import { useState } from 'react'
import Modal from '../Modal/Modal.jsx'
import { generateOAuthParams, exchangeOAuthCode } from '../../../utils/oauth'
import './OAuthConsentModal.css'

function OAuthConsentModal({ isOpen, onClose, provider = 'google', onAuthSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const isGoogle = provider === 'google'

  const providerName = isGoogle ? 'Google' : 'GitHub'
  const providerIcon = isGoogle ? '🌐' : '🐙'

  const handleAuthorize = async () => {
    setIsProcessing(true)

    try {
      const { verifier } = generateOAuthParams()
      const authCode = `code_${provider}_${Math.random().toString(36).slice(2, 12)}_${Date.now()}`

      const result = await exchangeOAuthCode(provider, authCode, verifier)
      onAuthSuccess(result.profile, result.accessToken)
      onClose()
    } catch (err) {
      console.error('[OAuth] Error en autorización:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Autorizar con ${providerName}`}
    >
      <div className="oauth-consent">
        {/* Cabecera del Proveedor */}
        <div className={`oauth-consent__header oauth-consent__header--${provider}`}>
          <span className="oauth-consent__icon" aria-hidden="true">{providerIcon}</span>
          <div>
            <h3 className="oauth-consent__title">DevForge solicita acceso</h3>
            <p className="oauth-consent__subtitle">a tu cuenta de {providerName}</p>
          </div>
        </div>

        {/* Alcance de Permisos Solicitados */}
        <div className="oauth-consent__scopes">
          <p className="oauth-consent__scopes-label">Esta aplicación podrá:</p>
          <ul className="oauth-consent__scopes-list">
            <li>
              <span className="oauth-check" aria-hidden="true">✓</span>
              <span>Ver tu información de perfil público (nombre y avatar)</span>
            </li>
            <li>
              <span className="oauth-check" aria-hidden="true">✓</span>
              <span>Ver tu dirección de correo electrónico principal</span>
            </li>
          </ul>
        </div>

        <div className="oauth-consent__disclaimer">
          <small>
            🔒 DevForge nunca tendrá acceso a tus contraseñas ni a tus repositorios privados.
            Cumple con estándares OAuth 2.0 y PKCE (RFC 7636).
          </small>
        </div>

        {/* Acciones */}
        <div className="oauth-consent__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`btn-primary oauth-btn--${provider}`}
            onClick={handleAuthorize}
            disabled={isProcessing}
          >
            {isProcessing ? 'Conectando…' : `Continuar con ${providerName}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default OAuthConsentModal
