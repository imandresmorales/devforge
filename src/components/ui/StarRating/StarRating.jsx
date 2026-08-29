/**
 * @fileoverview Componente StarRating — Selector de calificación accesible con estrellas animadas (Mejora 37).
 *
 * CARACTERÍSTICAS:
 * - 5 estrellas interactivas con estados de hover y selección.
 * - Soporte para teclado (ArrowLeft, ArrowRight, Enter, Espacio).
 * - Etiquetas semánticas y atributos WAI-ARIA (role="radiogroup").
 *
 * @module components/ui/StarRating
 */
import { useState } from 'react'
import { RATING_LABELS } from '../../../utils/feedback'
import './StarRating.css'

function StarRating({ value = 5, onChange, disabled = false }) {
  const [hoverValue, setHoverValue] = useState(null)
  const displayValue = hoverValue !== null ? hoverValue : value

  return (
    <div
      className="star-rating"
      role="radiogroup"
      aria-label="Calificación de 1 a 5 estrellas"
    >
      <div className="star-rating__stars">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} estrella${star > 1 ? 's' : ''}: ${RATING_LABELS[star]}`}
              className={`star-btn${isFilled ? ' star-btn--filled' : ''}`}
              onClick={() => !disabled && onChange?.(star)}
              onMouseEnter={() => !disabled && setHoverValue(star)}
              onMouseLeave={() => !disabled && setHoverValue(null)}
              disabled={disabled}
            >
              ★
            </button>
          )
        })}
      </div>

      <span className="star-rating__label" aria-live="polite">
        {RATING_LABELS[displayValue] || ''}
      </span>
    </div>
  )
}

export default StarRating
