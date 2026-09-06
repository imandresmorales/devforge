/**
 * @fileoverview Tests unitarios para el Analizador y Mitigador de Prototype Pollution (Mejora 68).
 * @module utils/prototypePollutionGuard.test
 */
import { describe, it, expect } from 'vitest'
import {
  analyzePrototypePollution,
  safeDeepMerge,
  safeDeepClone,
  simulateMergeComparison,
  POLLUTION_PRESETS,
} from './prototypePollutionGuard'

describe('Analizador y Mitigador de Prototype Pollution (prototypePollutionGuard.js)', () => {
  it('detecta inyección de __proto__ en JSON crudo como riesgo CRITICAL', () => {
    const rawJson = '{"user": "alex", "__proto__": {"isAdmin": true}}'
    const analysis = analyzePrototypePollution(rawJson)

    expect(analysis.isVulnerable).toBe(true)
    expect(analysis.riskLevel).toBe('CRITICAL')
    expect(analysis.findings.some((f) => f.key === '__proto__')).toBe(true)
  })

  it('detecta inyección anidada mediante constructor.prototype', () => {
    const payload = {
      user: {
        constructor: {
          prototype: {
            isSuperUser: true,
          },
        },
      },
    }
    const analysis = analyzePrototypePollution(payload)

    expect(analysis.isVulnerable).toBe(true)
    expect(analysis.findings.some((f) => f.key === 'constructor' || f.key === 'prototype')).toBe(true)
  })

  it('califica como SAFE los objetos JSON limpios sin claves prototípicas', () => {
    const safePayload = {
      id: 101,
      profile: { name: 'Alex', role: 'developer' },
      tags: ['security', 'react'],
    }
    const analysis = analyzePrototypePollution(safePayload)

    expect(analysis.isVulnerable).toBe(false)
    expect(analysis.riskLevel).toBe('SAFE')
    expect(analysis.findings.length).toBe(0)
  })

  it('safeDeepMerge combina propiedades legítimas y bloquea claves prototípicas', () => {
    const target = { existing: 'value', user: { theme: 'light' } }
    const maliciousSource = JSON.parse('{"user": {"theme": "dark"}, "newKey": "ok"}')
    // Asignar manualmente propiedad peligrosa simulada
    maliciousSource['__proto__'] = { polluted: true }
    maliciousSource['constructor'] = { prototype: { pwned: true } }

    const merged = safeDeepMerge(target, maliciousSource)

    expect(merged.existing).toBe('value')
    expect(merged.user.theme).toBe('dark')
    expect(merged.newKey).toBe('ok')
    // Verificar que el prototipo global no fue alterado
    expect({}.polluted).toBeUndefined()
    expect({}.pwned).toBeUndefined()
  })

  it('safeDeepClone crea una copia profunda sanitizada libre de prototipos peligrosos', () => {
    const src = { a: 1, nested: { b: 2 } }
    src['__proto__'] = { injected: true }

    const clone = safeDeepClone(src)
    expect(clone.a).toBe(1)
    expect(clone.nested.b).toBe(2)
    expect(clone['__proto__']).toBeUndefined()
  })

  it('valida todos los presets de prueba de Prototype Pollution correctamente', () => {
    POLLUTION_PRESETS.forEach((p) => {
      const res = analyzePrototypePollution(p.payload)
      expect(res).toBeDefined()
      expect(res.riskLevel).toBeDefined()
    })
  })
})
