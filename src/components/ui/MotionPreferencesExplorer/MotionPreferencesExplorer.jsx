/**
 * @fileoverview Componente MotionPreferencesExplorer — Gestor Reactivo de Movimiento Reducido y Accesibilidad de Medios.
 *
 * Visualiza el estado en tiempo real de `prefers-reduced-motion`, `prefers-contrast`, `forced-colors` del sistema operativo,
 * permite al usuario anular las animaciones en caliente (app-level override) y observar la respuesta visual de micro-animaciones adaptativas.
 *
 * @module components/ui/MotionPreferencesExplorer
 */

import { useMotionPreferences } from '../../../hooks/useMotionPreferences'
import './MotionPreferencesExplorer.css'

export default function MotionPreferencesExplorer() {
  const { preferences, overrideMode, setOverrideMode } = useMotionPreferences()

  const isMotionReduced =
    overrideMode === 'reduce' ? true : overrideMode === 'allow' ? false : preferences.reducedMotion

  return (
    <div className="motion-explorer-card" role="region" aria-label="Gestor de Preferencias de Movimiento y Contraste">
      <div className="motion-explorer-card__header">
        <div className="motion-explorer-card__badge">⚡ Mejora 116</div>
        <h3 className="motion-explorer-card__title">Gestor Reactivo de Movimiento Reducido (WCAG 2.1 AAA)</h3>
        <p className="motion-explorer-card__subtitle">
          Detecta <code className="font-mono">prefers-reduced-motion</code> y <code className="font-mono">prefers-contrast</code> del sistema operativo para proteger a usuarios con trastornos vestibulares o fotosensibilidad.
        </p>
      </div>

      {/* Grid de Estado de Medios del Sistema */}
      <div className="motion-explorer-grid">
        <div className="motion-stat-box">
          <span className="motion-stat-label">Movimiento Reducido (SO)</span>
          <span className={`motion-stat-value ${preferences.reducedMotion ? 'text-warning' : 'text-success'}`}>
            {preferences.reducedMotion ? '⚠️ Activado (Reduce)' : '✅ Estándar (No-pref)'}
          </span>
        </div>

        <div className="motion-stat-box">
          <span className="motion-stat-label">Alto Contraste del SO</span>
          <span className="motion-stat-value">
            {preferences.highContrast ? '⚡ Forzado (More)' : 'Estándar (No-pref)'}
          </span>
        </div>

        <div className="motion-stat-box">
          <span className="motion-stat-label">Esquema de Color Detectado</span>
          <span className="motion-stat-value font-mono">
            {preferences.colorScheme.toUpperCase()}
          </span>
        </div>

        <div className="motion-stat-box">
          <span className="motion-stat-label">Estado Efectivo en DevForge</span>
          <span className={`motion-stat-value font-bold ${isMotionReduced ? 'text-warning' : 'text-info'}`}>
            {isMotionReduced ? '🔇 Animaciones Desactivadas' : '🎬 Animaciones Fluidas'}
          </span>
        </div>
      </div>

      {/* Controles de Sobrescritura */}
      <div className="motion-controls-section">
        <span className="motion-controls-label">Sobrescribir Preferencia en DevForge:</span>
        <div className="motion-btn-group">
          <button
            type="button"
            className={`motion-btn ${overrideMode === 'system' ? 'motion-btn--active' : ''}`}
            onClick={() => setOverrideMode('system')}
          >
            💻 Seguir Sistema
          </button>
          <button
            type="button"
            className={`motion-btn ${overrideMode === 'reduce' ? 'motion-btn--active' : ''}`}
            onClick={() => setOverrideMode('reduce')}
          >
            🔇 Forzar Movimiento Reducido (Sin Animaciones)
          </button>
          <button
            type="button"
            className={`motion-btn ${overrideMode === 'allow' ? 'motion-btn--active' : ''}`}
            onClick={() => setOverrideMode('allow')}
          >
            ✨ Permitir Animaciones Completas
          </button>
        </div>
      </div>

      {/* Caja de Demostración Animada Adaptativa */}
      <div className="motion-demo-box">
        <span className="motion-demo-title">Test de Animación Dinámica en Tiempo Real:</span>
        <div className={`motion-demo-spinner ${isMotionReduced ? 'motion-demo-spinner--static' : ''}`}>
          {isMotionReduced ? '🛑 Movimiento pausado automáticamente' : '🌀 Animación GPU activa'}
        </div>
      </div>
    </div>
  )
}
