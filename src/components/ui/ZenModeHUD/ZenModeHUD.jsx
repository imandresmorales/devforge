/**
 * @fileoverview Componente ZenModeHUD — Barra flotante de control para Modo Zen (Mejora 32).
 *
 * CARACTERÍSTICAS:
 * - Barra superior de progreso de lectura (scroll).
 * - HUD flotante con ajuste de tamaño de tipografía (A- / A+).
 * - Botón de alternar tema y salida rápida del modo inmersivo con atajo ESC.
 *
 * @module components/ui/ZenModeHUD
 */
import './ZenModeHUD.css'

function ZenModeHUD({
  isZenMode,
  readingProgress,
  fontSizeOffset,
  onExit,
  onIncreaseFont,
  onDecreaseFont,
  onResetFont,
  onToggleTheme,
  theme,
}) {
  return (
    <>
      {/* Barra de progreso de lectura superior (siempre visible o en modo Zen) */}
      {isZenMode && (
        <div
          className="zen-progress-track"
          role="progressbar"
          aria-valuenow={readingProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso de lectura"
        >
          <div
            className="zen-progress-bar"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      )}

      {/* HUD flotante */}
      {isZenMode && (
        <aside
          className="zen-hud"
          role="toolbar"
          aria-label="Controles de lectura del Modo Zen"
        >
          <div className="zen-hud__info">
            <span className="zen-hud__icon" aria-hidden="true">🧘</span>
            <span className="zen-hud__title">Modo Zen</span>
            <span className="zen-hud__pct">{readingProgress}% leído</span>
          </div>

          <div className="zen-hud__divider" />

          {/* Ajuste de Tipografía */}
          <div className="zen-hud__font-controls" role="group" aria-label="Ajuste de tamaño de texto">
            <button
              type="button"
              className="zen-hud-btn"
              onClick={onDecreaseFont}
              title="Reducir tamaño de letra"
              disabled={fontSizeOffset <= -2}
              aria-label="Reducir tamaño de letra"
            >
              A-
            </button>
            <button
              type="button"
              className="zen-hud-btn"
              onClick={onResetFont}
              title="Restablecer tamaño de letra"
              aria-label="Restablecer tamaño"
            >
              100%
            </button>
            <button
              type="button"
              className="zen-hud-btn"
              onClick={onIncreaseFont}
              title="Aumentar tamaño de letra"
              disabled={fontSizeOffset >= 3}
              aria-label="Aumentar tamaño de letra"
            >
              A+
            </button>
          </div>

          <div className="zen-hud__divider" />

          {/* Alternar Tema */}
          <button
            type="button"
            className="zen-hud-btn"
            onClick={onToggleTheme}
            title="Cambiar tema claro/oscuro"
            aria-label="Cambiar tema"
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>

          {/* Botón Salir */}
          <button
            type="button"
            className="zen-hud-btn zen-hud-btn--exit"
            onClick={onExit}
            title="Salir del Modo Zen (Escape)"
          >
            <span>Salir</span>
            <kbd className="zen-kbd">ESC</kbd>
          </button>
        </aside>
      )}
    </>
  )
}

export default ZenModeHUD
