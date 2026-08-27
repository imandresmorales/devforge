/**
 * @fileoverview TourContext — Gestión de estado del tour guiado de bienvenida (Mejora 29).
 *
 * CARACTERÍSTICAS:
 * - Definición de pasos interactivos que recorren la interfaz.
 * - Navegación paso a paso con retroceso, avance y opción de omitir.
 * - Persistencia del estado de finalización en localStorage.
 *
 * @module context/TourContext
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const TOUR_STORAGE_KEY = 'df_tour_completed'

/** Pasos predeterminados del Onboarding Tour */
const TOUR_STEPS = [
  {
    id: 'step-brand',
    targetSelector: '.header__brand',
    title: '¡Te damos la bienvenida a DevForge! ⚡',
    content: 'Tu plataforma de aprendizaje interactivo con 100 mejoras continuas del stack web moderno.',
    placement: 'bottom',
  },
  {
    id: 'step-search',
    targetSelector: '.header__search-btn',
    title: 'Buscador Global & Paleta de Comandos 🔍',
    content: 'Pulsa Ctrl+K o Cmd+K en cualquier momento para encontrar páginas, mejoras y herramientas al instante.',
    placement: 'bottom',
  },
  {
    id: 'step-theme',
    targetSelector: '.header__theme-btn',
    title: 'Modo Oscuro / Claro 🌓',
    content: 'Personaliza tu entorno visual. Tu preferencia se guarda automáticamente en el navegador.',
    placement: 'bottom',
  },
  {
    id: 'step-notifs',
    targetSelector: '.notif-btn',
    title: 'Centro de Alertas & Web Push 🔔',
    content: 'Mantente al día con las novedades del roadmap y activa notificaciones nativas en tu dispositivo.',
    placement: 'bottom',
  },
  {
    id: 'step-pricing',
    targetSelector: 'a[href="/pricing"]',
    title: 'Planes & Pasarela Stripe 💳',
    content: 'Explora suscripciones y prueba la pasarela de pagos interactiva con validación de tarjetas en vivo.',
    placement: 'bottom',
  },
]

const TourContext = createContext(null)

export function TourProvider({ children }) {
  const [isTourActive, setIsTourActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Iniciar automáticamente solo en la primera visita
  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem(TOUR_STORAGE_KEY)
      if (!hasCompleted) {
        // Pequeño delay inicial para permitir que el DOM renderice
        const timer = setTimeout(() => {
          setIsTourActive(true)
          setCurrentStepIndex(0)
        }, 1200)
        return () => clearTimeout(timer)
      }
    } catch {
      // Silenciar storage errors
    }
  }, [])

  const startTour = useCallback(() => {
    setCurrentStepIndex(0)
    setIsTourActive(true)
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev < TOUR_STEPS.length - 1) {
        return prev + 1
      }
      // Al llegar al último paso, finalizar
      setIsTourActive(false)
      try {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      } catch {
        /* storage safe */
      }
      return prev
    })
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const skipTour = useCallback(() => {
    setIsTourActive(false)
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    } catch {
      /* storage safe */
    }
  }, [])

  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY)
    } catch {
      /* storage safe */
    }
    startTour()
  }, [startTour])

  const currentStep = TOUR_STEPS[currentStepIndex] || null

  const value = {
    isTourActive,
    currentStepIndex,
    totalSteps: TOUR_STEPS.length,
    currentStep,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    resetTour,
  }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) {
    throw new Error('[useTour] Debe usarse dentro de un TourProvider.')
  }
  return ctx
}

export default TourContext
