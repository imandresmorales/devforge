import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { TourProvider, useTour } from './TourContext'

function wrapper({ children }) {
  return <TourProvider>{children}</TourProvider>
}

describe('TourContext (Mejora 29)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('debe iniciar el tour correctamente al llamar startTour', () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.startTour()
    })

    expect(result.current.isTourActive).toBe(true)
    expect(result.current.currentStepIndex).toBe(0)
    expect(result.current.currentStep).not.toBeNull()
  })

  it('debe avanzar al siguiente paso con nextStep', () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.startTour()
    })

    expect(result.current.currentStepIndex).toBe(0)

    act(() => {
      result.current.nextStep()
    })

    expect(result.current.currentStepIndex).toBe(1)
  })

  it('debe retroceder con prevStep sin bajar de 0', () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.startTour()
      result.current.nextStep()
    })

    expect(result.current.currentStepIndex).toBe(1)

    act(() => {
      result.current.prevStep()
    })

    expect(result.current.currentStepIndex).toBe(0)

    // Si vuelve a presionar prevStep, debe mantenerse en 0
    act(() => {
      result.current.prevStep()
    })

    expect(result.current.currentStepIndex).toBe(0)
  })

  it('debe cerrar el tour al llamar skipTour y guardar en localStorage', () => {
    const { result } = renderHook(() => useTour(), { wrapper })

    act(() => {
      result.current.startTour()
    })

    expect(result.current.isTourActive).toBe(true)

    act(() => {
      result.current.skipTour()
    })

    expect(result.current.isTourActive).toBe(false)
    expect(localStorage.getItem('df_tour_completed')).toBe('true')
  })
})
