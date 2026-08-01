/**
 * @fileoverview Modal — Componente accesible de ventana modal (Diálogo).
 *
 * CARACTERÍSTICAS DE ACCESIBILIDAD Y SEGURIDAD:
 * - Renderizado en Portal (document.body) mediante ReactDOM.createPortal.
 * - Captura y atrapado de foco (Focus Trap) para navegación por teclado (Tab/Shift+Tab).
 * - Cierre automático con la tecla Escape.
 * - Deshabilitado temporal del scroll de la página de fondo.
 * - Atributos WAI-ARIA (role="dialog", aria-modal="true", aria-labelledby).
 *
 * @module components/ui/Modal
 */
import { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

/**
 * Componente Modal accesible.
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   title: string,
 *   children: React.ReactNode,
 *   footer?: React.ReactNode
 * }} props
 */
export function Modal({ isOpen, onClose, title, children, footer }) {
  const modalId = useId()
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  // Manejo de tecla Escape y bloqueo de scroll en body
  useEffect(() => {
    if (!isOpen) return

    // Guardar el elemento previamente enfocado para restaurar foco al cerrar
    previousFocusRef.current = document.activeElement
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      // Atrapado de foco (Focus Trap)
      if (event.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )

        if (focusables.length === 0) return

        const firstElement = focusables[0]
        const lastElement = focusables[focusables.length - 1]

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // Dar foco al primer elemento enfocable o a la ventana modal
    setTimeout(() => {
      if (modalRef.current) {
        const firstInput = modalRef.current.querySelector('button, input, [tabindex]')
        if (firstInput) {
          firstInput.focus()
        }
      }
    }, 50)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modalId}-title`}
      >
        <header className="modal-header">
          <h2 id={`${modalId}-title`} className="modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar ventana modal"
          >
            ×
          </button>
        </header>

        <div className="modal-body">{children}</div>

        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>,
    document.body
  )
}

export default Modal
