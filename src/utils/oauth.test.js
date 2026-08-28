import { describe, it, expect } from 'vitest'
import {
  generateRandomString,
  generateOAuthParams,
  validateOAuthState,
  exchangeOAuthCode,
  MOCK_OAUTH_PROFILES,
} from './oauth'

describe('OAuth 2.0 Utilities (oauth.js)', () => {
  describe('generateRandomString', () => {
    it('debe generar cadenas de la longitud solicitada', () => {
      expect(generateRandomString(32).length).toBe(32)
      expect(generateRandomString(43).length).toBe(43)
    })

    it('dos cadenas generadas consecutivamente no deben ser iguales', () => {
      const s1 = generateRandomString(32)
      const s2 = generateRandomString(32)
      expect(s1).not.toBe(s2)
    })
  })

  describe('generateOAuthParams & validateOAuthState', () => {
    it('debe generar parámetros de estado y verificador válidos', () => {
      const { state, verifier } = generateOAuthParams()
      expect(state).toMatch(/^st_/)
      expect(verifier.length).toBeGreaterThanOrEqual(43)
    })

    it('debe validar estados coincidentes correctamente', () => {
      const state = 'st_valid_12345'
      expect(validateOAuthState(state, state)).toBe(true)
    })

    it('debe rechazar estados que no coinciden (ataque CSRF)', () => {
      expect(validateOAuthState('st_attacker', 'st_victim')).toBe(false)
      expect(validateOAuthState(null, 'st_victim')).toBe(false)
      expect(validateOAuthState('st_attacker', undefined)).toBe(false)
    })
  })

  describe('exchangeOAuthCode', () => {
    it('debe intercambiar un código válido de Google por el perfil y access token', async () => {
      const res = await exchangeOAuthCode('google', 'auth_code_test_12345', 'verifier_xyz')
      expect(res.profile.email).toBe(MOCK_OAUTH_PROFILES.google.email)
      expect(res.accessToken).toMatch(/^df_oauth_acc_google_/)
      expect(res.verifierUsed).toBe(true)
    })

    it('debe intercambiar un código válido de GitHub', async () => {
      const res = await exchangeOAuthCode('github', 'auth_code_github_998877')
      expect(res.profile.provider).toBe('github')
      expect(res.accessToken).toMatch(/^df_oauth_acc_github_/)
    })

    it('debe lanzar error ante código inválido o muy corto', async () => {
      await expect(exchangeOAuthCode('google', 'short')).rejects.toThrow('Código de autorización')
    })

    it('debe lanzar error ante proveedor no soportado', async () => {
      await expect(exchangeOAuthCode('unsupported_prov', 'code_12345678')).rejects.toThrow(
        'Proveedor OAuth no soportado'
      )
    })
  })
})
