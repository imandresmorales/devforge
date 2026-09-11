/**
 * @fileoverview Tests unitarios para el Motor de Árboles de Merkle (Mejora 78).
 * @module utils/merkleTree.test
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  sha256Hash,
  hashLeaf,
  hashInternalNodes,
  MerkleTree,
} from './merkleTree'

describe('Árboles de Merkle y Pruebas Criptográficas (merkleTree.js)', () => {
  describe('Hashing y Funciones de Nodos', () => {
    it('genera hashes SHA-256 deterministas de 64 caracteres hexadecimales', () => {
      const h1 = sha256Hash('tx_100')
      const h2 = sha256Hash('tx_100')
      expect(h1).toHaveLength(64)
      expect(h1).toBe(h2)
      expect(sha256Hash('tx_100')).not.toBe(sha256Hash('tx_101'))
    })

    it('aplica separación de dominio entre hojas y nodos internos', () => {
      const leafH = hashLeaf('data')
      const internalH = hashInternalNodes('data', 'data')
      expect(leafH).not.toBe(internalH)
    })
  })

  describe('Construcción y Verificación de Merkle Proofs', () => {
    let leaves
    let tree

    beforeEach(() => {
      leaves = ['Tx0: Alice -> Bob $50', 'Tx1: Bob -> Charlie $20', 'Tx2: Charlie -> Dave $10', 'Tx3: Dave -> Eve $5']
      tree = new MerkleTree(leaves)
    })

    it('calcula la Merkle Root correctamente para un conjunto de 4 hojas', () => {
      const root = tree.root
      expect(root).toBeDefined()
      expect(root).toHaveLength(64)
      expect(tree.layers.length).toBe(3) // Capa 0: 4 hojas, Capa 1: 2 nodos, Capa 2: 1 raíz
    })

    it('genera y valida con éxito una prueba de inclusión O(log N) para una transacción legítima', () => {
      const leafIndex = 1 // Tx1: Bob -> Charlie $20
      const targetLeaf = leaves[leafIndex]
      const proof = tree.getProof(leafIndex)

      expect(proof).toHaveLength(2) // log2(4) = 2 pasos

      const isValid = MerkleTree.verifyProof(targetLeaf, proof, tree.root)
      expect(isValid).toBe(true)
    })

    it('rechaza pruebas de inclusión si la transacción fue alterada o falsificada', () => {
      const leafIndex = 0
      const proof = tree.getProof(leafIndex)
      const fakeTx = 'Tx0: Alice -> Hacker $9999'

      const isValid = MerkleTree.verifyProof(fakeTx, proof, tree.root)
      expect(isValid).toBe(false)
    })

    it('invalida la Merkle Root si se manipula una hoja en el árbol (Tampering Detection)', () => {
      const originalRoot = tree.root

      // Manipular Tx2
      tree.tamperLeaf(2, 'Tx2: Charlie -> Dave $1000000 (TAMPERED)')
      const tamperedRoot = tree.root

      expect(tamperedRoot).not.toBe(originalRoot)
    })

    it('maneja árboles con número impar de hojas duplicando el último nodo', () => {
      const oddTree = new MerkleTree(['TxA', 'TxB', 'TxC'])
      expect(oddTree.root).toBeDefined()
      expect(oddTree.layers[0].length).toBe(3)
      expect(oddTree.layers[1].length).toBe(2)
      expect(oddTree.layers[2].length).toBe(1)
    })
  })
})
