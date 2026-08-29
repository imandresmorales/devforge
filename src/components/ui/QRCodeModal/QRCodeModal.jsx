/**
 * @fileoverview Modal generador de códigos QR interactivo (Mejora 33).
 *
 * CARACTERÍSTICAS:
 * - Selección rápida de contenido (URL del Repo, Soporte WhatsApp, 2FA OTP, Checkout Stripe).
 * - Previsualización vectorial SVG en vivo y descarga en SVG / PNG.
 * - Copia directa del enlace al portapapeles con toast de confirmación.
 *
 * @module components/ui/QRCodeModal
 */
import { useState, useMemo } from 'react'
import Modal from '../Modal/Modal.jsx'
import { generateQRCodeSVG } from '../../../utils/qrCode'
import { useToast } from '../../../context/ToastContext'
import './QRCodeModal.css'

const PRESETS = [
  {
    id: 'repo',
    label: '🐙 Repositorio GitHub',
    value: 'https://github.com/imandresmorales/devforge',
    desc: 'Escanea para ver el código fuente en GitHub.',
  },
  {
    id: 'whatsapp',
    label: '💬 Soporte WhatsApp',
    value: 'https://wa.me/573001234567?text=Hola%20DevForge%2C%20necesito%20soporte',
    desc: 'Escanea para iniciar un chat directo de soporte.',
  },
  {
    id: '2fa',
    label: '🔐 Configuración 2FA',
    value: 'otpauth://totp/DevForge:andres@devforge.com?secret=JBSWY3DPEHPK3PXP&issuer=DevForge',
    desc: 'Escanea en Google Authenticator o Authy.',
  },
  {
    id: 'pricing',
    label: '💳 Suscripción Pro',
    value: 'https://devforge.app/pricing',
    desc: 'Escanea para abrir la pasarela de planes en el móvil.',
  },
]

function QRCodeModal({ isOpen, onClose }) {
  const [selectedPreset, setSelectedPreset] = useState('repo')
  const [customText, setCustomText] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const { addToast } = useToast()

  const currentText = useMemo(() => {
    if (isCustom) return customText || 'https://github.com/imandresmorales/devforge'
    const found = PRESETS.find((p) => p.id === selectedPreset)
    return found ? found.value : PRESETS[0].value
  }, [isCustom, customText, selectedPreset])

  const svgString = useMemo(() => {
    return generateQRCodeSVG({ text: currentText, size: 220 })
  }, [currentText])

  const handleDownloadSVG = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `devforge-qr-${selectedPreset}.svg`
    a.click()
    URL.revokeObjectURL(url)
    addToast({
      type: 'success',
      title: 'QR Descargado',
      message: 'El archivo SVG vectorial ha sido guardado.',
    })
  }

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(currentText)
    addToast({
      type: 'info',
      title: 'Enlace Copiado',
      message: 'La URL del código QR se copió al portapapeles.',
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generador de Código QR">
      <div className="qr-modal">
        {/* Presets */}
        <div className="qr-presets" role="group" aria-label="Tipos de código QR">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`qr-preset-btn${!isCustom && selectedPreset === p.id ? ' qr-preset-btn--active' : ''}`}
              onClick={() => {
                setSelectedPreset(p.id)
                setIsCustom(false)
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            className={`qr-preset-btn${isCustom ? ' qr-preset-btn--active' : ''}`}
            onClick={() => setIsCustom(true)}
          >
            ✏️ Personalizado
          </button>
        </div>

        {/* Input personalizado */}
        {isCustom && (
          <div className="qr-custom-input">
            <label className="form-label" htmlFor="qr-custom-field">
              Texto o URL a codificar:
            </label>
            <input
              id="qr-custom-field"
              type="text"
              className="form-input"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="https://tu-enlace.com"
            />
          </div>
        )}

        {/* Previsualización del QR */}
        <div className="qr-preview-card">
          <div
            className="qr-svg-wrapper"
            dangerouslySetInnerHTML={{ __html: svgString }}
          />
          <div className="qr-info">
            <span className="qr-info__label">Contenido codificado:</span>
            <code className="qr-info__code">{currentText}</code>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="qr-actions">
          <button type="button" className="btn-secondary" onClick={handleCopyLink}>
            📋 Copiar Enlace
          </button>
          <button type="button" className="btn-primary" onClick={handleDownloadSVG}>
            ⬇️ Descargar SVG
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default QRCodeModal
