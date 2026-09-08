/**
 * @fileoverview Motor de Profiling de Rendimiento de React y Detección de Fugas de Memoria (Mejora 73).
 *
 * CARACTERÍSTICAS:
 * - Análisis y telemetría de renderizado de componentes:
 *     1. Medición de tiempos de montaje (mount) y actualización (update).
 *     2. Detección de renders innecesarios / desperdiciados ("Wasted Renders") por inestabilidad de props (referencias mutadas, lambdas anónimas).
 *     3. Inspector de Fugas de Memoria (Memory Leaks Detector): Detección de temporizadores (setInterval) y listeners no liberados en componentWillUnmount / useEffect cleanup.
 *     4. Generador de recomendaciones de optimización (React.memo, useMemo, useCallback).
 *
 * @module utils/reactProfilerHelper
 */

/**
 * Compara dos objetos de props para determinar si los cambios son superficialmente iguales (Shallow Equal).
 * @param {Object} prevProps
 * @param {Object} nextProps
 * @returns {{ isShallowEqual: boolean, changedKeys: string[], unstableReferenceKeys: string[] }}
 */
export function shallowCompareProps(prevProps = {}, nextProps = {}) {
  const prevKeys = Object.keys(prevProps)
  const nextKeys = Object.keys(nextProps)

  const allKeys = Array.from(new Set([...prevKeys, ...nextKeys]))
  const changedKeys = []
  const unstableReferenceKeys = []

  allKeys.forEach((key) => {
    const valA = prevProps[key]
    const valB = nextProps[key]

    if (valA !== valB) {
      changedKeys.push(key)

      // Detectar si son objetos/arrays con el mismo contenido pero diferente referencia en memoria
      if (typeof valA === 'object' && typeof valB === 'object' && valA !== null && valB !== null) {
        if (JSON.stringify(valA) === JSON.stringify(valB)) {
          unstableReferenceKeys.push(key)
        }
      }
      // Detectar funciones anónimas recreadas en cada render
      if (typeof valA === 'function' && typeof valB === 'function') {
        if (valA.toString() === valB.toString()) {
          unstableReferenceKeys.push(key)
        }
      }
    }
  })

  return {
    isShallowEqual: changedKeys.length === 0,
    changedKeys,
    unstableReferenceKeys,
  }
}

/**
 * Inspector y Tracker de Fugas de Memoria en Hooks/Efectos.
 */
export class MemoryLeakTracker {
  constructor() {
    this.activeSubscriptions = new Map() // id -> { type: 'timer'|'listener'|'socket', componentName: string, createdAt: number }
  }

  registerResource(id, componentName, type = 'timer') {
    this.activeSubscriptions.set(id, {
      id,
      componentName,
      type,
      createdAt: Date.now(),
    })
  }

  releaseResource(id) {
    return this.activeSubscriptions.delete(id)
  }

  /**
   * Simula el desmontaje de un componente y verifica si dejó recursos huérfanos.
   * @param {string} componentName
   * @returns {Array<Object>} Fugas detectadas
   */
  inspectUnmountedComponent(componentName) {
    const leaks = []
    this.activeSubscriptions.forEach((sub) => {
      if (sub.componentName === componentName) {
        leaks.push({
          ...sub,
          severity: 'HIGH',
          message: `Recurso de tipo '${sub.type}' no fue liberado en la función de limpieza (cleanup) de useEffect.`,
        })
      }
    })
    return leaks
  }

  clearAll() {
    this.activeSubscriptions.clear()
  }
}

/**
 * Motor de Profiling de Renderizado React.
 */
export class ReactProfilerEngine {
  constructor() {
    this.renderLogs = []
    this.componentStats = new Map() // name -> { mountCount: number, updateCount: number, totalDuration: number, wastedRenders: number }
  }

  /**
   * Registra un ciclo de render de un componente (callback compatible con <React.Profiler onRender={...}>).
   */
  recordRender(id, phase, actualDuration, baseDuration, prevProps = null, nextProps = null) {
    const stats = this.componentStats.get(id) || {
      name: id,
      mountCount: 0,
      updateCount: 0,
      totalDuration: 0,
      wastedRenders: 0,
    }

    if (phase === 'mount') {
      stats.mountCount++
    } else {
      stats.updateCount++
    }
    stats.totalDuration += actualDuration

    let isWasted = false
    let unstableProps = []

    if (phase === 'update' && prevProps && nextProps) {
      const cmp = shallowCompareProps(prevProps, nextProps)
      if (cmp.unstableReferenceKeys.length > 0) {
        isWasted = true
        stats.wastedRenders++
        unstableProps = cmp.unstableReferenceKeys
      }
    }

    this.componentStats.set(id, stats)

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      componentName: id,
      phase,
      actualDuration: Number(actualDuration.toFixed(2)),
      baseDuration: Number(baseDuration.toFixed(2)),
      timestamp: Date.now(),
      isWasted,
      unstableProps,
    }

    this.renderLogs.unshift(entry)
    if (this.renderLogs.length > 50) this.renderLogs.pop()

    return entry
  }

  getSummary() {
    const components = Array.from(this.componentStats.values())
    const totalRenders = components.reduce((acc, c) => acc + c.mountCount + c.updateCount, 0)
    const totalWasted = components.reduce((acc, c) => acc + c.wastedRenders, 0)
    const efficiency = totalRenders > 0 ? Math.round(((totalRenders - totalWasted) / totalRenders) * 100) : 100

    return {
      components,
      totalRenders,
      totalWasted,
      efficiencyPercent: efficiency,
      score: efficiency >= 90 ? 'A+' : efficiency >= 75 ? 'B' : efficiency >= 60 ? 'C' : 'D',
    }
  }

  reset() {
    this.renderLogs = []
    this.componentStats.clear()
  }
}
