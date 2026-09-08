/**
 * @fileoverview Tests unitarios para el Simulador de Pipeline CI/CD con SAST (Mejora 72).
 * @module utils/cicdPipeline.test
 */
import { describe, it, expect } from 'vitest'
import {
  runSastScan,
  CICDPipelineRunner,
  PIPELINE_STATUS,
} from './cicdPipeline'

describe('Pipeline CI/CD y Análisis Estático de Seguridad SAST (cicdPipeline.js)', () => {
  describe('Motor de Detección SAST', () => {
    it('detecta credenciales y API keys hardcodeadas en texto plano (CWE-798)', () => {
      const code = `const apiKey = "sk_live_1234567890abcdef123456";`
      const findings = runSastScan(code)
      expect(findings.length).toBeGreaterThan(0)
      expect(findings[0].ruleId).toBe('SEC-001')
      expect(findings[0].severity).toBe('CRITICAL')
    })

    it('detecta inyección de código mediante eval dinámico (CWE-95)', () => {
      const code = `function runUserScript(payload) { return eval(payload); }`
      const findings = runSastScan(code)
      expect(findings.some((f) => f.ruleId === 'SEC-002')).toBe(true)
    })

    it('detecta manipulación directa no segura de innerHTML (CWE-79)', () => {
      const code = `document.getElementById('app').innerHTML = '<div>' + userInput + '</div>';`
      const findings = runSastScan(code)
      expect(findings.some((f) => f.ruleId === 'SEC-003')).toBe(true)
    })

    it('detecta concatenación de strings en queries SQL (CWE-89)', () => {
      const code = `const query = "SELECT * FROM users WHERE id = " + userId;`
      const findings = runSastScan(code)
      expect(findings.some((f) => f.ruleId === 'SEC-005')).toBe(true)
    })

    it('retorna lista vacía para código seguro', () => {
      const cleanCode = `
        import DOMPurify from 'dompurify';
        export function sanitize(input) {
          return DOMPurify.sanitize(input);
        }
      `
      const findings = runSastScan(cleanCode)
      expect(findings).toHaveLength(0)
    })
  })

  describe('Ejecución del Pipeline CI/CD', () => {
    it('completa exitosamente todas las etapas en código limpio', async () => {
      const runner = new CICDPipelineRunner({ minCoverage: 60 })
      const cleanCode = `export const add = (a, b) => a + b;`
      const result = await runner.executePipeline(cleanCode, { branch: 'main' })

      expect(result.status).toBe(PIPELINE_STATUS.PASSED)
      expect(result.stages.checkout.status).toBe('PASSED')
      expect(result.stages.sast.status).toBe('PASSED')
      expect(result.stages.testing.status).toBe('PASSED')
      expect(result.stages.sca.status).toBe('PASSED')
      expect(result.stages.deploy.status).toBe('PASSED')
      expect(result.logs.length).toBeGreaterThan(0)
    })

    it('rompe el build (Break-the-Build) y cancela el deploy si el análisis SAST falla', async () => {
      const runner = new CICDPipelineRunner({ failFast: true })
      const vulnerableCode = `
        const secret = "super_secret_auth_token_12345678";
        eval(secret);
      `
      const result = await runner.executePipeline(vulnerableCode)

      expect(result.status).toBe(PIPELINE_STATUS.FAILED)
      expect(result.stages.sast.status).toBe('FAILED')
      expect(result.stages.deploy.status).toBe('SKIPPED')
      expect(result.stages.sast.findings.length).toBeGreaterThan(0)
    })
  })
})
