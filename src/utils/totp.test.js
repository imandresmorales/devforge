import { describe, it, expect } from 'vitest'
import {
  generateBase32Secret,
  generateTOTP,
  verifyTOTP,
  generateOtpAuthURI,
} from './totp'

describe('TOTP 2FA Authentication Engine (totp.js)', () => {
  it('debe generar una clave secreta Base32 válida', () => {
    const secret = generateBase32Secret(16)
    expect(secret.length).toBe(16)
    expect(/^[A-Z2-7]+$/.test(secret)).toBe(true)
  })

  it('debe generar códigos de 6 dígitos numéricos con tiempo restante', () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const totp = generateTOTP(secret)

    expect(totp.code.length).toBe(6)
    expect(/^\d{6}$/.test(totp.code)).toBe(true)
    expect(totp.remainingSeconds).toBeGreaterThan(0)
    expect(totp.remainingSeconds).toBeLessThanOrEqual(30)
  })

  it('debe verificar con éxito un código generado en la ventana actual', () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const fixedTime = 1700000000000
    const totp = generateTOTP(secret, fixedTime)

    const verification = verifyTOTP(totp.code, secret, 1, fixedTime)
    expect(verification.isValid).toBe(true)
    expect(verification.matchedStepOffset).toBe(0)
  })

  it('debe rechazar códigos inválidos o con formato incorrecto', () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    expect(verifyTOTP('12345', secret).isValid).toBe(false)
    expect(verifyTOTP('abcdef', secret).isValid).toBe(false)
    expect(verifyTOTP('999999', secret).isValid).toBe(false)
  })

  it('debe construir un URI otpauth:// conforme a la especificación', () => {
    const uri = generateOtpAuthURI('user@devforge.io', 'JBSWY3DPEHPK3PXP', 'DevForge')
    expect(uri).toContain('otpauth://totp/DevForge:user%40devforge.io')
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP')
    expect(uri).toContain('digits=6')
    expect(uri).toContain('period=30')
  })
})
