/**
 * @fileoverview Utilidades para integración segura con WhatsApp Cloud API y Deep Links.
 *
 * SEGURIDAD Y BUENAS PRÁCTICAS:
 * - Sanitización estricta de números telefónicos (solo dígitos según estándar E.164).
 * - Codificación segura de parámetros URL con encodeURIComponent (anti-inyección).
 * - Validación de longitud de mensajes para evitar límites de URL de navegadores.
 *
 * @module utils/whatsapp
 */
import { sanitizeInput } from './security'

/** Teléfono de soporte predeterminado de DevForge (formato internacional sin +) */
export const DEFAULT_SUPPORT_PHONE = '573001234567'

/** Plantillas rápidas de soporte */
export const WHATSAPP_TEMPLATES = [
  {
    id: 'tech',
    label: '🛠️ Soporte Técnico',
    text: 'Hola equipo de DevForge, necesito ayuda técnica con una de las mejoras del proyecto.',
  },
  {
    id: 'pricing',
    label: '💳 Planes y Facturación',
    text: 'Hola, tengo una consulta sobre las suscripciones y métodos de pago de DevForge.',
  },
  {
    id: 'roadmap',
    label: '🚀 Sugerencia de Roadmap',
    text: 'Hola, me gustaría sugerir una nueva tecnología para las 100 mejoras continuas.',
  },
]

/**
 * Sanitiza un número de teléfono extrayendo únicamente los dígitos válidos.
 * @param {string} phone
 * @returns {string}
 */
export function sanitizePhoneNumber(phone) {
  if (typeof phone !== 'string') return ''
  return phone.replace(/\D/g, '').trim()
}

/**
 * Genera un enlace seguro tipo wa.me con mensaje codificado.
 *
 * @param {Object} params
 * @param {string} [params.phone=DEFAULT_SUPPORT_PHONE] - Número internacional
 * @param {string} [params.message=''] - Mensaje inicial
 * @returns {string} URL segura para abrir WhatsApp
 *
 * @example
 * generateWhatsAppLink({ message: 'Hola DevForge' })
 * // "https://wa.me/573001234567?text=Hola%20DevForge"
 */
export function generateWhatsAppLink({ phone = DEFAULT_SUPPORT_PHONE, message = '' } = {}) {
  const cleanPhone = sanitizePhoneNumber(phone) || DEFAULT_SUPPORT_PHONE
  const cleanMessage = sanitizeInput(message)

  if (!cleanMessage) {
    return `https://wa.me/${cleanPhone}`
  }

  // Truncar si el mensaje excede el límite seguro de URL (1000 caracteres)
  const safeMessage = cleanMessage.slice(0, 1000)
  const encodedText = encodeURIComponent(safeMessage)

  return `https://wa.me/${cleanPhone}?text=${encodedText}`
}
