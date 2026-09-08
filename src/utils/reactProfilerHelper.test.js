/**
 * @fileoverview Tests unitarios para el Monitor de Rendimiento React y Fugas de Memoria (Mejora 73).
 * @module utils/reactProfilerHelper.test
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  shallowCompareProps,
  MemoryLeakTracker,
  ReactProfilerEngine,
} from './reactProfilerHelper'

describe('Monitor y Profiler de Rendimiento React (reactProfilerHelper.js)', () => {
  describe('Comparador de Estabilidad de Props (shallowCompareProps)', () => {
    it('detecta igualdad superficial entre props idénticas', () => {
      const p1 = { title: 'Dashboard', count: 10 }
      const p2 = { title: 'Dashboard', count: 10 }
      const res = shallowCompareProps(p1, p2)
      expect(res.isShallowEqual).toBe(true)
      expect(res.changedKeys).toHaveLength(0)
    })

    it('identifica referencias de objetos y arrays inestables (recreados con mismo valor)', () => {
      const p1 = { user: { id: 1, name: 'Alex' }, tags: ['react', 'vite'] }
      const p2 = { user: { id: 1, name: 'Alex' }, tags: ['react', 'vite'] } // Nuevas referencias
      const res = shallowCompareProps(p1, p2)
      expect(res.isShallowEqual).toBe(false)
      expect(res.unstableReferenceKeys).toContain('user')
      expect(res.unstableReferenceKeys).toContain('tags')
    })
  })

  describe('Rastreador de Fugas de Memoria (MemoryLeakTracker)', () => {
    let tracker

    beforeEach(() => {
      tracker = new MemoryLeakTracker()
    })

    it('detecta recursos no liberados al desmontar un componente', () => {
      tracker.registerResource('timer_1', 'HeavyChartWidget', 'timer')
      tracker.registerResource('listener_1', 'HeavyChartWidget', 'listener')

      // Solo liberamos el timer
      tracker.releaseResource('timer_1')

      // Inspección al desmontar
      const leaks = tracker.inspectUnmountedComponent('HeavyChartWidget')
      expect(leaks).toHaveLength(1)
      expect(leaks[0].id).toBe('listener_1')
      expect(leaks[0].type).toBe('listener')
    })

    it('reporta 0 fugas si todos los recursos son liberados en el cleanup', () => {
      tracker.registerResource('ws_1', 'ChatWidget', 'socket')
      tracker.releaseResource('ws_1')

      const leaks = tracker.inspectUnmountedComponent('ChatWidget')
      expect(leaks).toHaveLength(0)
    })
  })

  describe('Motor de Profiling y Cálculo de Wasted Renders (ReactProfilerEngine)', () => {
    let engine

    beforeEach(() => {
      engine = new ReactProfilerEngine()
    })

    it('registra métricas de montaje y actualización', () => {
      engine.recordRender('DataTable', 'mount', 12.5, 15.0)
      engine.recordRender('DataTable', 'update', 4.2, 10.0)

      const summary = engine.getSummary()
      expect(summary.totalRenders).toBe(2)
      expect(summary.components[0].mountCount).toBe(1)
      expect(summary.components[0].updateCount).toBe(1)
    })

    it('calcula porcentaje de eficiencia y detecta renders desperdiciados', () => {
      const p1 = { filter: { status: 'active' } }
      const p2 = { filter: { status: 'active' } } // Inestable

      engine.recordRender('UserList', 'mount', 10, 10)
      engine.recordRender('UserList', 'update', 5, 5, p1, p2) // Wasted render

      const summary = engine.getSummary()
      expect(summary.totalWasted).toBe(1)
      expect(summary.efficiencyPercent).toBe(50)
      expect(summary.score).toBe('D')
    })
  })
})
