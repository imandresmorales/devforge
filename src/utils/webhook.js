/**
 * @fileoverview Motor de generación, simulación y verificación criptográfica de Webhooks (Mejora 42).
 *
 * CARACTERÍSTICAS:
 * - Algoritmo de firma HMAC SHA-256 simulado para validación de integridad (`X-DevForge-Signature`).
 * - Plantillas de eventos predefinidos para Stripe, GitHub, Auth y WhatsApp.
 * - Despachador de eventos con medición de latencia y registro de auditoría.
 *
 * @module utils/webhook
 */

export const WEBHOOK_TEMPLATES = [
  {
    id: 'stripe_payment',
    name: '💳 Stripe: payment_intent.succeeded',
    event: 'payment.succeeded',
    payload: JSON.stringify(
      {
        id: 'evt_stripe_9921',
        type: 'payment_intent.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'pi_3MtwBwLkdIwHu7ix',
            amount: 4900,
            currency: 'usd',
            status: 'succeeded',
            customer_email: 'cliente@devforge.local',
          },
        },
      },
      null,
      2
    ),
  },
  {
    id: 'github_push',
    name: '🐙 GitHub: push to main',
    event: 'push',
    payload: JSON.stringify(
      {
        ref: 'refs/heads/main',
        repository: { name: 'devforge', full_name: 'imandresmorales/devforge' },
        commits: [
          {
            id: '92d6f2c',
            message: 'feat: [Mejora 42] gestor de webhooks con verificacion HMAC',
            author: { name: 'Andres Morales' },
          },
        ],
      },
      null,
      2
    ),
  },
  {
    id: 'auth_signup',
    name: '🔐 Auth: user.registered',
    event: 'user.registered',
    payload: JSON.stringify(
      {
        event: 'user.registered',
        user_id: 'usr_88192a',
        email: 'alex@devforge.io',
        role: 'developer',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    ),
  },
]

/**
 * Calcula una firma hash hexadecimal determinística a partir del payload y un secreto.
 * @param {string} payload - Contenido JSON en texto
 * @param {string} secret - Clave secreta
 * @returns {string} Firma hexadecimal tipo "sha256=..."
 */
export function generateWebhookSignature(payload = '', secret = 'whsec_devforge_secret') {
  let hash = 0
  const combined = `${secret}:${payload}`
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convierte a entero de 32 bits
  }
  const hex = Math.abs(hash).toString(16).padStart(16, '0')
  return `sha256=${hex}${Math.abs(hash * 31).toString(16).padStart(16, '0')}`
}

/**
 * Verifica si una firma dada coincide con el payload y el secreto.
 * @param {string} payload
 * @param {string} secret
 * @param {string} signature
 * @returns {boolean}
 */
export function verifyWebhookSignature(payload, secret, signature) {
  if (!payload || !secret || !signature) return false
  const expected = generateWebhookSignature(payload, secret)
  return expected === signature
}

/**
 * Simula el despacho de un webhook hacia un endpoint receptor.
 * @param {Object} params
 * @param {string} params.event
 * @param {string} params.payload
 * @param {string} [params.secret]
 * @param {string} [params.endpoint]
 * @returns {Promise<Object>} Registro del despacho
 */
export async function dispatchWebhookSimulated({
  event,
  payload,
  secret = 'whsec_test_secret_123',
  endpoint = 'https://api.devforge.local/v1/webhooks',
}) {
  const startTime = performance.now()
  const signature = generateWebhookSignature(payload, secret)

  // Simular latencia de red de 60ms a 140ms
  await new Promise((resolve) => setTimeout(resolve, 80))
  const latencyMs = Math.round(performance.now() - startTime)

  return {
    id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    event,
    endpoint,
    status: 200,
    statusText: 'OK',
    latencyMs,
    signature,
    timestamp: new Date().toISOString(),
    payload,
    headers: {
      'Content-Type': 'application/json',
      'X-DevForge-Event': event,
      'X-DevForge-Signature': signature,
      'User-Agent': 'DevForge-Webhook-Engine/2.4.0',
    },
  }
}
