import { describe, it, expect, beforeEach } from 'vitest'
import {
  OfflineMutationQueue,
  MUTATION_STATUS,
  computeMutationSignature,
  generateIdempotencyKey,
} from './offlineSyncQueue'

describe('offlineSyncQueue — Cola de Background Sync & Mutaciones Offline (Mejora 103)', () => {
  let queue

  beforeEach(() => {
    queue = new OfflineMutationQueue('test_offline_queue_' + Math.random())
    queue.clearAll()
  })

  it('debe generar claves de idempotencia y firmas consistentes', () => {
    const key1 = generateIdempotencyKey()
    const key2 = generateIdempotencyKey()
    expect(key1).not.toBe(key2)
    expect(key1.startsWith('idemp_')).toBe(true)

    const sig1 = computeMutationSignature('/api/progress', 'POST', { step: 1 })
    const sig2 = computeMutationSignature('/api/progress', 'POST', { step: 1 })
    const sigDiff = computeMutationSignature('/api/progress', 'POST', { step: 2 })

    expect(sig1).toBe(sig2)
    expect(sig1).not.toBe(sigDiff)
  })

  it('debe encolar mutaciones en estado PENDING y con metadata completa', () => {
    const item = queue.enqueue('/api/kanban/card', 'POST', { title: 'Nueva Tarea' })
    expect(item.status).toBe(MUTATION_STATUS.PENDING)
    expect(item.endpoint).toBe('/api/kanban/card')
    expect(item.method).toBe('POST')
    expect(queue.getPending().length).toBe(1)
  })

  it('debe procesar la cola con éxito cuando el executor responde afirmativamente', async () => {
    queue.enqueue('/api/user/profile', 'PUT', { name: 'Andres Morales' })
    queue.enqueue('/api/feedback', 'POST', { rating: 5 })

    const result = await queue.processQueue(async () => true)

    expect(result.processed).toBe(2)
    expect(result.succeeded).toBe(2)
    expect(result.failed).toBe(0)
    expect(queue.getPending().length).toBe(0)
  })

  it('debe detectar alteraciones no autorizadas y marcar FAILED por fallo de firma', async () => {
    const item = queue.enqueue('/api/billing/charge', 'POST', { amount: 100 })
    
    // Simular manipulación no autorizada del payload en cliente
    item.payload.amount = 1 // Tampering

    const result = await queue.processQueue()

    expect(result.failed).toBe(1)
    expect(item.status).toBe(MUTATION_STATUS.FAILED)
    expect(item.error).toContain('Error de integridad')
  })
})
