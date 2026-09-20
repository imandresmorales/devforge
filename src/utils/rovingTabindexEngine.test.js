/**
 * @fileoverview Tests unitarios para rovingTabindexEngine.js (Mejora 119).
 */
import { describe, it, expect } from 'vitest'
import {
  calculateRovingIndex,
  getRovingTabindex,
} from './rovingTabindexEngine'

describe('rovingTabindexEngine (Mejora 119)', () => {
  it('debe avanzar al siguiente elemento con ArrowRight y ciclar al inicio si loop=true', () => {
    expect(calculateRovingIndex(0, 4, { key: 'ArrowRight' })).toBe(1)
    expect(calculateRovingIndex(3, 4, { key: 'ArrowRight' }, { loop: true })).toBe(0)
    expect(calculateRovingIndex(3, 4, { key: 'ArrowRight' }, { loop: false })).toBe(3)
  })

  it('debe retroceder al elemento anterior con ArrowLeft y ciclar al final si loop=true', () => {
    expect(calculateRovingIndex(2, 4, { key: 'ArrowLeft' })).toBe(1)
    expect(calculateRovingIndex(0, 4, { key: 'ArrowLeft' }, { loop: true })).toBe(3)
  })

  it('debe saltar al primer elemento con Home y al último con End', () => {
    expect(calculateRovingIndex(2, 5, { key: 'Home' })).toBe(0)
    expect(calculateRovingIndex(1, 5, { key: 'End' })).toBe(4)
  })

  it('debe calcular correctamente los valores de tabindex (0 para activo, -1 para inactivos)', () => {
    expect(getRovingTabindex(0, 0)).toBe(0)
    expect(getRovingTabindex(1, 0)).toBe(-1)
    expect(getRovingTabindex(2, 0)).toBe(-1)
    expect(getRovingTabindex(2, 2)).toBe(0)
  })
})
