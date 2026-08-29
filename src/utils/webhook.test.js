import { describe, it, expect } from 'vitest'
import {
  generateWebhookSignature,
  verifyWebhookSignature,
  dispatchWebhookSimulated,
  WEBHOOK_TEMPLATES,
} from './webhook'

describe('Webhook Engine & HMAC Security (webhook.js)', () => {
  it('debe generar una firma sha256 determinística', () => {
    const payload = JSON.stringify({ test: 'ok' })
    const secret = 'whsec_secret_key'
    const sig1 = generateWebhookSignature(payload, secret)
    const sig2 = generateWebhookSignature(payload, secret)

    expect(sig1).toMatch(/^sha256=/)
    expect(sig1).toBe(sig2)
  })

  it('debe verificar firmas válidas y rechazar firmas alteradas', () => {
    const payload = '{"amount": 100}'
    const secret = 'whsec_secret'
    const validSig = generateWebhookSignature(payload, secret)

    expect(verifyWebhookSignature(payload, secret, validSig)).toBe(true)
    expect(verifyWebhookSignature(payload, 'wrong_secret', validSig)).toBe(false)
    expect(verifyWebhookSignature('{"amount": 999}', secret, validSig)).toBe(false)
  })

  it('debe simular el despacho de un webhook con cabeceras y latencia', async () => {
    const tpl = WEBHOOK_TEMPLATES[0]
    const result = await dispatchWebhookSimulated({
      event: tpl.event,
      payload: tpl.payload,
    })

    expect(result.status).toBe(200)
    expect(result.headers['X-DevForge-Signature']).toBeDefined()
    expect(result.latencyMs).toBeGreaterThan(0)
  })
})
