/**
 * @fileoverview Tests unitarios para el Motor de Consistent Hashing Ring (Mejora 74).
 * @module utils/consistentHashing.test
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  hash32,
  hashToDegrees,
  ConsistentHashRing,
} from './consistentHashing'

describe('Motor de Consistent Hashing y Particionamiento Horizontal (consistentHashing.js)', () => {
  describe('Funciones Hash FNV-1a y Proyección Angular', () => {
    it('genera hashes de 32 bits deterministas y no negativos', () => {
      const h1 = hash32('user:100')
      const h2 = hash32('user:100')
      const h3 = hash32('user:101')

      expect(h1).toBe(h2)
      expect(h1).toBeGreaterThanOrEqual(0)
      expect(h1).toBeLessThanOrEqual(4294967295)
      expect(h1).not.toBe(h3)
    })

    it('proyecta valores hash en el rango angular de 0° a 360°', () => {
      const deg0 = hashToDegrees(0)
      const degMax = hashToDegrees(4294967295)
      const degMid = hashToDegrees(2147483648)

      expect(deg0).toBe(0)
      expect(degMax).toBe(360)
      expect(degMid).toBeCloseTo(180, 0)
    })
  })

  describe('ConsistentHashRing y Gestión de Nodos Virtuales', () => {
    let ring

    beforeEach(() => {
      ring = new ConsistentHashRing({ vnodes: 3, nodes: ['Node-A', 'Node-B', 'Node-C'] })
    })

    it('inicializa nodos físicos con el número configurado de réplicas virtuales (vnodes)', () => {
      const snapshot = ring.getSnapshot()
      expect(snapshot.physicalNodes).toEqual(['Node-A', 'Node-B', 'Node-C'])
      expect(snapshot.ringTokens.length).toBe(9) // 3 nodos * 3 vnodes
    })

    it('asigna claves de manera determinista en sentido horario', () => {
      const node1 = ring.getNode('order:4482')
      const node2 = ring.getNode('order:4482')
      expect(node1).toBe(node2)
      expect(['Node-A', 'Node-B', 'Node-C']).toContain(node1)
    })

    it('distribuye claves y calcula factor de replicación de múltiples nodos físicos distintos', () => {
      ring.put('session:abc', { userId: 42 })
      ring.put('session:xyz', { userId: 99 })

      const replicas = ring.getReplicationNodes('session:abc', 2)
      expect(replicas.length).toBe(2)
      expect(new Set(replicas).size).toBe(2) // Deben ser distintos
    })

    it('minimiza la migración de claves ante la adición de un nuevo nodo (Propiedad K/N)', () => {
      // Insertar 20 claves
      for (let i = 0; i < 20; i++) {
        ring.put(`user_key_${i}`, { index: i })
      }

      // Simular impacto de añadir Node-D (en un hash tradicional K mod N se movería casi el 75-80% de claves)
      // En Consistent Hashing solo debe migrarse aproximadamente 1/(N+1) = ~25%
      const impact = ring.simulateMigrationImpact('Node-D', 'add')
      expect(impact.migrationPercent).toBeLessThanOrEqual(50)
    })

    it('elimina un nodo y redistribuye solo sus claves asignadas', () => {
      ring.put('key1', 'v1')
      ring.put('key2', 'v2')

      const success = ring.removeNode('Node-C')
      expect(success).toBe(true)
      expect(ring.nodes.has('Node-C')).toBe(false)
      expect(ring.ring.every((v) => v.physicalNode !== 'Node-C')).toBe(true)
    })
  })
})
