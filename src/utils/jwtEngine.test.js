import { describe, it, expect } from 'vitest'
import {
  base64UrlEncode,
  base64UrlDecode,
  createJWT,
  inspectJWT,
  constantTimeCompare,
  generateJWTSignature,
} from './jwtEngine'

describe('Motor de Tokens JWT y Criptografía HMAC-SHA256 (jwtEngine.js)', () => {
  const secretKey = 'super_secret_jwt_key_at_least_32_chars_long_for_security'

  describe('Base64URL Encoding & Decoding', () => {
    it('codifica y decodifica texto correctamente sin caracteres de relleno problemáticos', () => {
      const text = 'Hello, DevForge ⚡'
      const encoded = base64UrlEncode(text)
      expect(encoded).not.toContain('+')
      expect(encoded).not.toContain('/')
      expect(encoded).not.toContain('=')

      const decoded = base64UrlDecode(encoded)
      expect(decoded).toBe(text)
    })
  })

  describe('Creación e Inspección de JWT', () => {
    it('genera un token válido de 3 partes con firma HMAC-SHA256', () => {
      const header = { alg: 'HS256', typ: 'JWT' }
      const payload = { sub: 'usr_123', name: 'Alex', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 }

      const token = createJWT(header, payload, secretKey)
      const parts = token.split('.')
      expect(parts.length).toBe(3)

      const inspection = inspectJWT(token, secretKey)
      expect(inspection.isValidFormat).toBe(true)
      expect(inspection.header.alg).toBe('HS256')
      expect(inspection.payload.sub).toBe('usr_123')
      expect(inspection.isSignatureValid).toBe(true)
      expect(inspection.isExpired).toBe(false)
    })

    it('detecta firma inválida si el payload es modificado por un atacante', () => {
      const header = { alg: 'HS256', typ: 'JWT' }
      const originalPayload = { sub: 'usr_123', role: 'user' }
      const token = createJWT(header, originalPayload, secretKey)

      // Atacante modifica el payload para promoverse a admin
      const tamperedPayloadB64 = base64UrlEncode(JSON.stringify({ sub: 'usr_123', role: 'admin' }))
      const [headerB64, , sigB64] = token.split('.')
      const tamperedToken = `${headerB64}.${tamperedPayloadB64}.${sigB64}`

      const inspection = inspectJWT(tamperedToken, secretKey)
      expect(inspection.isSignatureValid).toBe(false)
    })

    it('detecta la vulnerabilidad crítica "alg: none" (CVE-2015-9235)', () => {
      const header = { alg: 'none', typ: 'JWT' }
      const payload = { sub: 'root', role: 'superadmin' }
      const noneToken = createJWT(header, payload)

      const inspection = inspectJWT(noneToken, secretKey)
      expect(inspection.isAlgNone).toBe(true)
      expect(inspection.securityWarnings.some((w) => w.level === 'CRITICAL' && w.title.includes('alg: none'))).toBe(true)
    })

    it('detecta tokens expirados mediante el claim "exp"', () => {
      const header = { alg: 'HS256', typ: 'JWT' }
      const expiredPayload = { sub: 'usr_1', exp: Math.floor(Date.now() / 1000) - 300 } // Expirado hace 5 min
      const token = createJWT(header, expiredPayload, secretKey)

      const inspection = inspectJWT(token, secretKey)
      expect(inspection.isExpired).toBe(true)
      expect(inspection.securityWarnings.some((w) => w.level === 'HIGH' && w.title.includes('Token Expirado'))).toBe(true)
    })

    it('alerta ante fuga de datos confidenciales (passwords) en el payload', () => {
      const header = { alg: 'HS256', typ: 'JWT' }
      const leakPayload = { sub: 'usr_1', password: 'plain_password_123' }
      const token = createJWT(header, leakPayload, secretKey)

      const inspection = inspectJWT(token, secretKey)
      expect(inspection.securityWarnings.some((w) => w.level === 'CRITICAL' && w.title.includes('Fuga de Datos'))).toBe(true)
    })
  })

  describe('constantTimeCompare', () => {
    it('compara firmas de forma exacta y mitiga ataques de temporización', () => {
      expect(constantTimeCompare('secret_sig_123', 'secret_sig_123')).toBe(true)
      expect(constantTimeCompare('secret_sig_123', 'secret_sig_124')).toBe(false)
      expect(constantTimeCompare('secret_sig_123', 'short')).toBe(false)
    })
  })
})
