/**
 * @fileoverview Modal de Logros y Medallas de Gamificación (Mejora 41).
 *
 * CARACTERÍSTICAS:
 * - Cuadrícula de medallas con estados desbloqueado/bloqueado.
 * - Barra de nivel y progreso de puntos de experiencia (XP).
 * - Disparo manual de confeti para celebración.
 * - Botón de reinicio de progreso.
 *
 * @module components/ui/AchievementsModal
 */
import { useState, useMemo } from 'react'
import Modal from '../Modal/Modal.jsx'
import {
  getAchievementsState,
  ACHIEVEMENTS_CATALOG,
  resetAchievements,
} from '../../../utils/achievements'
import { fireConfetti } from '../../../utils/confetti'
import './AchievementsModal.css'

function AchievementsModal({ isOpen, onClose }) {
  const [refreshKey, setRefreshKey] = useState(0)

  const state = useMemo(() => {
    return getAchievementsState()
  }, [refreshKey, isOpen])

  const handleCelebrate = () => {
    fireConfetti({ particleCount: 120, durationMs: 2500 })
  }

  const handleReset = () => {
    resetAchievements()
    setRefreshKey((k) => k + 1)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏆 Sala de Logros y Recompensas">
      <div className="achievements-modal">
        {/* Cabecera de Nivel y XP */}
        <div className="ach-level-card">
          <div className="ach-level-info">
            <span className="ach-level-badge">Nivel {state.level}</span>
            <h3 className="ach-level-title">{state.levelTitle}</h3>
            <span className="ach-level-xp">
              {state.currentXp} / {state.totalXp} XP ({state.progressPct}%)
            </span>
          </div>

          <div
            className="ach-progress-bar"
            role="progressbar"
            aria-valuenow={state.progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="ach-progress-fill" style={{ width: `${state.progressPct}%` }} />
          </div>
        </div>

        {/* Cuadrícula de Medallas */}
        <div className="ach-grid">
          {ACHIEVEMENTS_CATALOG.map((item) => {
            const isUnlocked = state.unlocked.includes(item.id)
            return (
              <div
                key={item.id}
                className={`ach-card${isUnlocked ? ' ach-card--unlocked' : ' ach-card--locked'}`}
              >
                <div className="ach-card__icon" aria-hidden="true">
                  {isUnlocked ? item.icon : '🔒'}
                </div>
                <div className="ach-card__content">
                  <div className="ach-card__header">
                    <h4 className="ach-card__title">{item.title}</h4>
                    <span className="ach-card__xp">+{item.xp} XP</span>
                  </div>
                  <p className="ach-card__desc">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Acciones */}
        <div className="ach-actions">
          <button type="button" className="btn-secondary" onClick={handleReset}>
            🔄 Reiniciar
          </button>
          <button type="button" className="btn-primary" onClick={handleCelebrate}>
            🎉 ¡Celebrar con Confeti!
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default AchievementsModal
