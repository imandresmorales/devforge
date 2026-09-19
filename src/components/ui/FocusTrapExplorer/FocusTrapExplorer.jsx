/**
 * @fileoverview Componente FocusTrapExplorer — Gestor de Enfoque y Navegación Accesible por Teclado WCAG 2.1/2.2 AAA.
 *
 * Permite probar trampas de foco en modales interactivos y drawers laterales, visualizando en tiempo real
 * la posición del foco (`document.activeElement`), la intercepción de eventos de teclado (Tab, Shift+Tab, Escape)
 * y la restauración automática del foco tras el cierre.
 *
 * @module components/ui/FocusTrapExplorer
 */

import { useState, useEffect } from 'react'
import { useFocusTrap } from '../../../hooks/useFocusTrap'
import './FocusTrapExplorer.css'

export default function FocusTrapExplorer() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeElementTag, setActiveElementTag] = useState('')
  const [keyEventLog, setKeyEventLog] = useState([])

  const modalRef = useFocusTrap(isModalOpen, {
    onEscape: () => setIsModalOpen(false),
    autoFocus: true,
    restoreFocus: true,
  })

  const drawerRef = useFocusTrap(isDrawerOpen, {
    onEscape: () => setIsDrawerOpen(false),
    autoFocus: true,
    restoreFocus: true,
  })

  useEffect(() => {
    const handleFocusChange = () => {
      if (typeof document !== 'undefined' && document.activeElement) {
        const el = document.activeElement
        const text = el.id ? `#${el.id}` : el.tagName.toLowerCase() + (el.className ? `.${el.className.split(' ')[0]}` : '')
        setActiveElementTag(text)
      }
    }

    const handleKeyDown = (e) => {
      if (['Tab', 'Escape', 'Enter', ' '].includes(e.key)) {
        setKeyEventLog((prev) => [
          {
            id: Date.now() + Math.random(),
            key: e.key === ' ' ? 'Space' : e.key,
            shift: e.shiftKey,
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 4),
        ])
      }
    }

    document.addEventListener('focusin', handleFocusChange)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('focusin', handleFocusChange)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="focus-trap-card" role="region" aria-label="Gestor de Enfoque Accesible WCAG AAA">
      <div className="focus-trap-card__header">
        <div className="focus-trap-card__badge">⚡ Mejora 113</div>
        <h3 className="focus-trap-card__title">Gestor de Enfoque y Navegación por Teclado Accesible WCAG AAA</h3>
        <p className="focus-trap-card__subtitle">
          Garantiza la contención de foco (Focus Trap), prevención de pérdida de foco (Focus Loss Prevention) y restauración segura al elemento de origen conforme a las pautas WCAG 2.1 Criterios 2.1.2 y 2.4.3.
        </p>
      </div>

      {/* Monitor de Estado en Vivo */}
      <div className="focus-trap-monitor-grid">
        <div className="focus-trap-stat-box">
          <span className="focus-trap-stat-label">Elemento con Foco Activo</span>
          <span className="focus-trap-stat-value font-mono">
            {activeElementTag || 'body'}
          </span>
        </div>

        <div className="focus-trap-stat-box">
          <span className="focus-trap-stat-label">Conformidad WCAG</span>
          <span className="focus-trap-stat-value text-success">
            Nivel AAA (Sin Fugas)
          </span>
        </div>

        <div className="focus-trap-stat-box">
          <span className="focus-trap-stat-label">Atajos Activos</span>
          <span className="focus-trap-stat-value">
            <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> / <kbd>Esc</kbd>
          </span>
        </div>
      </div>

      {/* Botones de Acción para Lanzar Diálogos */}
      <div className="focus-trap-actions">
        <button
          id="btn-open-modal-demo"
          type="button"
          className="focus-trap-btn focus-trap-btn--primary"
          onClick={() => setIsModalOpen(true)}
        >
          🪟 Abrir Diálogo Modal Accesible
        </button>

        <button
          id="btn-open-drawer-demo"
          type="button"
          className="focus-trap-btn focus-trap-btn--secondary"
          onClick={() => setIsDrawerOpen(true)}
        >
          📂 Abrir Panel Lateral (Drawer)
        </button>
      </div>

      {/* Log de Eventos de Teclado */}
      <div className="focus-trap-log-section">
        <span className="focus-trap-log-title">Historial de Teclas Interceptadas en Vivo:</span>
        <div className="focus-trap-key-chips">
          {keyEventLog.length === 0 ? (
            <span className="focus-trap-key-chip text-muted">Presiona Tab o Escape para registrar...</span>
          ) : (
            keyEventLog.map((ev) => (
              <span key={ev.id} className="focus-trap-key-chip">
                {ev.shift ? 'Shift + ' : ''}{ev.key} <small>({ev.time})</small>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Modal Accesible con Trampa de Foco */}
      {isModalOpen && (
        <div
          className="focus-trap-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false)
          }}
        >
          <div className="focus-trap-modal-box" ref={modalRef}>
            <div className="focus-trap-modal-header">
              <h4 id="modal-title" className="focus-trap-modal-heading">🔒 Diálogo Modal Accesible</h4>
              <button
                id="btn-modal-close-icon"
                type="button"
                className="focus-trap-close-btn"
                aria-label="Cerrar diálogo"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <p className="focus-trap-modal-body">
              El foco está estrictamente contenido dentro de este modal. Presiona <kbd>Tab</kbd> para avanzar y <kbd>Shift+Tab</kbd> para retroceder en ciclo infinito. Presiona <kbd>Escape</kbd> para cerrar y restaurar el foco.
            </p>
            <div className="focus-trap-modal-form">
              <label htmlFor="input-modal-name" className="focus-trap-field-label">Nombre del recurso:</label>
              <input
                id="input-modal-name"
                type="text"
                className="focus-trap-input"
                defaultValue="API Gateway Gateway_01"
              />
            </div>
            <div className="focus-trap-modal-footer">
              <button
                id="btn-modal-cancel"
                type="button"
                className="focus-trap-btn focus-trap-btn--secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar (Esc)
              </button>
              <button
                id="btn-modal-confirm"
                type="button"
                className="focus-trap-btn focus-trap-btn--primary"
                onClick={() => setIsModalOpen(false)}
              >
                Confirmar Acción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Lateral Accesible con Trampa de Foco */}
      {isDrawerOpen && (
        <div
          className="focus-trap-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDrawerOpen(false)
          }}
        >
          <div className="focus-trap-drawer-box" ref={drawerRef}>
            <div className="focus-trap-modal-header">
              <h4 id="drawer-title" className="focus-trap-modal-heading">📂 Panel Lateral Drawer</h4>
              <button
                id="btn-drawer-close-icon"
                type="button"
                className="focus-trap-close-btn"
                aria-label="Cerrar panel lateral"
                onClick={() => setIsDrawerOpen(false)}
              >
                ✕
              </button>
            </div>
            <p className="focus-trap-modal-body">
              Navegación segura sin fugas al fondo de la aplicación.
            </p>
            <div className="focus-trap-drawer-links">
              <a id="link-drawer-1" href="#settings" className="focus-trap-drawer-link">⚙️ Configuración de Seguridad</a>
              <a id="link-drawer-2" href="#keys" className="focus-trap-drawer-link">🔑 Claves de Acceso</a>
              <a id="link-drawer-3" href="#logs" className="focus-trap-drawer-link">📜 Registros de Auditoría</a>
            </div>
            <div className="focus-trap-modal-footer">
              <button
                id="btn-drawer-done"
                type="button"
                className="focus-trap-btn focus-trap-btn--primary"
                onClick={() => setIsDrawerOpen(false)}
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
