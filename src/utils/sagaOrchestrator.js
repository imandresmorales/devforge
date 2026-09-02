/**
 * @fileoverview Orquestador de transacciones distribuidas con el Patrón Saga y transacciones de compensación (Mejora 52).
 *
 * CARACTERÍSTICAS:
 * - Implementación del patrón Saga Orquestado para consistencia eventual en microservicios.
 * - Ejecución de acciones hacia adelante (Forward Execution) y compensaciones en reversa (Compensating Rollback).
 * - Trazabilidad completa del ciclo de vida de la transacción distribuida.
 * - Escenarios predefinidos de fallos en pasarela de pagos, inventario y logística.
 *
 * @module utils/sagaOrchestrator
 */

export const SAGA_STATUS = {
  IDLE: 'IDLE',
  EXECUTING: 'EXECUTING',
  COMPLETED: 'COMPLETED',
  COMPENSATING: 'COMPENSATING',
  FAILED: 'FAILED',
}

export const DEFAULT_SAGA_STEPS = [
  {
    id: 'inventory',
    title: '📦 Reserva de Inventario',
    service: 'Inventory-Microservice',
    actionName: 'reserveStock()',
    compensationName: 'releaseStock()',
  },
  {
    id: 'payment',
    title: '💳 Procesamiento de Pago',
    service: 'Payment-Gateway-Service',
    actionName: 'chargeCustomer()',
    compensationName: 'refundCharge()',
  },
  {
    id: 'shipping',
    title: '🚚 Creación de Envío',
    service: 'Logistics-Microservice',
    actionName: 'createShippingLabel()',
    compensationName: 'cancelShippingOrder()',
  },
]

export class SagaOrchestrator {
  /**
   * @param {Array<typeof DEFAULT_SAGA_STEPS[0]>} [steps=DEFAULT_SAGA_STEPS]
   */
  constructor(steps = DEFAULT_SAGA_STEPS) {
    this.steps = steps
    this.state = SAGA_STATUS.IDLE
    this.logs = []
  }

  /**
   * Ejecuta la transacción distribuida Saga.
   *
   * @param {Object} [failureFlags={}] - Banderas para forzar fallos simulados (ej. { payment: true })
   * @returns {Promise<{ success: boolean, state: string, executedSteps: Array<Object>, compensationSteps: Array<Object> }>}
   */
  async execute(failureFlags = {}) {
    this.state = SAGA_STATUS.EXECUTING
    const executedSteps = []
    const compensationSteps = []
    let failedStepIndex = -1

    // 1. Fase hacia adelante (Forward Execution)
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i]
      const shouldFail = !!failureFlags[step.id]

      if (shouldFail) {
        failedStepIndex = i
        executedSteps.push({
          stepId: step.id,
          title: step.title,
          service: step.service,
          action: step.actionName,
          status: 'ERROR',
          message: `Fallo forzado en ${step.service}: Timeout o error 500`,
          time: new Date().toLocaleTimeString(),
        })
        break
      } else {
        executedSteps.push({
          stepId: step.id,
          title: step.title,
          service: step.service,
          action: step.actionName,
          status: 'SUCCESS',
          message: `Ejecutado con éxito en ${step.service}`,
          time: new Date().toLocaleTimeString(),
        })
      }
    }

    // 2. Si hubo fallo, ejecutar compensaciones en orden inverso
    if (failedStepIndex !== -1) {
      this.state = SAGA_STATUS.COMPENSATING

      // Compensar los pasos que se completaron con éxito antes del fallo
      for (let i = failedStepIndex - 1; i >= 0; i--) {
        const stepToCompensate = this.steps[i]
        compensationSteps.push({
          stepId: stepToCompensate.id,
          title: stepToCompensate.title,
          service: stepToCompensate.service,
          action: stepToCompensate.compensationName,
          status: 'COMPENSATED',
          message: `Compensación completada: ${stepToCompensate.compensationName} ejecutado`,
          time: new Date().toLocaleTimeString(),
        })
      }

      this.state = SAGA_STATUS.FAILED
      return {
        success: false,
        state: this.state,
        executedSteps,
        compensationSteps,
      }
    }

    this.state = SAGA_STATUS.COMPLETED
    return {
      success: true,
      state: this.state,
      executedSteps,
      compensationSteps: [],
    }
  }
}
