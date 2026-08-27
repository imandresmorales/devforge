/**
 * @fileoverview Componente TourGuide — Overlay interactivo con foco dinámico (Mejora 29).
 *
 * CARACTERÍSTICAS:
 * - Spotlight SVG que resalta con precisión geométrica el elemento activo.
 * - Tooltip interactivo con barra de progreso y botones de navegación.
 * - Atajos de teclado (Escape para salir, Flechas para navegar).
 * - Posicionamiento adaptativo con getBoundingClientRect.
 *
 * @module components/ui/TourGuide
 */
import { useState, useEffect, useCallback } from 'react'
import { useTour } from '../../../context/TourContext'
import './TourGuide.css'

function TourGuide() {
  const {
    isTourActive,
    currentStepIndex,
    totalSteps,
    currentStep,
    nextStep,
    prevStep,
    skipTour,
  } = useTour()

  const [targetRect, setTargetRect] = useState(null)

  // Actualizar posición del elemento objetivo
  const updatePosition = useCallback(() => {
    if (!currentStep) return
    const el = document.querySelector(currentStep.targetSelector)
    if (el) {
      const rect = el.getBoundingClientRect()
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      })
    } else {
      // Si el elemento no existe en la vista actual, centrar
      setTargetRect({
        top: window.innerHeight / 2 - 50,
        left: window.innerWidth / 2 - 100,
        width: 200,
        height: 100,
      })
    }
  }, [currentStep])

  useEffect(() => {
    if (!isTourActive) return

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isTourActive, updatePosition])

  // Manejo de teclado
  useEffect(() => {
    if (!isTourActive) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        skipTour()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep()
      } else if (e.key === 'ArrowLeft') {
        prevStep()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTourActive, nextStep, prevStep, skipTour])

  if (!isTourActive || !currentStep || !targetRect) return null

  // Calcular posición del tooltip flotante
  const tooltipStyle = {
    top: Math.min(targetRect.bottom + 16, window.innerHeight - 240),
    left: Math.max(16, Math.min(targetRect.left - 40, window.innerWidth - 360)),
  }

  const isLastStep = currentStepIndex === totalSteps - 1

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Guía de inicio interactiva">
      {/* SVG Spotlight Mask */}
      <svg className="tour-spotlight-svg" aria-hidden="true">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - 6}
              y={targetRect.top - 6}
              width={targetRect.width + 12}
              height={targetRect.height + 12}
              rx="10"
              ry="10"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.75)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Halo luminoso alrededor del elemento activo */}
      <div
        className="tour-highlight-box"
        style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
        }}
        aria-hidden="true"
      />

      {/* Tarjeta Flotante del Paso */}
      <div className="tour-card" style={tooltipStyle}>
        <div className="tour-card__header">
          <span className="tour-step-badge">Paso {currentStepIndex + 1} de {totalSteps}</span>
          <button
            type="button"
            className="tour-close-btn"
            onClick={skipTour}
            aria-label="Cerrar tour"
            title="Saltar tour"
          >
            ×
          </button>
        </div>

        <h3 className="tour-card__title">{currentStep.title}</h3>
        <p className="tour-card__content">{currentStep.content}</p>

        {/* Barra de progreso */}
        <div className="tour-progress" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
          <div
            className="tour-progress__bar"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="tour-card__footer">
          <button
            type="button"
            className="tour-btn tour-btn--skip"
            onClick={skipTour}
          >
            Saltar
          </button>

          <div className="tour-card__actions">
            {currentStepIndex > 0 && (
              <button
                type="button"
                className="btn-secondary tour-btn"
                onClick={prevStep}
              >
                Anterior
              </button>
            )}
            <button
              type="button"
              className="btn-primary tour-btn"
              onClick={nextStep}
            >
              {isLastStep ? '¡Comenzar! 🚀' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TourGuide
