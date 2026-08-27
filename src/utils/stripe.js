/**
 * @fileoverview Utilidades para procesamiento y validación de pagos con Stripe.
 *
 * SEGURIDAD Y BUENAS PRÁCTICAS:
 * - Algoritmo de Luhn (MOD 10) para validación matemática de números de tarjeta.
 * - Formateo defensivo para evitar almacenar caracteres inválidos.
 * - NUNCA almacenar números de tarjeta en texto plano.
 * - Simulación de tokenización segura (retorna token tipo `tok_...` en lugar de datos sensibles).
 *
 * @module utils/stripe
 */

/**
 * Valida un número de tarjeta de crédito mediante el Algoritmo de Luhn (Mod 10).
 * @param {string} cardNumber - Número de tarjeta (con o sin espacios)
 * @returns {boolean} true si el número es matemáticamente válido
 */
export function validateLuhn(cardNumber) {
  if (typeof cardNumber !== 'string') return false
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 19) return false

  let sum = 0
  let shouldDouble = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10)

    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

/**
 * Detecta la franquicia de la tarjeta de crédito a partir del número.
 * @param {string} cardNumber
 * @returns {'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'}
 */
export function detectCardBrand(cardNumber) {
  const clean = cardNumber.replace(/\D/g, '')
  if (/^4/.test(clean)) return 'visa'
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(clean)) return 'mastercard'
  if (/^3[47]/.test(clean)) return 'amex'
  if (/^6(?:011|5)/.test(clean)) return 'discover'
  return 'unknown'
}

/**
 * Formatea el número de tarjeta añadiendo un espacio cada 4 dígitos.
 * @param {string} value
 * @returns {string}
 */
export function formatCardNumber(value) {
  const clean = value.replace(/\D/g, '').slice(0, 16)
  return clean.replace(/(\d{4})(?=\d)/g, '$1 ')
}

/**
 * Formatea la fecha de expiración en formato MM/YY.
 * @param {string} value
 * @returns {string}
 */
export function formatExpiry(value) {
  const clean = value.replace(/\D/g, '').slice(0, 4)
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`
  }
  return clean
}

/**
 * Valida si una fecha de expiración MM/YY es futura y válida.
 * @param {string} expiry - Formato 'MM/YY' o 'MMYY'
 * @returns {boolean}
 */
export function validateExpiry(expiry) {
  const clean = expiry.replace(/\D/g, '')
  if (clean.length !== 4) return false

  const month = parseInt(clean.slice(0, 2), 10)
  const year = parseInt(`20${clean.slice(2, 4)}`, 10)

  if (month < 1 || month > 12) return false

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12

  if (year < currentYear) return false
  if (year === currentYear && month < currentMonth) return false

  return true
}

/**
 * Simula la tokenización segura en Stripe (Stripe.js `createToken`).
 * Retorna un token seguro simulado sin exponer el número de tarjeta.
 *
 * @param {{ number: string, name: string, expiry: string, cvc: string }} cardData
 * @returns {Promise<{ token: string, brand: string, last4: string, created: number }>}
 */
export async function simulateStripeToken(cardData) {
  await new Promise((resolve) => setTimeout(resolve, 800))

  const cleanNumber = cardData.number.replace(/\D/g, '')
  const last4 = cleanNumber.slice(-4)
  const brand = detectCardBrand(cleanNumber)

  return {
    token: `tok_sim_${Math.random().toString(36).slice(2, 12)}_${Date.now()}`,
    brand,
    last4,
    created: Date.now(),
  }
}
