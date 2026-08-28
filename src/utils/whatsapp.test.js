import { describe, it, expect } from 'vitest'
import {
  sanitizePhoneNumber,
  generateWhatsAppLink,
  DEFAULT_SUPPORT_PHONE,
  WHATSAPP_TEMPLATES,
} from './whatsapp'

describe('WhatsApp Cloud API Utilities (whatsapp.js)', () => {
  describe('sanitizePhoneNumber', () => {
    it('debe limpiar caracteres especiales, espacios y signos +', () => {
      expect(sanitizePhoneNumber('+57 (300) 123-4567')).toBe('573001234567')
      expect(sanitizePhoneNumber(' +1 800 555 0199 ')).toBe('18005550199')
    })

    it('debe retornar string vacío para inputs no válidos', () => {
      expect(sanitizePhoneNumber(null)).toBe('')
      expect(sanitizePhoneNumber(12345)).toBe('')
    })
  })

  describe('generateWhatsAppLink', () => {
    it('debe generar enlace sin texto si el mensaje está vacío', () => {
      const link = generateWhatsAppLink()
      expect(link).toBe(`https://wa.me/${DEFAULT_SUPPORT_PHONE}`)
    })

    it('debe codificar el mensaje con encodeURIComponent de forma segura', () => {
      const link = generateWhatsAppLink({
        phone: '+57 300 123 4567',
        message: 'Hola DevForge! ¿Cómo están?',
      })
      expect(link).toBe(
        'https://wa.me/573001234567?text=Hola%20DevForge!%20%C2%BFC%C3%B3mo%20est%C3%A1n%3F'
      )
    })

    it('debe sanitizar XSS dentro del mensaje antes de codificarlo', () => {
      const malicious = '<script>alert(1)</script>Hola'
      const link = generateWhatsAppLink({ message: malicious })
      expect(link).not.toContain('script')
      expect(link).toContain('Hola')
    })

    it('debe funcionar con todas las plantillas predeterminadas', () => {
      WHATSAPP_TEMPLATES.forEach((tpl) => {
        const link = generateWhatsAppLink({ message: tpl.text })
        expect(link).toMatch(/^https:\/\/wa\.me\//)
        expect(link).toContain('?text=')
      })
    })
  })
})
