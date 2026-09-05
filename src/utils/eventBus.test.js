import { describe, it, expect, beforeEach } from 'vitest'
import { DistributedEventBus, topicPatternToRegex } from './eventBus'

describe('Simulador de Event Bus y Arquitectura Pub/Sub (eventBus.js)', () => {
  let bus

  beforeEach(() => {
    bus = new DistributedEventBus({ maxRetries: 3 })
  })

  describe('topicPatternToRegex (Wildcards)', () => {
    it('convierte patrones exactos y wildcards correctamente', () => {
      const singleWildcard = topicPatternToRegex('order.*')
      expect(singleWildcard.test('order.created')).toBe(true)
      expect(singleWildcard.test('order.canceled')).toBe(true)
      expect(singleWildcard.test('order.payment.failed')).toBe(false) // Solo 1 segmento

      const multiWildcard = topicPatternToRegex('billing.#')
      expect(multiWildcard.test('billing.invoice')).toBe(true)
      expect(multiWildcard.test('billing.invoice.pdf.generated')).toBe(true)
    })
  })

  describe('Publicación y Enrutamiento a Suscriptores', () => {
    it('despacha eventos a múltiples microservicios suscriptores correspondientes', () => {
      const res = bus.publish('order.created', { orderId: 'ord_99', total: 150 })

      expect(res.status).toBe('DELIVERED')
      // BillingService (order.*), InventoryService (order.created), NotificationService (*.created), AnalyticsService (#)
      expect(res.matchedSubscribers.length).toBe(4)
      expect(bus.getStats().totalDelivered).toBe(4)
    })

    it('ignora eventos con claves de idempotencia duplicadas', () => {
      const payload = { paymentId: 'pay_772', amount: 200 }
      const key = 'idem_key_unique_123'

      const res1 = bus.publish('order.paid', payload, { idempotencyKey: key })
      expect(res1.status).toBe('DELIVERED')

      const res2 = bus.publish('order.paid', payload, { idempotencyKey: key })
      expect(res2.status).toBe('DUPLICATE_IGNORED')

      const stats = bus.getStats()
      expect(stats.duplicatesIgnored).toBe(1)
    })
  })

  describe('Dead Letter Queue (DLQ) & Manejo de Fallos', () => {
    it('aísla en la Dead Letter Queue los eventos que fallan tras superar los reintentos', () => {
      // Configuramos InventoryService para que falle
      bus.setSubscriberFailing('sub-inventory', true)

      const res = bus.publish('order.created', { orderId: 'ord_fail_1' })
      expect(res.status).toBe('PARTIAL_FAILURE')
      expect(res.dlqEntries.length).toBe(1)
      expect(res.dlqEntries[0].targetService).toBe('InventoryService')

      const stats = bus.getStats()
      expect(stats.dlqCount).toBe(1)
      expect(stats.totalRetries).toBe(3)
    })

    it('permite re-procesar eventos desde la Dead Letter Queue (Replay)', () => {
      bus.setSubscriberFailing('sub-inventory', true)
      bus.publish('order.created', { orderId: 'ord_retry_5' })

      const dlqItem = bus.getStats().dlq[0]
      expect(dlqItem).toBeDefined()

      // Restauramos el servicio y reintentamos desde la DLQ
      bus.setSubscriberFailing('sub-inventory', false)
      const replayed = bus.replayDLQEvent(dlqItem.dlqId)

      expect(replayed).toBe(true)
      expect(bus.getStats().dlqCount).toBe(0)
    })
  })
})
