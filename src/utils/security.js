/**
 * @fileoverview Funciones de utilidad para seguridad de la información.
 * @module utils/security
 */
import DOMPurify from 'dompurify'

/**
 * Sanitiza una cadena de texto para evitar ataques XSS (Cross-Site Scripting).
 * Elimina etiquetas HTML y caracteres potencialmente peligrosos.
 * @param {string} input - El texto a sanitizar
 * @returns {string} El texto limpio de HTML o inyecciones
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return ''
  // Limpia cualquier etiqueta o script usando DOMPurify en modo texto plano
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim()
}

/**
 * Sanitiza HTML dinámico permitiendo solo un subconjunto seguro de etiquetas visuales.
 * @param {string} htmlContent - El HTML a sanitizar
 * @returns {string} El HTML sanitizado seguro para renderizado
 */
export function sanitizeHtml(htmlContent) {
  if (typeof htmlContent !== 'string') return ''
  return DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'span', 'code'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  })
}
