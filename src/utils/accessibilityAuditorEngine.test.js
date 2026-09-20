/**
 * @fileoverview Tests unitarios para accessibilityAuditorEngine.js (Mejora 118).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { auditDomAccessibility } from './accessibilityAuditorEngine'

describe('accessibilityAuditorEngine (Mejora 118)', () => {
  let testRoot

  beforeEach(() => {
    testRoot = document.createElement('div')
    document.body.appendChild(testRoot)
  })

  afterEach(() => {
    if (testRoot && testRoot.parentNode) {
      testRoot.parentNode.removeChild(testRoot)
    }
  })

  it('debe auditar un documento bien estructurado y otorgar alta calificación', () => {
    testRoot.innerHTML = `
      <main id="main-content">
        <a href="#main-content" class="skip-link">Saltar al contenido</a>
        <form>
          <label for="username">Usuario:</label>
          <input id="username" type="text" />
          <button type="submit">Enviar</button>
        </form>
      </main>
    `
    const result = auditDomAccessibility(testRoot)
    expect(result.score).toBeGreaterThanOrEqual(75)
    expect(['AAA', 'AA']).toContain(result.grade)
    expect(result.errorCount).toBe(0)
  })

  it('debe detectar controles de formulario sin etiqueta asociada', () => {
    testRoot.innerHTML = `
      <div>
        <input type="text" placeholder="Sin label" />
        <button>Aceptar</button>
      </div>
    `
    const result = auditDomAccessibility(testRoot)
    const formRule = result.rules.find((r) => r.id === 'form-labels')
    expect(formRule.status).toBe('fail')
    expect(result.errorCount).toBeGreaterThanOrEqual(1)
  })

  it('debe detectar botones y enlaces sin nombre accesible', () => {
    testRoot.innerHTML = `
      <div>
        <button></button>
        <a href="/login"></a>
      </div>
    `
    const result = auditDomAccessibility(testRoot)
    const nameRule = result.rules.find((r) => r.id === 'interactive-names')
    expect(nameRule.status).toBe('fail')
  })

  it('debe advertir ante tabindex positivos que alteren el flujo natural', () => {
    testRoot.innerHTML = `
      <div>
        <button tabindex="2">Segundo</button>
        <button tabindex="1">Primero</button>
      </div>
    `
    const result = auditDomAccessibility(testRoot)
    const tabRule = result.rules.find((r) => r.id === 'tabindex-natural')
    expect(tabRule.status).toBe('warn')
  })
})
