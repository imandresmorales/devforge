/**
 * @fileoverview Componente RovingTabindexExplorer — Demostración de Navegación Accesible WAI-ARIA APG.
 *
 * Implementa una barra de herramientas accesible (toolbar) y selector de módulos donde la navegación
 * se realiza íntegramente con flechas de dirección (ArrowLeft / ArrowRight / Home / End) con un único Tab Stop accesible.
 *
 * @module components/ui/RovingTabindexExplorer
 */

import { useRef, useEffect } from 'react'
import { useRovingTabindex } from '../../../hooks/useRovingTabindex'
import './RovingTabindexExplorer.css'

const TOOLBAR_ITEMS = [
  { id: 'view-grid', icon: '📊', label: 'Vista de Gráficos' },
  { id: 'view-code', icon: '💻', label: 'Editor de Código' },
  { id: 'view-security', icon: '🛡️', label: 'Auditoría de Seguridad' },
  { id: 'view-pwa', icon: '📱', label: 'PWA & Sync' },
  { id: 'view-settings', icon: '⚙️', label: 'Ajustes del Sistema' },
]

export default function RovingTabindexExplorer() {
  const itemRefs = useRef([])
  const { activeIndex, setActiveIndex, handleKeyDown, getTabindex } = useRovingTabindex(
    TOOLBAR_ITEMS.length,
    { orientation: 'horizontal', loop: true }
  )

  useEffect(() => {
    if (itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex].focus()
    }
  }, [activeIndex])

  return (
    <div className="roving-card" role="region" aria-label="Navegación Roving Tabindex WCAG AAA">
      <div className="roving-card__header">
        <div className="roving-card__badge">⚡ Mejora 119</div>
        <h3 className="roving-card__title">Navegación por Teclado Roving Tabindex (WAI-ARIA APG)</h3>
        <p className="roving-card__subtitle">
          Agrupa múltiples controles interactivos en una única parada de tabulación (<code className="font-mono">Tab Stop</code>), permitiendo navegar entre ítems con <kbd>←</kbd> <kbd>→</kbd> <kbd>Home</kbd> y <kbd>End</kbd> según las directrices WAI-ARIA.
        </p>
      </div>

      {/* Barra de Herramientas Accesible */}
      <div className="roving-toolbar-container">
        <span className="roving-toolbar-label">Barra de Herramientas Interactiva:</span>
        <div
          className="roving-toolbar"
          role="toolbar"
          aria-label="Herramientas de gestión DevForge"
        >
          {TOOLBAR_ITEMS.map((item, index) => {
            const isCurrent = index === activeIndex
            return (
              <button
                key={item.id}
                ref={(el) => (itemRefs.current[index] = el)}
                type="button"
                className={`roving-btn ${isCurrent ? 'roving-btn--active' : ''}`}
                tabIndex={getTabindex(index)}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-pressed={isCurrent}
              >
                <span className="roving-btn__icon" aria-hidden="true">{item.icon}</span>
                <span className="roving-btn__label">{item.label}</span>
                <span className="roving-btn__tabindex font-mono">tabindex="{getTabindex(index)}"</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Monitor de Estado en Vivo */}
      <div className="roving-status-banner">
        <div className="roving-status-item">
          <span className="roving-status-label">Ítem Activo:</span>
          <span className="roving-status-value font-bold text-info">
            {TOOLBAR_ITEMS[activeIndex].icon} {TOOLBAR_ITEMS[activeIndex].label} (Posición {activeIndex + 1}/{TOOLBAR_ITEMS.length})
          </span>
        </div>

        <div className="roving-status-item">
          <span className="roving-status-label">Comportamiento del Teclado:</span>
          <span className="roving-status-desc">
            <kbd>Tab</kbd> entra o sale del toolbar en 1 solo paso • <kbd>←</kbd> <kbd>→</kbd> navegan circularmente • <kbd>Home</kbd> / <kbd>End</kbd> van al inicio/final.
          </span>
        </div>
      </div>
    </div>
  )
}
