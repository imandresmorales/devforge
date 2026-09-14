/**
 * @fileoverview Tests unitarios para el Motor de Virtualización y Windowing (Mejora 88).
 */
import { describe, it, expect } from 'vitest'
import {
  calculateVirtualWindow,
  generateSyntheticDataset,
} from './virtualListEngine'

describe('Virtual List Engine & Windowing Optimization (virtualListEngine.js)', () => {
  describe('Cálculo de Índices y Desplazamiento de Viewport', () => {
    it('debe calcular los índices correctos en el inicio del scroll (scrollTop = 0)', () => {
      const res = calculateVirtualWindow({
        scrollTop: 0,
        viewportHeight: 400,
        itemHeight: 40,
        totalCount: 1000,
        overscan: 2,
      })

      expect(res.totalHeight).toBe(40000)
      expect(res.startIndex).toBe(0)
      // visibleCount = 400 / 40 = 10, endIndex = 0 + 10 + 2 = 12
      expect(res.endIndex).toBe(12)
      expect(res.offsetY).toBe(0)
      expect(res.domNodesCount).toBe(13)
      expect(res.memoryReductionPercent).toBeGreaterThan(98)
    })

    it('debe calcular desplazamientos y aplicar overscan hacia arriba y abajo en scroll medio', () => {
      const res = calculateVirtualWindow({
        scrollTop: 1000, // rawStartIndex = 1000 / 50 = 20
        viewportHeight: 500, // visibleCount = 10
        itemHeight: 50,
        totalCount: 50000,
        overscan: 3,
      })

      expect(res.startIndex).toBe(17) // 20 - 3
      expect(res.endIndex).toBe(33) // 20 + 10 + 3
      expect(res.offsetY).toBe(17 * 50)
      expect(res.domNodesCount).toBe(17)
      expect(res.memoryReductionPercent).toBeGreaterThan(99.9)
    })

    it('debe limitar el endIndex al totalCount - 1 cuando se llega al final del scroll', () => {
      const totalCount = 100
      const itemHeight = 40
      const totalHeight = totalCount * itemHeight // 4000
      const res = calculateVirtualWindow({
        scrollTop: 3800,
        viewportHeight: 400,
        itemHeight,
        totalCount,
        overscan: 5,
      })

      expect(res.endIndex).toBe(99)
      expect(res.startIndex).toBeLessThanOrEqual(res.endIndex)
      expect(res.totalHeight).toBe(4000)
    })

    it('debe manejar adecuadamente colecciones vacías (totalCount = 0)', () => {
      const res = calculateVirtualWindow({
        scrollTop: 0,
        viewportHeight: 400,
        itemHeight: 40,
        totalCount: 0,
      })

      expect(res.startIndex).toBe(0)
      expect(res.endIndex).toBe(0)
      expect(res.domNodesCount).toBe(0)
      expect(res.totalHeight).toBe(0)
      expect(res.offsetY).toBe(0)
    })
  })

  describe('Generador de Datasets Sintéticos Masivos', () => {
    it('debe generar eficientemente datasets de 10,000 registros con estructura completa', () => {
      const data = generateSyntheticDataset(10000)

      expect(data.length).toBe(10000)
      expect(data[0].id).toBe('EVT-0000001')
      expect(data[9999].id).toBe('EVT-0010000')
      expect(data[0]).toHaveProperty('traceId')
      expect(data[0]).toHaveProperty('severity')
      expect(data[0]).toHaveProperty('module')
      expect(data[0]).toHaveProperty('latencyMs')
    })
  })
})
