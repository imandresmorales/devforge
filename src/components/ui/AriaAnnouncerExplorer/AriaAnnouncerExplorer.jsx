/**
 * @fileoverview Componente AriaAnnouncerExplorer — Consola de Anuncios ARIA Live Regions en Vivo.
 *
 * Permite probar anuncios para lectores de pantalla en tiempo real en los modos 'polite' y 'assertive',
 * visualizando la cola de mensajes y el contenido real sincronizado en el DOM accesible.
 *
 * @module components/ui/AriaAnnouncerExplorer
 */

import { useState } from 'react'
import { useAriaAnnouncer } from '../../../hooks/useAriaAnnouncer'
import './AriaAnnouncerExplorer.css'

export default function AriaAnnouncerExplorer() {
  const { announcePolite, announceAssertive, clear } = useAriaAnnouncer()
  const [customMsg, setCustomMsg] = useState('Nuevo informe de seguridad compilado con éxito')
  const [history, setHistory] = useState([])

  const logAndAnnounce = (msg, politeness) => {
    if (!msg.trim()) return

    if (politeness === 'assertive') {
      announceAssertive(msg)
    } else {
      announcePolite(msg)
    }

    setHistory((prev) => [
      {
        id: Date.now() + Math.random(),
        text: msg,
        type: politeness,
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 5),
    ])
  }

  return (
    <div className="aria-announcer-card" role="region" aria-label="Anunciador ARIA Live Regions">
      <div className="aria-announcer-card__header">
        <div className="aria-announcer-card__badge">⚡ Mejora 115</div>
        <h3 className="aria-announcer-card__title">Anunciador Universal de Regiones Vivas ARIA (Screen Readers)</h3>
        <p className="aria-announcer-card__subtitle">
          Provee notificaciones no intrusivas en tiempo real a tecnologías de asistencia mediante regiones <code className="font-mono">aria-live="polite"</code> (status) y <code className="font-mono">aria-live="assertive"</code> (alert) según WCAG 2.1 Criterio 4.1.3.
        </p>
      </div>

      {/* Acciones Rápidas */}
      <div className="aria-announcer-actions-grid">
        <button
          type="button"
          className="aria-btn aria-btn--polite"
          onClick={() => logAndAnnounce('Paginación actualizada: mostrando página 2 de resultados', 'polite')}
        >
          🗣️ Anuncio Polite (Cambio de página)
        </button>

        <button
          type="button"
          className="aria-btn aria-btn--polite"
          onClick={() => logAndAnnounce('Descarga de informe completada en segundo plano', 'polite')}
        >
          📥 Anuncio Polite (Descarga lista)
        </button>

        <button
          type="button"
          className="aria-btn aria-btn--assertive"
          onClick={() => logAndAnnounce('⚠️ Alerta Crítica: Conexión con el servidor interrumpida', 'assertive')}
        >
          🚨 Anuncio Assertive (Alerta de Red)
        </button>

        <button
          type="button"
          className="aria-btn aria-btn--assertive"
          onClick={() => logAndAnnounce('❌ Error 403: Sesión expirada, redirigiendo a login', 'assertive')}
        >
          ⛔ Anuncio Assertive (Sesión Expirada)
        </button>
      </div>

      {/* Formulario de Anuncio Personalizado */}
      <div className="aria-custom-form">
        <label htmlFor="custom-aria-input" className="aria-form-label">
          Mensaje Personalizado para el Lector de Pantalla:
        </label>
        <div className="aria-input-row">
          <input
            id="custom-aria-input"
            type="text"
            className="aria-input"
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            placeholder="Escribe un mensaje de estado..."
          />
          <button
            type="button"
            className="aria-btn aria-btn--submit-polite"
            onClick={() => logAndAnnounce(customMsg, 'polite')}
          >
            Emitir Polite
          </button>
          <button
            type="button"
            className="aria-btn aria-btn--submit-assertive"
            onClick={() => logAndAnnounce(customMsg, 'assertive')}
          >
            Emitir Assertive
          </button>
          <button
            type="button"
            className="aria-btn aria-btn--clear"
            onClick={() => {
              clear()
              setHistory([])
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Historial de Anuncios Emitidos */}
      <div className="aria-history-box">
        <span className="aria-history-title">Registro de Anuncios Transmitidos al AOM:</span>
        {history.length === 0 ? (
          <p className="aria-history-empty">No se han emitido anuncios recientes en esta sesión.</p>
        ) : (
          <ul className="aria-history-list">
            {history.map((item) => (
              <li key={item.id} className={`aria-history-item aria-history-item--${item.type}`}>
                <span className="aria-history-item__badge">{item.type.toUpperCase()}</span>
                <span className="aria-history-item__text">{item.text}</span>
                <span className="aria-history-item__time font-mono">{item.time}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
