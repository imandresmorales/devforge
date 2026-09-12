/**
 * @fileoverview Tests unitarios para el Patrón Outbox Transaccional.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { TransactionalOutboxEngine, OUTBOX_STATUS } from './transactionalOutbox'

describe('Transactional Outbox Pattern & Event Sourcing', () => {
  let engine

  beforeEach(() => {
    engine = new TransactionalOutboxEngine()
  })

  it('debe registrar atómicamente el pedido y el evento Outbox en estado PENDING', () => {
    const res = engine.createOrderTransaction({
      id: 'ord_101',
      customer: 'Carlos Vega',
      amount: 149.50,
    })

    expect(res.success).toBe(true)
    expect(res.order.id).toBe('ord_101')
    expect(res.outboxEvent.status).toBe(OUTBOX_STATUS.PENDING)
    expect(res.outboxEvent.aggregateId).toBe('ord_101')

    const snapshot = engine.getStateSnapshot()
    expect(snapshot.orders.length).toBe(1)
    expect(snapshot.outboxEvents.length).toBe(1)
    expect(snapshot.stats.transactionsCommitted).toBe(1)
  })

  it('debe hacer rollback completo si falla la transacción SQL', () => {
    const res = engine.createOrderTransaction(
      { id: 'ord_err', customer: 'Test Fail', amount: 50 },
      { simulateDbCrash: true }
    )

    expect(res.success).toBe(false)
    const snapshot = engine.getStateSnapshot()
    expect(snapshot.orders.length).toBe(0)
    expect(snapshot.outboxEvents.length).toBe(0)
    expect(snapshot.stats.transactionsRolledBack).toBe(1)
  })

  it('debe procesar y publicar eventos pendientes al Broker Kafka mediante el Relay CDC', () => {
    engine.createOrderTransaction({ id: 'ord_1', customer: 'Alice', amount: 80 })
    engine.createOrderTransaction({ id: 'ord_2', customer: 'Bob', amount: 120 })

    const relayRes = engine.processPendingOutbox()
    expect(relayRes.publishedCount).toBe(2)
    expect(relayRes.failedCount).toBe(0)

    const snapshot = engine.getStateSnapshot()
    expect(snapshot.brokerEvents.length).toBe(2)
    expect(snapshot.outboxEvents.every((e) => e.status === OUTBOX_STATUS.PUBLISHED)).toBe(true)
  })

  it('debe retener eventos en Outbox si el Broker está caído sin perder datos', () => {
    engine.createOrderTransaction({ id: 'ord_down', customer: 'Dave', amount: 200 })
    engine.setBrokerHealth(false) // Simular caída de red

    const relayRes = engine.processPendingOutbox()
    expect(relayRes.publishedCount).toBe(0)
    expect(relayRes.failedCount).toBe(1)

    const snapshot = engine.getStateSnapshot()
    expect(snapshot.brokerEvents.length).toBe(0) // Broker no recibió nada
    expect(snapshot.outboxEvents[0].status).toBe(OUTBOX_STATUS.PENDING) // Datos seguros en Outbox
    expect(snapshot.stats.inconsistenciesPrevented).toBe(1)

    // Restaurar salud del broker y reintentar
    engine.setBrokerHealth(true)
    const retryRes = engine.processPendingOutbox()
    expect(retryRes.publishedCount).toBe(1)
    expect(engine.getStateSnapshot().brokerEvents.length).toBe(1)
  })

  it('debe deduplicar eventos en el consumidor (Idempotent Consumer)', () => {
    const msgId = 'evt_test_123'
    const firstConsume = engine.consumeEvent(msgId)
    expect(firstConsume.status).toBe('PROCESSED')

    const secondConsume = engine.consumeEvent(msgId)
    expect(secondConsume.status).toBe('DUPLICATE_IGNORED')
  })

  it('debe evidenciar la inconsistencia en el modo Dual-Write si el broker falla', () => {
    const res = engine.simulateDualWrite({ customer: 'Inconsistent User', amount: 500 }, true)
    expect(res.dbSaved).toBe(true)
    expect(res.brokerSent).toBe(false)
    expect(res.isInconsistent).toBe(true) // BD tiene el pedido pero el ecosistema de eventos no
  })
})
