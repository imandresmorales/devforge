/**
 * @fileoverview Utilidades para cálculo de NPS y procesamiento seguro de Feedback (Mejora 37).
 *
 * CARACTERÍSTICAS:
 * - Algoritmo estándar para Net Promoter Score (NPS = % Promotores - % Detractores).
 * - Categorización y métricas de satisfacción del usuario.
 * - Sanitización estricta de comentarios contra XSS.
 *
 * @module utils/feedback
 */
import { sanitizeInput } from './security'

export const RATING_LABELS = {
  1: 'Pobre 😞',
  2: 'Regular 😐',
  3: 'Bueno 🙂',
  4: 'Muy Bueno 😃',
  5: '¡Excelente! 🚀',
}

/**
 * Calcula el Net Promoter Score a partir de un arreglo de calificaciones (1 a 5).
 * - Promotores: 5 estrellas (o 9-10 en escala de 10)
 * - Pasivos: 4 estrellas (o 7-8)
 * - Detractores: 1-3 estrellas (o 0-6)
 *
 * @param {number[]} ratings - Arreglo de puntuaciones entre 1 y 5
 * @returns {{ score: number, total: number, promotersPct: number, detractorsPct: number, level: string, color: string }}
 */
export function calculateNPS(ratings = []) {
  if (!Array.isArray(ratings) || ratings.length === 0) {
    return {
      score: 0,
      total: 0,
      promotersPct: 0,
      detractorsPct: 0,
      level: 'Sin datos',
      color: 'var(--color-text-muted)',
    }
  }

  const validRatings = ratings.filter((r) => typeof r === 'number' && r >= 1 && r <= 5)
  const total = validRatings.length
  if (total === 0) {
    return {
      score: 0,
      total: 0,
      promotersPct: 0,
      detractorsPct: 0,
      level: 'Sin datos',
      color: 'var(--color-text-muted)',
    }
  }

  const promoters = validRatings.filter((r) => r === 5).length
  const detractors = validRatings.filter((r) => r <= 3).length

  const promotersPct = Math.round((promoters / total) * 100)
  const detractorsPct = Math.round((detractors / total) * 100)
  const score = promotersPct - detractorsPct

  let level = 'Excelente'
  let color = '#10b981'

  if (score < 0) {
    level = 'Crítico'
    color = '#ef4444'
  } else if (score < 30) {
    level = 'Mejorable'
    color = '#f59e0b'
  } else if (score < 70) {
    level = 'Bueno'
    color = '#3b82f6'
  }

  return {
    score,
    total,
    promotersPct,
    detractorsPct,
    level,
    color,
  }
}

/**
 * Procesa y sanitiza un registro de feedback antes de su persistencia.
 * @param {Object} data
 * @returns {Object}
 */
export function processFeedbackData(data = {}) {
  return {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
    category: sanitizeInput(data.category) || 'General',
    comments: sanitizeInput(data.comments),
    wouldRecommend: Boolean(data.wouldRecommend),
    createdAt: new Date().toISOString(),
  }
}
