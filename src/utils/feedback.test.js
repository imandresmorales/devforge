import { describe, it, expect } from 'vitest'
import { calculateNPS, processFeedbackData } from './feedback'

describe('Feedback & NPS Utilities (feedback.js)', () => {
  describe('calculateNPS', () => {
    it('debe retornar 100 si todos los votos son 5 estrellas', () => {
      const res = calculateNPS([5, 5, 5, 5])
      expect(res.score).toBe(100)
      expect(res.level).toBe('Excelente')
      expect(res.promotersPct).toBe(100)
      expect(res.detractorsPct).toBe(0)
    })

    it('debe calcular score negativo si predominan detractores (1-3 estrellas)', () => {
      const res = calculateNPS([1, 2, 3, 5])
      // 1 promotor (25%), 3 detractores (75%) -> score = -50
      expect(res.score).toBe(-50)
      expect(res.level).toBe('Crítico')
    })

    it('debe manejar listas vacías correctamente', () => {
      const res = calculateNPS([])
      expect(res.score).toBe(0)
      expect(res.total).toBe(0)
    })
  })

  describe('processFeedbackData', () => {
    it('debe sanitizar comentarios y asegurar rangos válidos', () => {
      const data = {
        rating: 10, // excede 5
        category: 'UI/UX',
        comments: '<script>alert("hack")</script>Todo muy fluido!',
        wouldRecommend: true,
      }
      const processed = processFeedbackData(data)
      expect(processed.rating).toBe(5)
      expect(processed.comments).toBe('Todo muy fluido!')
      expect(processed.comments).not.toContain('script')
      expect(processed.wouldRecommend).toBe(true)
    })
  })
})
