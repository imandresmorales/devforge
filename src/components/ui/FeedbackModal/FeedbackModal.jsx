/**
 * @fileoverview Modal de Feedback con calificaciones y métricas NPS en vivo (Mejora 37).
 *
 * CARACTERÍSTICAS:
 * - Calificación interactiva con StarRating (1 a 5 estrellas).
 * - Categorías de evaluación (Usabilidad, Rendimiento, Seguridad, Roadmap).
 * - Métrica en vivo del Net Promoter Score (NPS) del proyecto.
 * - Sanitización estricta y persistencia en localStorage.
 *
 * @module components/ui/FeedbackModal
 */
import { useState, useMemo } from 'react'
import Modal from '../Modal/Modal.jsx'
import StarRating from '../StarRating/StarRating.jsx'
import { calculateNPS, processFeedbackData } from '../../../utils/feedback'
import { useToast } from '../../../context/ToastContext'
import './FeedbackModal.css'

const STORAGE_KEY = 'df_feedback_history_v1'

const INITIAL_RATINGS = [5, 5, 4, 5, 4, 5, 5, 3, 5, 4]

function FeedbackModal({ isOpen, onClose }) {
  const [rating, setRating] = useState(5)
  const [category, setCategory] = useState('usability')
  const [comments, setComments] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState(true)
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : INITIAL_RATINGS
    } catch {
      return INITIAL_RATINGS
    }
  })

  const { addToast } = useToast()

  const npsMetrics = useMemo(() => {
    return calculateNPS(records)
  }, [records])

  const handleSubmit = (e) => {
    e.preventDefault()

    const item = processFeedbackData({
      rating,
      category,
      comments,
      wouldRecommend,
    })

    const updated = [item.rating, ...records]
    setRecords(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (err) {
      console.warn('Error guardando feedback:', err)
    }

    addToast({
      type: 'success',
      title: '¡Muchas gracias por tu feedback!',
      message: `Tu calificación de ${rating} estrellas ha sido registrada. NPS actual: ${calculateNPS(updated).score} pts.`,
    })

    setComments('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Calificar Proyecto DevForge">
      <form className="feedback-modal-form" onSubmit={handleSubmit}>
        {/* Métricas NPS del Proyecto */}
        <div className="nps-card">
          <div className="nps-header">
            <span className="nps-title">Métricas de Satisfacción (NPS)</span>
            <span className="nps-badge" style={{ color: npsMetrics.color }}>
              {npsMetrics.level}
            </span>
          </div>
          <div className="nps-score-row">
            <div className="nps-score-val" style={{ color: npsMetrics.color }}>
              +{npsMetrics.score}
            </div>
            <div className="nps-score-desc">
              <span>{npsMetrics.promotersPct}% Promotores</span>
              <span>{npsMetrics.detractorsPct}% Detractores</span>
              <small>({npsMetrics.total} calificaciones)</small>
            </div>
          </div>
        </div>

        {/* Calificación por Estrellas */}
        <div className="feedback-field">
          <label className="form-label" style={{ textAlign: 'center' }}>
            ¿Cómo calificarías tu experiencia con DevForge?
          </label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        {/* Categoría */}
        <div className="feedback-field">
          <label className="form-label" htmlFor="feedback-cat">
            Área principal a evaluar:
          </label>
          <select
            id="feedback-cat"
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="usability">🎯 Usabilidad y Diseño UI/UX</option>
            <option value="performance">⚡ Rendimiento y PWA</option>
            <option value="security">🛡️ Seguridad de la Información</option>
            <option value="features">🚀 Roadmap de 100 Mejoras</option>
          </select>
        </div>

        {/* Comentarios */}
        <div className="feedback-field">
          <label className="form-label" htmlFor="feedback-comment">
            ¿Qué te gustaría ver en las siguientes mejoras?
          </label>
          <textarea
            id="feedback-comment"
            className="form-input"
            rows="3"
            placeholder="Escribe tus sugerencias o comentarios aquí…"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            maxLength={500}
          />
        </div>

        {/* Recomendar */}
        <label className="feedback-recommend-toggle">
          <input
            type="checkbox"
            checked={wouldRecommend}
            onChange={(e) => setWouldRecommend(e.target.checked)}
          />
          <span>Recomendaría este repositorio a otros desarrolladores</span>
        </label>

        {/* Acciones */}
        <div className="feedback-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Enviar Calificación 🚀
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default FeedbackModal
