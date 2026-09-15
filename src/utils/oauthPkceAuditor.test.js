import { describe, it, expect } from 'vitest'
import {
  generateCodeVerifier,
  computeCodeChallenge,
  generateOAuthState,
  buildAuthorizationRequest,
  validateTokenExchange,
  runPKCEAttackSimulation
} from './oauthPkceAuditor.js'

describe('oauthPkceAuditor — OAuth 2.0 PKCE (RFC 7636) Security Auditor', () => {
  it('genera code_verifier válido que cumple con la longitud y caracteres de RFC 7636', () => {
    const verifier = generateCodeVerifier(64)
    expect(verifier).toHaveLength(64)
    // Solo caracteres unreserved: [A-Za-z0-9-._~]
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]{43,128}$/)
  })

  it('calcula code_challenge con método S256 (Base64URL(SHA-256)) sin padding "="', () => {
    const verifier = 'E9Melhoa2OwvFrGMTJguCH5rtG6j3BQ4207b8B6Nxg8'
    const challenge = computeCodeChallenge(verifier, 'S256')

    expect(challenge).toBeTruthy()
    expect(challenge).not.toContain('=')
    expect(challenge).not.toContain('+')
    expect(challenge).not.toContain('/')
  })

  it('construye una URL de autorización con parámetros obligatorios de PKCE y Anti-CSRF state', () => {
    const req = buildAuthorizationRequest({
      clientId: 'my-app',
      redirectUri: 'https://my-app.com/callback',
      scope: 'read write'
    })

    expect(req.authorizeUrl).toContain('response_type=code')
    expect(req.authorizeUrl).toContain('code_challenge=')
    expect(req.authorizeUrl).toContain('code_challenge_method=S256')
    expect(req.authorizeUrl).toContain('state=')
    expect(req.verifier).toHaveLength(64)
  })

  it('permite el canje exitoso de tokens cuando se provee el code_verifier legítimo', () => {
    const req = buildAuthorizationRequest()
    const issuedCode = 'auth_code_legit_123'
    const serverSession = {
      codeChallenge: req.challenge,
      codeChallengeMethod: 'S256',
      issuedCode
    }

    const exchange = validateTokenExchange(serverSession, issuedCode, req.verifier)
    expect(exchange.success).toBe(true)
    expect(exchange.accessToken).toBeTruthy()
    expect(exchange.idToken).toBeTruthy()
    expect(exchange.refreshToken).toBeTruthy()
  })

  it('bloquea y aborta el canje de tokens ante intentos de intercepción por atacantes sin verifier o con verifier falso', () => {
    const req = buildAuthorizationRequest()
    const sim = runPKCEAttackSimulation(req)

    expect(sim.legitimateExchange.success).toBe(true)
    expect(sim.attackerExchangeNoVerifier.success).toBe(false)
    expect(sim.attackerExchangeFakeVerifier.success).toBe(false)
    expect(sim.attackThwarted).toBe(true)
  })
})
