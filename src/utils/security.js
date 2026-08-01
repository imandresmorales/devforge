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

/**
 * Evalúa la fuerza de una contraseña calculando complejidad y reglas de seguridad.
 * @param {string} password - La contraseña a evaluar
 * @returns {{ score: number, label: string, color: string, percentage: number, checks: { length: boolean, upper: boolean, lower: boolean, number: boolean, special: boolean } }}
 */
export function evaluatePasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: 'Sin contraseña',
      color: 'var(--color-text-muted)',
      percentage: 0,
      checks: { length: false, upper: false, lower: false, number: false, special: false },
    }
  }

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }

  let score = 0
  if (checks.length) score += 1
  if (checks.upper && checks.lower) score += 1
  if (checks.number) score += 1
  if (checks.special) score += 1
  if (password.length >= 12) score += 1

  const LEVELS = [
    { label: 'Muy débil', color: '#ef4444', percentage: 20 },
    { label: 'Débil',     color: '#f97316', percentage: 40 },
    { label: 'Media',     color: '#eab308', percentage: 60 },
    { label: 'Fuerte',    color: '#3b82f6', percentage: 80 },
    { label: 'Excelente', color: '#10b981', percentage: 100 },
  ]

  const levelIndex = Math.min(Math.max(0, score - 1), 4)
  const currentLevel = LEVELS[levelIndex]

  return {
    score,
    label: currentLevel.label,
    color: currentLevel.color,
    percentage: currentLevel.percentage,
    checks,
  }
}
