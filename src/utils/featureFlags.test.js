/**
 * @fileoverview Tests unitarios para el Motor de Feature Flags (Mejora 79).
 * @module utils/featureFlags.test
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getUserBucket,
  evaluateRule,
  FeatureFlagManager,
} from './featureFlags'

describe('Motor de Feature Flags y Despliegue Progresivo Canary (featureFlags.js)', () => {
  describe('Cálculo Determinista de Buckets de Usuario', () => {
    it('genera valores entre 0 y 99 de forma determinista para el mismo usuario y flag', () => {
      const b1 = getUserBucket('new_checkout:user_4482')
      const b2 = getUserBucket('new_checkout:user_4482')
      expect(b1).toBe(b2)
      expect(b1).toBeGreaterThanOrEqual(0)
      expect(b1).toBeLessThan(100)
    })
  })

  describe('Evaluación de Reglas de Segmentación (Targeting Rules)', () => {
    it('evalúa correctamente operadores de igualdad, pertenencia y sufijos', () => {
      expect(evaluateRule({ attribute: 'role', operator: 'equals', value: 'admin' }, { role: 'ADMIN' })).toBe(true)
      expect(evaluateRule({ attribute: 'country', operator: 'in', value: ['ES', 'MX'] }, { country: 'ES' })).toBe(true)
      expect(evaluateRule({ attribute: 'email', operator: 'endsWith', value: '@devforge.app' }, { email: 'alex@devforge.app' })).toBe(true)
      expect(evaluateRule({ attribute: 'plan', operator: 'equals', value: 'enterprise' }, { plan: 'free' })).toBe(false)
    })
  })

  describe('FeatureFlagManager y Despliegue Canary', () => {
    let manager

    beforeEach(() => {
      manager = new FeatureFlagManager()
      manager.registerFlag({
        key: 'ai_assistant',
        name: 'AI Smart Assistant',
        enabled: true,
        rolloutPercentage: 50,
        rules: [
          { attribute: 'role', operator: 'equals', value: 'BETA_TESTER', variationValue: true },
        ],
        defaultValue: false,
      })
    })

    it('habilita la característica inmediatamente a usuarios que coinciden con una regla de segmentación', () => {
      const evalBeta = manager.evaluate('ai_assistant', { id: 'usr_99', role: 'BETA_TESTER' })
      expect(evalBeta.enabled).toBe(true)
      expect(evalBeta.reason).toContain('RULE_MATCH')
    })

    it('respeta el interruptor global de apagado (Kill Switch)', () => {
      manager.toggleFlag('ai_assistant') // Desactivar
      const evalRes = manager.evaluate('ai_assistant', { id: 'usr_99', role: 'BETA_TESTER' })
      expect(evalRes.enabled).toBe(false)
      expect(evalRes.reason).toBe('KILL_SWITCH_DISABLED')
    })

    it('ajusta el acceso progresivo al modificar el porcentaje de Canary Rollout', () => {
      manager.setRolloutPercentage('ai_assistant', 0)
      const eval0 = manager.evaluate('ai_assistant', { id: 'usr_random_1', role: 'USER' })
      expect(eval0.enabled).toBe(false)

      manager.setRolloutPercentage('ai_assistant', 100)
      const eval100 = manager.evaluate('ai_assistant', { id: 'usr_random_1', role: 'USER' })
      expect(eval100.enabled).toBe(true)
      expect(eval100.reason).toContain('CANARY_ROLLOUT')
    })
  })
})
