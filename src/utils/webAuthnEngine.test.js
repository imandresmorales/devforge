/**
 * @fileoverview Tests unitarios para el Motor WebAuthn FIDO2 y Passkeys (Mejora 75).
 * @module utils/webAuthnEngine.test
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateChallenge,
  bufferToBase64Url,
  WebAuthnRPServer,
  AUTHENTICATOR_MODELS,
} from './webAuthnEngine'

describe('Motor de Autenticación Biométrica WebAuthn & FIDO2 (webAuthnEngine.js)', () => {
  describe('Utilidades de Codificación y Desafíos Criptográficos', () => {
    it('genera desafíos Base64URL no vacíos de 32 bytes con alta entropía', () => {
      const c1 = generateChallenge(32)
      const c2 = generateChallenge(32)
      expect(c1).toBeDefined()
      expect(c2).toBeDefined()
      expect(c1).not.toBe(c2)
      expect(c1).not.toContain('+')
      expect(c1).not.toContain('/')
    })

    it('codifica buffers a Base64URL según RFC 4648', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const encoded = bufferToBase64Url(data)
      expect(encoded).toBe('SGVsbG8')
    })
  })

  describe('Ceremonias de Registro y Autenticación del Servidor RP', () => {
    let rpServer
    const mockUser = { id: 'usr_8849', username: 'alex@devforge.app', displayName: 'Alex M.' }

    beforeEach(() => {
      rpServer = new WebAuthnRPServer({ rpId: 'devforge.app', rpName: 'DevForge App' })
    })

    it('genera opciones de creación de credencial (Registration Options) conformes con W3C', () => {
      const options = rpServer.generateRegistrationOptions(mockUser)
      expect(options.challenge).toBeDefined()
      expect(options.rp.id).toBe('devforge.app')
      expect(options.pubKeyCredParams.length).toBeGreaterThanOrEqual(2)
      expect(options.authenticatorSelection.residentKey).toBe('required')
    })

    it('registra exitosamente una nueva Passkey tras verificar la respuesta', () => {
      const options = rpServer.generateRegistrationOptions(mockUser)
      const regResponse = {
        credentialId: 'cred_apple_touch_001',
        publicKey: 'MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE123',
        authenticatorModel: 'APPLE_TOUCH_ID',
      }

      const verifyRes = rpServer.verifyRegistrationResponse(regResponse, options.challenge)
      expect(verifyRes.success).toBe(true)
      expect(verifyRes.passkey.credentialId).toBe('cred_apple_touch_001')
      expect(verifyRes.passkey.authenticatorName).toContain('Touch ID')

      const stored = rpServer.getUserPasskeys('usr_8849')
      expect(stored).toHaveLength(1)
    })

    it('autentica mediante Login Passwordless y avanza el contador de firma', () => {
      // Registro previo
      const regOptions = rpServer.generateRegistrationOptions(mockUser)
      rpServer.verifyRegistrationResponse({
        credentialId: 'cred_yubi_002',
        authenticatorModel: 'YUBIKEY_5',
      }, regOptions.challenge)

      // Ceremonia de Login
      const authOptions = rpServer.generateAuthenticationOptions('usr_8849')
      expect(authOptions.challenge).toBeDefined()
      expect(authOptions.allowCredentials.length).toBe(1)

      const authRes = rpServer.verifyAuthenticationResponse({
        credentialId: 'cred_yubi_002',
        counter: 1,
      }, authOptions.challenge)

      expect(authRes.success).toBe(true)
      expect(authRes.passkeyUsed.signCounter).toBe(1)
    })

    it('bloquea ataques de repetición (Replay Attack) si el contador no incrementa', () => {
      // Registro
      const regOptions = rpServer.generateRegistrationOptions(mockUser)
      rpServer.verifyRegistrationResponse({
        credentialId: 'cred_win_003',
        authenticatorModel: 'WINDOWS_HELLO',
      }, regOptions.challenge)

      // Primera auth válida con counter=5
      const opt1 = rpServer.generateAuthenticationOptions('usr_8849')
      rpServer.verifyAuthenticationResponse({ credentialId: 'cred_win_003', counter: 5 }, opt1.challenge)

      // Intento de replay con counter <= 5
      const opt2 = rpServer.generateAuthenticationOptions('usr_8849')
      const replayAttempt = rpServer.verifyAuthenticationResponse({ credentialId: 'cred_win_003', counter: 4 }, opt2.challenge)

      expect(replayAttempt.success).toBe(false)
      expect(replayAttempt.error).toContain('Replay Attack')
    })
  })
})
