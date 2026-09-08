/**
 * @fileoverview Tests unitarios para el Auditor de Seguridad CSRF y Cookies SameSite (Mejora 71).
 * @module utils/csrfAuditor.test
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateCsrfToken,
  CsrfTokenManager,
  auditCookieSecurity,
  auditIncomingRequest,
} from './csrfAuditor'

describe('Auditor de Seguridad CSRF y SameSite Cookies (csrfAuditor.js)', () => {
  describe('Generador y Gestor de Tokens CSRF (Synchronizer Token Pattern)', () => {
    let manager

    beforeEach(() => {
      manager = new CsrfTokenManager({ ttlMs: 1000 })
    })

    it('genera tokens criptográficos aleatorios de longitud suficiente', () => {
      const token1 = generateCsrfToken(32)
      const token2 = generateCsrfToken(32)
      expect(token1).toHaveLength(32)
      expect(token2).toHaveLength(32)
      expect(token1).not.toBe(token2)
    })

    it('valida exitosamente un token legítimo dentro de la ventana de expiración', () => {
      const token = manager.createToken('session_user_123')
      const result = manager.validateToken('session_user_123', token)
      expect(result.valid).toBe(true)
    })

    it('rechaza peticiones con tokens incorrectos o ausentes', () => {
      manager.createToken('session_user_123')
      const resultBad = manager.validateToken('session_user_123', 'fake_forged_token_xyz')
      expect(resultBad.valid).toBe(false)
      expect(resultBad.reason).toContain('inválido')

      const resultMissing = manager.validateToken('session_user_123', '')
      expect(resultMissing.valid).toBe(false)
    })

    it('invalida tokens tras expirar el TTL configurado', async () => {
      const shortManager = new CsrfTokenManager({ ttlMs: 10 })
      const token = shortManager.createToken('session_exp')
      await new Promise((resolve) => setTimeout(resolve, 20))

      const result = shortManager.validateToken('session_exp', token)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('expirado')
    })
  })

  describe('Auditor de Configuración de Cookies de Sesión', () => {
    it('otorga calificación A+ a cookies con SameSite=Strict, HttpOnly y Secure', () => {
      const audit = auditCookieSecurity({
        name: '__Host-session',
        sameSite: 'Strict',
        secure: true,
        httpOnly: true,
      })
      expect(audit.isSecure).toBe(true)
      expect(audit.score).toBe(100)
      expect(audit.rating).toBe('A+')
      expect(audit.issues).toHaveLength(0)
    })

    it('detecta problemas críticos si SameSite=None carece del flag Secure', () => {
      const audit = auditCookieSecurity({
        name: 'session_id',
        sameSite: 'None',
        secure: false,
        httpOnly: false,
      })
      expect(audit.isSecure).toBe(false)
      expect(audit.rating).toBe('F')
      expect(audit.issues.some((i) => i.severity === 'CRITICAL')).toBe(true)
    })
  })

  describe('Auditor de Peticiones HTTP Entrantes (Cross-Site Inspector)', () => {
    const allowed = ['https://devforge.app']

    it('permite peticiones GET seguras de solo lectura', () => {
      const req = { method: 'GET', origin: 'https://devforge.app', secFetchSite: 'same-origin' }
      const res = auditIncomingRequest(req, allowed)
      expect(res.passed).toBe(true)
      expect(res.verdict).toBe('REQUEST_ALLOWED')
    })

    it('bloquea peticiones POST mutantes originadas desde dominios externos sin token CSRF', () => {
      const req = {
        method: 'POST',
        origin: 'https://evil-attacker-site.org',
        secFetchSite: 'cross-site',
        hasCsrfToken: false,
      }
      const res = auditIncomingRequest(req, allowed)
      expect(res.passed).toBe(false)
      expect(res.verdict).toBe('REQUEST_BLOCKED_CSRF')
      expect(res.findings.length).toBeGreaterThan(0)
    })

    it('permite peticiones mutantes con token CSRF válido', () => {
      const req = {
        method: 'POST',
        origin: 'https://devforge.app',
        secFetchSite: 'same-origin',
        hasCsrfToken: true,
      }
      const res = auditIncomingRequest(req, allowed)
      expect(res.passed).toBe(true)
      expect(res.verdict).toBe('REQUEST_ALLOWED')
    })
  })
})
