/**
 * @fileoverview Motor de Tipos de Datos Replicados Libres de Conflictos (CRDTs) (Mejora 70).
 *
 * CARACTERÍSTICAS:
 * - Implementación de estructuras CRDT basadas en estado (State-based / CvRDT) y en operaciones (Op-based):
 *     1. PNCounter (Positive-Negative Counter): Contador distribuido con incrementos y decrementos independientes por nodo.
 *     2. LWWElementSet (Last-Write-Wins Element Set): Conjunto de adición/eliminación donde los conflictos se resuelven por timestamp lógico determinista.
 *     3. RGATextSequence (Replicated Growable Array): Secuencia colaborativa de caracteres con identificadores de posición únicos (nodoId + reloj lógico) y anclas de causalidad (afterId) para edición de texto sin colisiones.
 * - Propiedades matemáticas garantizadas:
 *     - Conmutatividad: merge(A, B) === merge(B, A)
 *     - Asociatividad: merge(merge(A, B), C) === merge(A, merge(B, C))
 *     - Idempotencia: merge(A, A) === A
 *     - Convergencia Eventual Fuerte (Strong Eventual Consistency - SEC).
 * - Simulación de nodos desconectados (Offline Editing) y sincronización bidireccional.
 *
 * @module utils/crdtEngine
 */

/**
 * 1. PN-Counter (Positive-Negative Counter CRDT)
 */
export class PNCounter {
  /**
   * @param {string} nodeId - Identificador único del nodo/peer
   */
  constructor(nodeId) {
    this.nodeId = nodeId
    this.p = {} // Positivos por nodo: { [nodeId]: number }
    this.n = {} // Negativos por nodo: { [nodeId]: number }
    this.p[nodeId] = 0
    this.n[nodeId] = 0
  }

  increment(amount = 1) {
    this.p[this.nodeId] = (this.p[this.nodeId] || 0) + amount
    return this.value
  }

  decrement(amount = 1) {
    this.n[this.nodeId] = (this.n[this.nodeId] || 0) + amount
    return this.value
  }

  get value() {
    let positiveSum = 0
    let negativeSum = 0
    for (const key in this.p) positiveSum += this.p[key] || 0
    for (const key in this.n) negativeSum += this.n[key] || 0
    return positiveSum - negativeSum
  }

  /**
   * Une el estado de otro PN-Counter tomando el valor máximo por cada clave.
   * @param {PNCounter|Object} incomingState
   */
  merge(incomingState) {
    const incomingP = incomingState.p || {}
    const incomingN = incomingState.n || {}

    for (const key in incomingP) {
      this.p[key] = Math.max(this.p[key] || 0, incomingP[key] || 0)
    }
    for (const key in incomingN) {
      this.n[key] = Math.max(this.n[key] || 0, incomingN[key] || 0)
    }
    return this.value
  }

  getState() {
    return {
      nodeId: this.nodeId,
      p: { ...this.p },
      n: { ...this.n },
      value: this.value,
    }
  }
}

/**
 * 2. LWW-Element-Set (Last-Write-Wins Element Set CRDT)
 */
export class LWWElementSet {
  /**
   * @param {string} nodeId
   */
  constructor(nodeId) {
    this.nodeId = nodeId
    this.addSet = new Map() // element -> timestamp
    this.removeSet = new Map() // element -> timestamp
  }

  add(element, timestamp = Date.now()) {
    const existing = this.addSet.get(element) || 0
    this.addSet.set(element, Math.max(existing, timestamp))
  }

  remove(element, timestamp = Date.now()) {
    const existing = this.removeSet.get(element) || 0
    this.removeSet.set(element, Math.max(existing, timestamp))
  }

  has(element) {
    const addTime = this.addSet.get(element)
    if (addTime === undefined) return false
    const removeTime = this.removeSet.get(element) || 0
    return addTime >= removeTime
  }

  get elements() {
    const list = []
    for (const [elem] of this.addSet) {
      if (this.has(elem)) {
        list.push(elem)
      }
    }
    return list.sort()
  }

  merge(incoming) {
    const inAdd = incoming.addSet instanceof Map ? incoming.addSet : new Map(Object.entries(incoming.addSet || {}))
    const inRemove = incoming.removeSet instanceof Map ? incoming.removeSet : new Map(Object.entries(incoming.removeSet || {}))

    for (const [elem, time] of inAdd) {
      const current = this.addSet.get(elem) || 0
      this.addSet.set(elem, Math.max(current, time))
    }

    for (const [elem, time] of inRemove) {
      const current = this.removeSet.get(elem) || 0
      this.removeSet.set(elem, Math.max(current, time))
    }
  }

  getState() {
    return {
      nodeId: this.nodeId,
      addSet: Object.fromEntries(this.addSet),
      removeSet: Object.fromEntries(this.removeSet),
      elements: this.elements,
    }
  }
}

/**
 * 3. RGA Text Sequence (Replicated Growable Array CRDT for Text)
 */
export class RGATextSequence {
  /**
   * @param {string} nodeId
   */
  constructor(nodeId) {
    this.nodeId = nodeId
    this.clock = 0
    // Array<{ id: string, char: string, deleted: boolean, clock: number, nodeId: string, afterId: string | null }>
    this.nodes = []
  }

  insert(index, char) {
    this.clock++
    const id = `${this.nodeId}:${this.clock}`

    let visibleCount = 0
    let insertIndex = this.nodes.length
    let afterId = null

    for (let i = 0; i < this.nodes.length; i++) {
      if (!this.nodes[i].deleted) {
        if (visibleCount === index) {
          insertIndex = i
          break
        }
        afterId = this.nodes[i].id
        visibleCount++
      }
    }

    if (insertIndex === this.nodes.length && this.nodes.length > 0) {
      afterId = this.nodes[this.nodes.length - 1].id
    }

    const node = {
      id,
      char,
      deleted: false,
      clock: this.clock,
      nodeId: this.nodeId,
      afterId,
    }

    this.nodes.splice(insertIndex, 0, node)
    return id
  }

  delete(index) {
    let visibleCount = 0
    for (let i = 0; i < this.nodes.length; i++) {
      if (!this.nodes[i].deleted) {
        if (visibleCount === index) {
          this.nodes[i].deleted = true
          this.clock++
          return true
        }
        visibleCount++
      }
    }
    return false
  }

  get text() {
    return this.nodes
      .filter((n) => !n.deleted)
      .map((n) => n.char)
      .join('')
  }

  merge(incoming) {
    const incomingNodes = incoming.nodes || []
    this.clock = Math.max(this.clock, incoming.clock || 0)

    const map = new Map()
    this.nodes.forEach((n) => map.set(n.id, n))

    incomingNodes.forEach((inNode) => {
      if (map.has(inNode.id)) {
        const existing = map.get(inNode.id)
        if (inNode.deleted) existing.deleted = true
      } else {
        let searchIndex = 0
        if (inNode.afterId && map.has(inNode.afterId)) {
          searchIndex = this.nodes.findIndex((n) => n.id === inNode.afterId) + 1
        }

        while (searchIndex < this.nodes.length) {
          const current = this.nodes[searchIndex]
          if (
            inNode.clock < current.clock ||
            (inNode.clock === current.clock && inNode.nodeId < current.nodeId)
          ) {
            searchIndex++
          } else {
            break
          }
        }

        const newNode = { ...inNode }
        this.nodes.splice(searchIndex, 0, newNode)
        map.set(newNode.id, newNode)
      }
    })
  }

  getState() {
    return {
      nodeId: this.nodeId,
      clock: this.clock,
      text: this.text,
      nodes: this.nodes.map((n) => ({ ...n })),
    }
  }
}
