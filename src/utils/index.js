/**
 * @fileoverview Funciones de utilidad puras de la aplicación.
 * 
 * Las funciones de utilidad son puras (sin efectos secundarios),
 * fáciles de testear y reutilizables en toda la aplicación.
 * 
 * @example
 * import { formatDate, truncate, capitalize } from '@/utils'
 */

/**
 * Formatea una fecha en formato legible según el locale del usuario.
 * @param {Date | string | number} date - La fecha a formatear
 * @param {Intl.DateTimeFormatOptions} [options] - Opciones de formato
 * @returns {string} La fecha formateada
 * 
 * @example
 * formatDate(new Date())        // "25 de junio de 2025"
 * formatDate('2025-06-25')      // "25 de junio de 2025"
 */
export function formatDate(date, options = { dateStyle: 'long' }) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-ES', options).format(d)
}

/**
 * Trunca un string a una longitud máxima añadiendo "…" al final.
 * @param {string} str - El string a truncar
 * @param {number} [maxLength=100] - La longitud máxima permitida
 * @returns {string} El string truncado
 * 
 * @example
 * truncate('Hola mundo', 5) // "Hola…"
 */
export function truncate(str, maxLength = 100) {
  if (typeof str !== 'string') return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '…'
}

/**
 * Capitaliza la primera letra de un string.
 * @param {string} str - El string a capitalizar
 * @returns {string} El string con la primera letra en mayúscula
 * 
 * @example
 * capitalize('hola mundo') // "Hola mundo"
 */
export function capitalize(str) {
  if (typeof str !== 'string' || str.length === 0) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Pausa la ejecución durante un número de milisegundos.
 * Útil para simular latencia en desarrollo.
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise<void>}
 * 
 * @example
 * await sleep(500) // espera 500ms
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Genera un ID único simple basado en timestamp + número aleatorio.
 * NO usar en producción para IDs críticos — usar UUID v4 de una librería.
 * @returns {string} Un ID único simple
 * 
 * @example
 * generateId() // "1750000000000-abc123"
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Verifica si un email tiene formato válido.
 * @param {string} email - El email a verificar
 * @returns {boolean} true si el formato es válido
 * 
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('not-an-email')      // false
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
