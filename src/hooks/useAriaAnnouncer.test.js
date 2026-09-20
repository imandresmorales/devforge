/**
 * @fileoverview Tests unitarios para el hook useAriaAnnouncer (Mejora 115).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAriaAnnouncer } from './useAriaAnnouncer'

describe('useAriaAnnouncer hook (Mejora 115)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const pNode = document.getElementById('a11y-live-polite')
    const aNode = document.getElementById('a11y-live-assertive')
    if (pNode) pNode.remove()
    if (aNode) aNode.remove()
  })

  it('debe exponer los métodos announcePolite, announceAssertive y clear', () => {
    const { result } = renderHook(() => useAriaAnnouncer())
    expect(typeof result.current.announcePolite).toBe('function')
    expect(typeof result.current.announceAssertive).toBe('function')
    expect(typeof result.current.clear).toBe('function')
  })

  it('debe ejecutar anuncios polite y assertive correctamente', () => {
    const { result } = renderHook(() => useAriaAnnouncer())

    act(() => {
      result.current.announcePolite('Guardado con éxito')
    })

    const node = document.getElementById('a11y-live-polite')
    vi.advanceTimersByTime(60)
    expect(node.textContent).toBe('Guardado con éxito')

    act(() => {
      result.current.clear()
    })
    expect(node.textContent).toBe('')
  })
})
