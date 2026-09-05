/**
 * @fileoverview Simulador de Transacciones ACID y Niveles de Aislamiento SQL (Mejora 60).
 *
 * CARACTERÍSTICAS:
 * - Demostración de las 4 propiedades fundamentales ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad).
 * - Simulación de los 4 niveles de aislamiento estándar ANSI SQL:
 *     1. Read Uncommitted: Permite lecturas de datos sucios no confirmados (Dirty Reads).
 *     2. Read Committed: Solo lee datos confirmados (mitiga Dirty Reads, vulnerable a Non-Repeatable Reads).
 *     3. Repeatable Read: Garantiza lecturas consistentes de filas durante la transacción (mitiga Non-Repeatable Reads).
 *     4. Serializable: Aislamiento total estricto (bloqueo por rangos / Serializable Snapshot Isolation).
 * - Detección y explicación pedagógica de anomalías de concurrencia:
 *     - Lectura Sucia (Dirty Read)
 *     - Lectura No Repetible (Non-Repeatable / Fuzzy Read)
 *     - Lectura Fantasma (Phantom Read)
 *     - Atomicidad & Rollback en Transferencia Bancaria
 *
 * @module utils/acidSimulator
 */

export const ISOLATION_LEVELS = {
  READ_UNCOMMITTED: {
    name: 'Read Uncommitted',
    dirtyRead: true,
    nonRepeatableRead: true,
    phantomRead: true,
    description: 'El nivel más bajo. Permite que una transacción lea datos modificados por otra transacción aún no confirmada.',
  },
  READ_COMMITTED: {
    name: 'Read Committed',
    dirtyRead: false,
    nonRepeatableRead: true,
    phantomRead: true,
    description: 'Nivel por defecto en PostgreSQL y SQL Server. Solo lee datos confirmados mediante COMMIT.',
  },
  REPEATABLE_READ: {
    name: 'Repeatable Read',
    dirtyRead: false,
    nonRepeatableRead: false,
    phantomRead: true,
    description: 'Nivel por defecto en MySQL InnoDB. Garantiza que re-leer la misma fila dentro de la transacción devuelva siempre el mismo valor.',
  },
  SERIALIZABLE: {
    name: 'Serializable',
    dirtyRead: false,
    nonRepeatableRead: false,
    phantomRead: false,
    description: 'El nivel más estricto. Emula la ejecución secuencial completa de las transacciones.',
  },
}

export const ACID_SCENARIOS = {
  dirty_read: {
    id: 'dirty_read',
    title: 'Lectura Sucia (Dirty Read)',
    description: 'La Transacción 2 lee datos modificados por la Transacción 1 antes de que ésta haga ROLLBACK.',
    initialData: { 'acc:101': { id: '101', name: 'Cuenta A', balance: 500 } },
    steps: [
      { step: 1, tx: 'Tx 1', action: 'BEGIN', desc: 'Inicia Transacción 1 (Transferencia en proceso)' },
      { step: 2, tx: 'Tx 1', action: 'UPDATE', target: 'acc:101', newBalance: 100, desc: 'Tx 1 modifica saldo temporal a $100 (sin hacer COMMIT aún)' },
      { step: 3, tx: 'Tx 2', action: 'READ', target: 'acc:101', desc: 'Tx 2 consulta saldo de Cuenta A' },
      { step: 4, tx: 'Tx 1', action: 'ROLLBACK', target: 'acc:101', desc: 'Tx 1 falla y ejecuta ROLLBACK (saldo restaurado a $500)' },
      { step: 5, tx: 'Tx 2', action: 'COMMIT', desc: 'Tx 2 finaliza' },
    ],
  },
  non_repeatable_read: {
    id: 'non_repeatable_read',
    title: 'Lectura No Repetible (Non-Repeatable Read)',
    description: 'La Transacción 1 lee una fila, la Transacción 2 la modifica y confirma, y al volver a leer, Tx 1 ve un valor diferente.',
    initialData: { 'acc:102': { id: '102', name: 'Cuenta B', balance: 1000 } },
    steps: [
      { step: 1, tx: 'Tx 1', action: 'BEGIN', desc: 'Inicia Transacción 1 (Generación de Reporte Fiscal)' },
      { step: 2, tx: 'Tx 1', action: 'READ', target: 'acc:102', desc: 'Tx 1 lee saldo de Cuenta B: $1000' },
      { step: 3, tx: 'Tx 2', action: 'BEGIN_AND_UPDATE', target: 'acc:102', newBalance: 250, desc: 'Tx 2 debita $750 y hace COMMIT inmediatamente' },
      { step: 4, tx: 'Tx 1', action: 'READ_AGAIN', target: 'acc:102', desc: 'Tx 1 vuelve a leer la Cuenta B en el mismo reporte' },
      { step: 5, tx: 'Tx 1', action: 'COMMIT', desc: 'Tx 1 finaliza' },
    ],
  },
  phantom_read: {
    id: 'phantom_read',
    title: 'Lectura Fantasma (Phantom Read)',
    description: 'La Transacción 1 consulta un rango de filas, la Transacción 2 inserta una nueva fila en ese rango, y la segunda consulta de Tx 1 encuentra la nueva fila "fantasma".',
    initialData: {
      'acc:201': { id: '201', name: 'Usuario VIP 1', balance: 1500 },
      'acc:202': { id: '202', name: 'Usuario VIP 2', balance: 2200 },
    },
    steps: [
      { step: 1, tx: 'Tx 1', action: 'BEGIN', desc: 'Inicia Tx 1: Auditoría de cuentas con saldo > $1000' },
      { step: 2, tx: 'Tx 1', action: 'COUNT_RANGE', minBalance: 1000, desc: 'Tx 1 ejecuta SELECT COUNT(*) WHERE balance > 1000' },
      { step: 3, tx: 'Tx 2', action: 'INSERT_AND_COMMIT', newAcc: { id: '203', name: 'Usuario VIP 3', balance: 3000 }, desc: 'Tx 2 inserta nuevo cliente con $3000 y hace COMMIT' },
      { step: 4, tx: 'Tx 1', action: 'COUNT_RANGE_AGAIN', minBalance: 1000, desc: 'Tx 1 re-ejecuta SELECT COUNT(*) en la misma transacción' },
      { step: 5, tx: 'Tx 1', action: 'COMMIT', desc: 'Tx 1 finaliza' },
    ],
  },
  atomic_transfer: {
    id: 'atomic_transfer',
    title: 'Atomicidad & Rollback (Transferencia Bancaria)',
    description: 'Garantiza que una transferencia de fondos entre dos cuentas sea todo o nada (All-or-Nothing).',
    initialData: {
      'acc:301': { id: '301', name: 'Origen (Alex)', balance: 1000 },
      'acc:302': { id: '302', name: 'Destino (Servidor)', balance: 200 },
    },
    steps: [
      { step: 1, tx: 'Tx 1', action: 'BEGIN', desc: 'Inicia transacción bancaria de $400' },
      { step: 2, tx: 'Tx 1', action: 'DEBIT', target: 'acc:301', amount: 400, desc: 'Debita $400 de cuenta origen ($1000 -> $600)' },
      { step: 3, tx: 'Tx 1', action: 'SIMULATE_CRASH', desc: 'Fallo de red o corte de energía al acreditar destino' },
      { step: 4, tx: 'Tx 1', action: 'ROLLBACK', target: 'acc:301', desc: 'Atomicidad garantizada: El motor revierte el débito ($600 -> $1000)' },
    ],
  },
}

/**
 * Clase que simula el motor de base de datos con control de transacciones y aislamiento.
 */
export class DatabaseEngineSimulator {
  constructor(options = {}) {
    this.isolationLevel = options.isolationLevel || 'READ_COMMITTED'
    this.scenarioId = options.scenarioId || 'dirty_read'
    this.currentStep = 0
    this.dataStore = {}
    this.uncommittedWrites = {}
    this.executionLog = []
    this.detectedAnomaly = null
    this.reset()
  }

  reset() {
    const scenario = ACID_SCENARIOS[this.scenarioId] || ACID_SCENARIOS.dirty_read
    this.dataStore = JSON.parse(JSON.stringify(scenario.initialData))
    this.uncommittedWrites = {}
    this.currentStep = 0
    this.executionLog = []
    this.detectedAnomaly = null
  }

  setScenario(scenarioId) {
    if (ACID_SCENARIOS[scenarioId]) {
      this.scenarioId = scenarioId
      this.reset()
    }
  }

  setIsolationLevel(level) {
    if (ISOLATION_LEVELS[level]) {
      this.isolationLevel = level
      this.reset()
    }
  }

  /**
   * Ejecuta el siguiente paso del escenario activo.
   * @returns {Object} Resultado del paso y estado del motor.
   */
  stepNext() {
    const scenario = ACID_SCENARIOS[this.scenarioId]
    if (this.currentStep >= scenario.steps.length) {
      return { done: true, log: this.executionLog }
    }

    const stepInfo = scenario.steps[this.currentStep]
    this.currentStep++

    let logResult = {
      step: stepInfo.step,
      tx: stepInfo.tx,
      action: stepInfo.action,
      desc: stepInfo.desc,
      timestamp: Date.now(),
      anomaly: null,
    }

    // ── Lógica de Simulación según Aislamiento y Escenario ──
    if (this.scenarioId === 'dirty_read') {
      if (stepInfo.action === 'UPDATE') {
        this.uncommittedWrites[stepInfo.target] = stepInfo.newBalance
      } else if (stepInfo.action === 'READ') {
        if (this.isolationLevel === 'READ_UNCOMMITTED') {
          // Lee el dato no confirmado (Dirty Read)
          const dirtyVal = this.uncommittedWrites[stepInfo.target]
          logResult.observedValue = dirtyVal
          logResult.anomaly = 'DIRTY_READ_DETECTED'
          this.detectedAnomaly = 'Lectura Sucia Detectada: Tx 2 observó el saldo temporal no confirmado de $' + dirtyVal
        } else {
          // Bloquea o lee el snapshot confirmado ($500)
          const cleanVal = this.dataStore[stepInfo.target].balance
          logResult.observedValue = cleanVal
          logResult.anomaly = 'DIRTY_READ_PREVENTED'
          this.detectedAnomaly = 'Lectura Sucia Prevenida: Tx 2 leyó el saldo confirmado de $' + cleanVal
        }
      } else if (stepInfo.action === 'ROLLBACK') {
        delete this.uncommittedWrites[stepInfo.target]
      }
    } else if (this.scenarioId === 'non_repeatable_read') {
      if (stepInfo.action === 'BEGIN_AND_UPDATE') {
        this.dataStore[stepInfo.target].balance = stepInfo.newBalance
      } else if (stepInfo.action === 'READ') {
        logResult.observedValue = this.dataStore[stepInfo.target].balance
      } else if (stepInfo.action === 'READ_AGAIN') {
        if (this.isolationLevel === 'READ_COMMITTED' || this.isolationLevel === 'READ_UNCOMMITTED') {
          const newVal = this.dataStore[stepInfo.target].balance
          logResult.observedValue = newVal
          logResult.anomaly = 'NON_REPEATABLE_READ_DETECTED'
          this.detectedAnomaly = 'Lectura No Repetible Detectada: Tx 1 vio $1000 al inicio y ahora ve $' + newVal
        } else {
          // Repeatable Read o Serializable: Retiene el snapshot inicial ($1000)
          logResult.observedValue = 1000
          logResult.anomaly = 'NON_REPEATABLE_READ_PREVENTED'
          this.detectedAnomaly = 'Lectura No Repetible Prevenida: Tx 1 mantiene vista consistente de $1000 mediante snapshot MVCC.'
        }
      }
    } else if (this.scenarioId === 'phantom_read') {
      if (stepInfo.action === 'INSERT_AND_COMMIT') {
        this.dataStore[stepInfo.newAcc.id] = stepInfo.newAcc
      } else if (stepInfo.action === 'COUNT_RANGE') {
        const count = Object.values(this.dataStore).filter((a) => a.balance > stepInfo.minBalance).length
        logResult.observedCount = count
      } else if (stepInfo.action === 'COUNT_RANGE_AGAIN') {
        if (this.isolationLevel === 'SERIALIZABLE') {
          logResult.observedCount = 2 // Bloqueo de rangos
          logResult.anomaly = 'PHANTOM_READ_PREVENTED'
          this.detectedAnomaly = 'Lectura Fantasma Prevenida: El aislamiento Serializable bloqueó la alteración del rango de consulta.'
        } else {
          const count = Object.values(this.dataStore).filter((a) => a.balance > stepInfo.minBalance).length
          logResult.observedCount = count
          logResult.anomaly = 'PHANTOM_READ_DETECTED'
          this.detectedAnomaly = 'Lectura Fantasma Detectada: Apareció 1 registro nuevo en el rango consultado (Total: ' + count + ').'
        }
      }
    } else if (this.scenarioId === 'atomic_transfer') {
      if (stepInfo.action === 'DEBIT') {
        this.dataStore[stepInfo.target].balance -= stepInfo.amount
      } else if (stepInfo.action === 'ROLLBACK') {
        this.dataStore[stepInfo.target].balance += 400
        this.detectedAnomaly = 'Atomicidad Garantizada: Saldo restaurado íntegramente a $1000 tras fallo en la transacción.'
      }
    }

    this.executionLog.push(logResult)
    return {
      done: this.currentStep >= scenario.steps.length,
      currentStep: this.currentStep,
      totalSteps: scenario.steps.length,
      logEntry: logResult,
      dataStore: this.dataStore,
      detectedAnomaly: this.detectedAnomaly,
    }
  }

  getState() {
    return {
      scenario: ACID_SCENARIOS[this.scenarioId],
      isolationLevel: this.isolationLevel,
      currentStep: this.currentStep,
      totalSteps: ACID_SCENARIOS[this.scenarioId].steps.length,
      dataStore: this.dataStore,
      executionLog: this.executionLog,
      detectedAnomaly: this.detectedAnomaly,
      isFinished: this.currentStep >= ACID_SCENARIOS[this.scenarioId].steps.length,
    }
  }
}
