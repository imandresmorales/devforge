import { describe, it, expect } from 'vitest'
import {
  validateLuhn,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  validateExpiry,
  simulateStripeToken,
} from './stripe'

describe('Stripe & Card Utilities (stripe.js)', () => {
  describe('validateLuhn', () => {
    it('debe validar correctamente números de tarjeta con Algoritmo de Luhn', () => {
      // Tarjetas de prueba oficiales de Stripe que cumplen Luhn
      expect(validateLuhn('4242 4242 4242 4242')).toBe(true)
      expect(validateLuhn('4111 1111 1111 1111')).toBe(true)
      expect(validateLuhn('49927398716')).toBe(true)
    })

    it('debe rechazar números inválidos que fallan el checksum de Luhn', () => {
      expect(validateLuhn('4242 4242 4242 4241')).toBe(false)
      expect(validateLuhn('4111 1111 1111 1112')).toBe(false)
      expect(validateLuhn('49927398717')).toBe(false)
    })

    it('debe rechazar cadenas cortas o no válidas', () => {
      expect(validateLuhn('123')).toBe(false)
      expect(validateLuhn('')).toBe(false)
      expect(validateLuhn(null)).toBe(false)
    })
  })

  describe('detectCardBrand', () => {
    it('debe identificar tarjetas Visa que inician con 4', () => {
      expect(detectCardBrand('4111 1111 1111 1111')).toBe('visa')
    })

    it('debe identificar tarjetas Mastercard', () => {
      expect(detectCardBrand('5105 1051 0510 5100')).toBe('mastercard')
      expect(detectCardBrand('2221 0000 0000 0000')).toBe('mastercard')
    })

    it('debe identificar American Express que inician con 34 o 37', () => {
      expect(detectCardBrand('3782 822463 10005')).toBe('amex')
      expect(detectCardBrand('3400 000000 00000')).toBe('amex')
    })

    it('debe identificar Discover que inician con 6011 o 65', () => {
      expect(detectCardBrand('6011 0000 0000 0000')).toBe('discover')
      expect(detectCardBrand('6500 0000 0000 0000')).toBe('discover')
    })

    it('debe retornar unknown para patrones no reconocidos', () => {
      expect(detectCardBrand('9999 0000 0000 0000')).toBe('unknown')
    })
  })

  describe('formatCardNumber & formatExpiry', () => {
    it('debe formatear números de tarjeta con espacios cada 4 dígitos', () => {
      expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111')
    })

    it('debe formatear la expiración con formato MM/YY', () => {
      expect(formatExpiry('1228')).toBe('12/28')
      expect(formatExpiry('05')).toBe('05')
    })
  })

  describe('validateExpiry', () => {
    it('debe aceptar fechas futuras válidas', () => {
      expect(validateExpiry('12/35')).toBe(true)
      expect(validateExpiry('08/30')).toBe(true)
    })

    it('debe rechazar meses inválidos como 13 o 00', () => {
      expect(validateExpiry('13/28')).toBe(false)
      expect(validateExpiry('00/28')).toBe(false)
    })

    it('debe rechazar años pasados', () => {
      expect(validateExpiry('01/20')).toBe(false)
    })
  })

  describe('simulateStripeToken', () => {
    it('debe generar un token seguro simulado tipo tok_...', async () => {
      const result = await simulateStripeToken({
        number: '4111111111111111',
        name: 'Andres Morales',
        expiry: '12/28',
        cvc: '123',
      })

      expect(result.token).toMatch(/^tok_sim_/)
      expect(result.brand).toBe('visa')
      expect(result.last4).toBe('1111')
      expect(typeof result.created).toBe('number')
    })
  })
})
