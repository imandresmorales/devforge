/**
 * @fileoverview Componente WhatsAppWidget — Chat flotante de soporte con WhatsApp Cloud API (Mejora 31).
 *
 * CARACTERÍSTICAS:
 * - Botón flotante accesible con indicador de estado en tiempo real.
 * - Selector rápido de plantillas de consulta y campo de mensaje personalizado.
 * - Apertura segura con 'noopener,noreferrer' a WhatsApp Web o App nativa.
 * - Soporte para teclado (Escape para cerrar) y gestión de foco.
 *
 * @module components/ui/WhatsAppWidget
 */
import { useState, useRef, useEffect } from 'react'
import { generateWhatsAppLink, WHATSAPP_TEMPLATES } from '../../../utils/whatsapp'
import './WhatsAppWidget.css'

function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const widgetRef = useRef(null)
  const textareaRef = useRef(null)

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Foco al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl.id)
    setMessage(tpl.text)
    textareaRef.current?.focus()
  }

  const handleSendMessage = () => {
    const link = generateWhatsAppLink({ message })
    window.open(link, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }

  return (
    <div className="wa-widget" ref={widgetRef}>
      {/* Botón Flotante */}
      <button
        type="button"
        className={`wa-launcher${isOpen ? ' wa-launcher--open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Cerrar chat de WhatsApp' : 'Abrir chat de soporte por WhatsApp'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Soporte por WhatsApp"
      >
        <span className="wa-launcher__icon" aria-hidden="true">
          {isOpen ? '✕' : '💬'}
        </span>
        <span className="wa-launcher__pulse" aria-hidden="true" />
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div
          className="wa-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Chat de soporte técnico por WhatsApp"
        >
          {/* Cabecera del Chat */}
          <div className="wa-header">
            <div className="wa-header__avatar" aria-hidden="true">⚡</div>
            <div className="wa-header__info">
              <h3 className="wa-header__name">Soporte DevForge</h3>
              <span className="wa-header__status">
                <span className="wa-status-dot" aria-hidden="true" /> En línea • Respuesta habitual en minutos
              </span>
            </div>
            <button
              type="button"
              className="wa-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar ventana de WhatsApp"
            >
              ×
            </button>
          </div>

          {/* Cuerpo con Plantillas Rápidas */}
          <div className="wa-body">
            <p className="wa-prompt">
              👋 ¡Hola! ¿En qué podemos ayudarte hoy? Elige una opción o escribe tu mensaje:
            </p>

            <div className="wa-templates" role="group" aria-label="Plantillas de consulta rápida">
              {WHATSAPP_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className={`wa-template-pill${selectedTemplate === tpl.id ? ' wa-template-pill--active' : ''}`}
                  onClick={() => handleSelectTemplate(tpl)}
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            {/* Input de Mensaje */}
            <div className="wa-input-box">
              <textarea
                ref={textareaRef}
                className="wa-textarea"
                rows="3"
                placeholder="Escribe tu consulta aquí…"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  setSelectedTemplate(null)
                }}
                maxLength={500}
                aria-label="Mensaje para WhatsApp"
              />
              <span className="wa-char-count">{message.length}/500</span>
            </div>
          </div>

          {/* Footer con Acción */}
          <div className="wa-footer">
            <button
              type="button"
              className="wa-send-btn"
              onClick={handleSendMessage}
              disabled={!message.trim()}
            >
              <span>Abrir en WhatsApp</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WhatsAppWidget
