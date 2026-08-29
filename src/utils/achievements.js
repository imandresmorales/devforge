/**
 * @fileoverview Sistema de Gamificación y Logros Desbloqueables (Mejora 41).
 *
 * CARACTERÍSTICAS:
 * - Catálogo de insignias y medallas con puntuación de experiencia (XP).
 * - Desbloqueo reactivo con disparo de partículas de confeti en Canvas.
 * - Persistencia segura en localStorage con fallback a memoria.
 *
 * @module utils/achievements
 */
import { fireConfetti } from './confetti'

export const STORAGE_KEY_ACHIEVEMENTS = 'df_achievements_v1'

export const ACHIEVEMENTS_CATALOG = [
  {
    id: 'first_step',
    title: '🚀 Primer Paso',
    desc: 'Explora la plataforma DevForge o inicia el tour guiado.',
    xp: 50,
    icon: '🚀',
    category: 'onboarding',
  },
  {
    id: 'zen_master',
    title: '🧘 Estado Zen',
    desc: 'Activa el Modo Zen de lectura inmersiva con Alt+Z.',
    xp: 50,
    icon: '🧘',
    category: 'ui',
  },
  {
    id: 'qr_generator',
    title: '📱 Generador QR',
    desc: 'Crea y exporta un código QR vectorial SVG/PNG.',
    xp: 50,
    icon: '📱',
    category: 'tools',
  },
  {
    id: 'cli_hacker',
    title: '💻 Hacker CLI',
    desc: 'Ejecuta tu primer comando en la Terminal DevForge.',
    xp: 75,
    icon: '💻',
    category: 'tools',
  },
  {
    id: 'pro_visionary',
    title: '💳 Visión Pro',
    desc: 'Visita los planes de suscripción y pasarela Stripe.',
    xp: 50,
    icon: '💳',
    category: 'economy',
  },
  {
    id: 'quality_critic',
    title: '⭐ Crítico de Calidad',
    desc: 'Envía tu calificación de 5 estrellas en el módulo de feedback.',
    xp: 75,
    icon: '⭐',
    category: 'community',
  },
]

/**
 * Obtiene el estado actual de logros del usuario.
 * @returns {{ unlocked: string[], totalXp: number, currentXp: number, level: number, levelTitle: string }}
 */
export function getAchievementsState() {
  let unlocked = ['first_step']
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS)
    if (saved) {
      unlocked = JSON.parse(saved)
    }
  } catch {
    // fallback
  }

  const totalXp = ACHIEVEMENTS_CATALOG.reduce((acc, a) => acc + a.xp, 0)
  const currentXp = ACHIEVEMENTS_CATALOG.filter((a) => unlocked.includes(a.id)).reduce(
    (acc, a) => acc + a.xp,
    0
  )

  const level = Math.floor(currentXp / 100) + 1
  let levelTitle = 'Desarrollador Junior 🥉'
  if (level === 2) levelTitle = 'Desarrollador Mid 🥈'
  else if (level >= 3) levelTitle = 'Desarrollador Senior 🥇'

  return {
    unlocked,
    totalXp,
    currentXp,
    level,
    levelTitle,
    progressPct: Math.round((currentXp / totalXp) * 100),
  }
}

/**
 * Desbloquea un logro si aún no ha sido obtenido y dispara confeti.
 * @param {string} achievementId
 * @returns {boolean} true si se desbloqueó por primera vez
 */
export function unlockAchievement(achievementId) {
  const item = ACHIEVEMENTS_CATALOG.find((a) => a.id === achievementId)
  if (!item) return false

  const state = getAchievementsState()
  if (state.unlocked.includes(achievementId)) return false

  const updated = [...state.unlocked, achievementId]
  try {
    localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(updated))
  } catch (err) {
    console.warn('No se pudo guardar logro en localStorage:', err)
  }

  // Disparar confeti visual festivo
  fireConfetti({ particleCount: 100, durationMs: 2500 })

  return true
}

/**
 * Reinicia todos los logros guardados.
 */
export function resetAchievements() {
  try {
    localStorage.removeItem(STORAGE_KEY_ACHIEVEMENTS)
  } catch {
    // fallback
  }
}
