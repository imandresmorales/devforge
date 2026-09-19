/**
 * @fileoverview Tests unitarios para focusTrapEngine.js (Mejora 113).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getFocusableElements, createFocusTrap } from './focusTrapEngine'

describe('focusTrapEngine (Mejora 113)', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <button id="btn1">Botón 1</button>
      <input id="input1" type="text" value="Prueba" />
      <button id="btnDisabled" disabled>Deshabilitado</button>
      <a id="link1" href="https://example.com">Enlace</a>
      <div id="noFocus">No enfocable</div>
      <button id="btn2">Botón 2</button>
    `
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
  })

  it('debe filtrar correctamente los elementos enfocables excluyendo deshabilitados y no interactivos', () => {
    const focusables = getFocusableElements(container)
    expect(focusables.length).toBe(4) // btn1, input1, link1, btn2
    expect(focusables.map((el) => el.id)).toEqual(['btn1', 'input1', 'link1', 'btn2'])
  })

  it('debe activar la trampa de foco y enfocar el primer elemento automáticamente', () => {
    const trap = createFocusTrap(container, { autoFocus: true })
    trap.activate()

    expect(trap.isActive()).toBe(true)
    expect(document.activeElement.id).toBe('btn1')
    trap.deactivate()
    expect(trap.isActive()).toBe(false)
  })

  it('debe ciclar el foco hacia el primer elemento al pulsar Tab en el último', () => {
    const trap = createFocusTrap(container)
    trap.activate()

    const btn2 = document.getElementById('btn2')
    btn2.focus()
    expect(document.activeElement.id).toBe('btn2')

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    trap.handleKeyDown(tabEvent)

    expect(document.activeElement.id).toBe('btn1')
    trap.deactivate()
  })

  it('debe ciclar el foco hacia el último elemento al pulsar Shift+Tab en el primero', () => {
    const trap = createFocusTrap(container)
    trap.activate()

    const btn1 = document.getElementById('btn1')
    btn1.focus()
    expect(document.activeElement.id).toBe('btn1')

    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
    trap.handleKeyDown(shiftTabEvent)

    expect(document.activeElement.id).toBe('btn2')
    trap.deactivate()
  })

  it('debe invocar onEscape cuando se presiona la tecla Escape', () => {
    const onEscape = vi.fn()
    const trap = createFocusTrap(container, { onEscape })
    trap.activate()

    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    trap.handleKeyDown(escEvent)

    expect(onEscape).toHaveBeenCalledTimes(1)
    trap.deactivate()
  })
})
