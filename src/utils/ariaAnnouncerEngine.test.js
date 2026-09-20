/**
 * @fileoverview Tests unitarios para ariaAnnouncerEngine.js (Mejora 115).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getOrCreateLiveRegion,
  announce,
  clearLiveRegions,
} from './ariaAnnouncerEngine'

describe('ariaAnnouncerEngine (Mejora 115)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const pNode = document.getElementById('a11y-live-polite')
    const aNode = document.getElementById('a11y-live-assertive')
    if (pNode) pNode.remove()
    if (aNode) aNode.remove()
  })

  it('debe crear correctamente la región viva polite con atributos ARIA adecuados', () => {
    const node = getOrCreateLiveRegion('polite')
    expect(node).toBeDefined()
    expect(node.id).toBe('a11y-live-polite')
    expect(node.getAttribute('aria-live')).toBe('polite')
    expect(node.getAttribute('role')).toBe('status')
  })

  it('debe crear correctamente la región viva assertive para alertas urgentes', () => {
    const node = getOrCreateLiveRegion('assertive')
    expect(node).toBeDefined()
    expect(node.id).toBe('a11y-live-assertive')
    expect(node.getAttribute('aria-live')).toBe('assertive')
    expect(node.getAttribute('role')).toBe('alert')
  })

  it('debe actualizar el contenido del nodo tras el micro-retraso al invocar announce()', () => {
    announce('Operación completada con éxito', 'polite')
    const node = document.getElementById('a11y-live-polite')
    
    expect(node.textContent).toBe('')
    vi.advanceTimersByTime(60)
    expect(node.textContent).toBe('Operación completada con éxito')
  })

  it('debe limpiar automáticamente el texto tras el clearDelayMs', () => {
    announce('Alerta crítica de seguridad', 'assertive', 5000)
    const node = document.getElementById('a11y-live-assertive')

    vi.advanceTimersByTime(60)
    expect(node.textContent).toBe('Alerta crítica de seguridad')

    vi.advanceTimersByTime(5000)
    expect(node.textContent).toBe('')
  })

  it('debe limpiar manualmente todas las regiones vivas', () => {
    announce('Mensaje 1', 'polite')
    announce('Mensaje 2', 'assertive')
    vi.advanceTimersByTime(60)

    clearLiveRegions()
    expect(document.getElementById('a11y-live-polite').textContent).toBe('')
    expect(document.getElementById('a11y-live-assertive').textContent).toBe('')
  })
})
