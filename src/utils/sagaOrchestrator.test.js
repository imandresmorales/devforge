import { describe, it, expect, beforeEach } from 'vitest'
import { SagaOrchestrator, SAGA_STATUS } from './sagaOrchestrator'

describe('Distributed Saga Pattern Orchestrator (sagaOrchestrator.js)', () => {
  let saga

  beforeEach(() => {
    saga = new SagaOrchestrator()
  })

  it('debe completar todos los pasos con éxito en el camino feliz (Happy Path)', async () => {
    const result = await saga.execute({})

    expect(result.success).toBe(true)
    expect(result.state).toBe(SAGA_STATUS.COMPLETED)
    expect(result.executedSteps.length).toBe(3)
    expect(result.executedSteps.every((s) => s.status === 'SUCCESS')).toBe(true)
    expect(result.compensationSteps.length).toBe(0)
  })

  it('debe ejecutar la compensación de inventario cuando falla el pago', async () => {
    const result = await saga.execute({ payment: true })

    expect(result.success).toBe(false)
    expect(result.state).toBe(SAGA_STATUS.FAILED)
    expect(result.executedSteps.length).toBe(2) // inventory (ok), payment (error)
    expect(result.executedSteps[0].status).toBe('SUCCESS')
    expect(result.executedSteps[1].status).toBe('ERROR')

    // Se debe haber compensado el paso 0 (inventario)
    expect(result.compensationSteps.length).toBe(1)
    expect(result.compensationSteps[0].stepId).toBe('inventory')
    expect(result.compensationSteps[0].status).toBe('COMPENSATED')
  })

  it('debe compensar pago e inventario en orden inverso si falla el envío', async () => {
    const result = await saga.execute({ shipping: true })

    expect(result.success).toBe(false)
    expect(result.compensationSteps.length).toBe(2)
    // El orden de compensación debe ser: 1 (payment) luego 0 (inventory)
    expect(result.compensationSteps[0].stepId).toBe('payment')
    expect(result.compensationSteps[1].stepId).toBe('inventory')
  })
})
