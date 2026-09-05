import { describe, it, expect, beforeEach } from 'vitest'
import { DatabaseEngineSimulator } from './acidSimulator'

describe('Simulador de Transacciones ACID y Niveles de Aislamiento (acidSimulator.js)', () => {
  let db

  beforeEach(() => {
    db = new DatabaseEngineSimulator()
  })

  describe('Escenario: Dirty Read', () => {
    it('detecta Dirty Read en nivel Read Uncommitted', () => {
      db.setScenario('dirty_read')
      db.setIsolationLevel('READ_UNCOMMITTED')

      // Ejecutar hasta el paso 3 (lectura de Tx 2)
      db.stepNext() // Step 1 (BEGIN)
      db.stepNext() // Step 2 (UPDATE uncommitted a 100)
      const res3 = db.stepNext() // Step 3 (READ)

      expect(res3.logEntry.observedValue).toBe(100)
      expect(res3.logEntry.anomaly).toBe('DIRTY_READ_DETECTED')
    })

    it('previene Dirty Read en nivel Read Committed leyendo el valor confirmado', () => {
      db.setScenario('dirty_read')
      db.setIsolationLevel('READ_COMMITTED')

      db.stepNext()
      db.stepNext()
      const res3 = db.stepNext()

      expect(res3.logEntry.observedValue).toBe(500)
      expect(res3.logEntry.anomaly).toBe('DIRTY_READ_PREVENTED')
    })
  })

  describe('Escenario: Non-Repeatable Read', () => {
    it('detecta Non-Repeatable Read en Read Committed', () => {
      db.setScenario('non_repeatable_read')
      db.setIsolationLevel('READ_COMMITTED')

      db.stepNext() // Step 1 (BEGIN)
      db.stepNext() // Step 2 (READ -> 1000)
      db.stepNext() // Step 3 (UPDATE & COMMIT -> 250)
      const res4 = db.stepNext() // Step 4 (READ_AGAIN -> 250)

      expect(res4.logEntry.observedValue).toBe(250)
      expect(res4.logEntry.anomaly).toBe('NON_REPEATABLE_READ_DETECTED')
    })

    it('previene Non-Repeatable Read en Repeatable Read', () => {
      db.setScenario('non_repeatable_read')
      db.setIsolationLevel('REPEATABLE_READ')

      db.stepNext()
      db.stepNext()
      db.stepNext()
      const res4 = db.stepNext()

      expect(res4.logEntry.observedValue).toBe(1000)
      expect(res4.logEntry.anomaly).toBe('NON_REPEATABLE_READ_PREVENTED')
    })
  })

  describe('Escenario: Atomic Transfer & Rollback', () => {
    it('garantiza Atomicidad revirtiendo el saldo en caso de fallo', () => {
      db.setScenario('atomic_transfer')

      db.stepNext() // Step 1 (BEGIN)
      db.stepNext() // Step 2 (DEBIT 400 -> 600)
      db.stepNext() // Step 3 (CRASH)
      const res4 = db.stepNext() // Step 4 (ROLLBACK)

      expect(res4.dataStore['acc:301'].balance).toBe(1000)
      expect(db.getState().isFinished).toBe(true)
    })
  })
})
