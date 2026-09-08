/**
 * @fileoverview Tests unitarios para el Motor de CRDTs (Mejora 70).
 * @module utils/crdtEngine.test
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  PNCounter,
  LWWElementSet,
  RGATextSequence,
} from './crdtEngine'

describe('Motor de Tipos de Datos Replicados Libres de Conflictos (crdtEngine.js)', () => {
  describe('1. PNCounter (Positive-Negative Counter)', () => {
    let counterA, counterB, counterC

    beforeEach(() => {
      counterA = new PNCounter('nodeA')
      counterB = new PNCounter('nodeB')
      counterC = new PNCounter('nodeC')
    })

    it('inicializa en 0 y permite incrementos/decrementos locales', () => {
      expect(counterA.value).toBe(0)
      counterA.increment(5)
      expect(counterA.value).toBe(5)
      counterA.decrement(2)
      expect(counterA.value).toBe(3)
    })

    it('sincroniza estados bidireccionalmente convergiendo al mismo valor (SEC)', () => {
      counterA.increment(10)
      counterA.decrement(3) // Net: 7

      counterB.increment(4)
      counterB.decrement(1) // Net: 3

      // Merge A -> B y B -> A
      counterB.merge(counterA.getState())
      counterA.merge(counterB.getState())

      expect(counterA.value).toBe(10)
      expect(counterB.value).toBe(10)
    })

    it('cumple con la propiedad de Idempotencia y Conmutatividad', () => {
      counterA.increment(8)
      counterB.decrement(3)

      const stateA = counterA.getState()
      const stateB = counterB.getState()

      // Idempotencia: merge repetido no altera el valor
      counterC.merge(stateA)
      counterC.merge(stateA)
      expect(counterC.value).toBe(8)

      // Conmutatividad: merge(A, B) === merge(B, A)
      const c1 = new PNCounter('c1')
      c1.merge(stateA)
      c1.merge(stateB)

      const c2 = new PNCounter('c2')
      c2.merge(stateB)
      c2.merge(stateA)

      expect(c1.value).toBe(c2.value)
      expect(c1.value).toBe(5)
    })
  })

  describe('2. LWWElementSet (Last-Write-Wins Element Set)', () => {
    let setA, setB

    beforeEach(() => {
      setA = new LWWElementSet('peer1')
      setB = new LWWElementSet('peer2')
    })

    it('permite añadir y consultar elementos', () => {
      setA.add('react', 100)
      setA.add('vite', 100)
      expect(setA.has('react')).toBe(true)
      expect(setA.has('vite')).toBe(true)
      expect(setA.has('angular')).toBe(false)
      expect(setA.elements).toEqual(['react', 'vite'])
    })

    it('resuelve eliminaciones con base en timestamps de Last-Write-Wins', () => {
      setA.add('item1', 100)
      setA.remove('item1', 150) // remove posterior gana
      expect(setA.has('item1')).toBe(false)

      setA.add('item1', 200) // add posterior gana
      expect(setA.has('item1')).toBe(true)
    })

    it('fusiona réplicas concurrentes resolviendo conflictos de adición/eliminación', () => {
      // Peer 1 añade 'devforge' en t=100
      setA.add('devforge', 100)

      // Peer 2 elimina 'devforge' en t=120
      setB.remove('devforge', 120)

      // Merge cruzado
      setA.merge(setB.getState())
      setB.merge(setA.getState())

      expect(setA.has('devforge')).toBe(false)
      expect(setB.has('devforge')).toBe(false)
      expect(setA.elements).toEqual(setB.elements)
    })
  })

  describe('3. RGATextSequence (Replicated Growable Array for Text)', () => {
    let docA, docB

    beforeEach(() => {
      docA = new RGATextSequence('userA')
      docB = new RGATextSequence('userB')
    })

    it('permite inserción y eliminación secuencial local', () => {
      docA.insert(0, 'H')
      docA.insert(1, 'o')
      docA.insert(2, 'l')
      docA.insert(3, 'a')
      expect(docA.text).toBe('Hola')

      docA.delete(3) // Elimina 'a'
      expect(docA.text).toBe('Hol')
    })

    it('resuelve ediciones concurrentes sin pérdida de caracteres ni colisiones', () => {
      // Ambos inician sincronizados con "AB"
      docA.insert(0, 'A')
      docA.insert(1, 'B')
      docB.merge(docA.getState())

      // Concurrente: userA inserta 'X' y userB inserta 'Y'
      docA.insert(2, 'X')
      docB.insert(2, 'Y')

      docA.merge(docB.getState())
      docB.merge(docA.getState())

      // Ambos convergen exactamente al mismo texto
      expect(docA.text).toBe(docB.text)
      expect(docA.text.includes('X')).toBe(true)
      expect(docA.text.includes('Y')).toBe(true)
    })

    it('preserva eliminaciones concurrentes (tombstones)', () => {
      docA.insert(0, 'A')
      docA.insert(1, 'B')
      docB.merge(docA.getState())

      // User A elimina 'B'
      docA.delete(1)

      // Sync
      docB.merge(docA.getState())
      expect(docB.text).toBe('A')
      expect(docA.text).toBe('A')
    })
  })
})
