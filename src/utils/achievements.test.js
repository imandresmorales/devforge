import { describe, it, expect, beforeEach } from 'vitest'
import {
  getAchievementsState,
  unlockAchievement,
  resetAchievements,
  ACHIEVEMENTS_CATALOG,
} from './achievements'

describe('Gamification & Achievements (achievements.js)', () => {
  beforeEach(() => {
    resetAchievements()
  })

  it('debe calcular nivel y XP inicial correctamente', () => {
    const state = getAchievementsState()
    expect(state.level).toBeGreaterThanOrEqual(1)
    expect(state.totalXp).toBeGreaterThan(0)
    expect(state.unlocked).toContain('first_step')
  })

  it('debe desbloquear un logro no obtenido y aumentar XP', () => {
    const initial = getAchievementsState()
    const unlocked = unlockAchievement('zen_master')
    expect(unlocked).toBe(true)

    const updated = getAchievementsState()
    expect(updated.unlocked).toContain('zen_master')
    expect(updated.currentXp).toBeGreaterThan(initial.currentXp)
  })

  it('debe retornar false si el logro ya estaba desbloqueado', () => {
    unlockAchievement('qr_generator')
    const secondTry = unlockAchievement('qr_generator')
    expect(secondTry).toBe(false)
  })
})
