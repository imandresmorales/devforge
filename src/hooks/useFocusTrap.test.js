/**
 * @fileoverview Tests unitarios para el hook useFocusTrap (Mejora 113).
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFocusTrap } from './useFocusTrap'

describe('useFocusTrap hook (Mejora 113)', () => {
  it('debe devolver un objeto ref inicializado', () => {
    const { result } = renderHook(() => useFocusTrap(false))
    expect(result.current).toBeDefined()
    expect(result.current.current).toBeNull()
  })

  it('debe activar y gestionar el contenedor cuando isActive es true', () => {
    const onEscape = vi.fn()
    const container = document.createElement('div')
    const button = document.createElement('button')
    button.textContent = 'Aceptar'
    container.appendChild(button)
    document.body.appendChild(container)

    const { result, rerender, unmount } = renderHook(
      ({ active }) => useFocusTrap(active, { onEscape }),
      { initialProps: { active: false } }
    )

    result.current.current = container

    rerender({ active: true })
    expect(document.activeElement).toBe(button)

    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    container.dispatchEvent(escEvent)
    expect(onEscape).toHaveBeenCalled()

    unmount()
    if (container.parentNode) container.parentNode.removeChild(container)
  })
})
