/**
 * @fileoverview Tests unitarios para el Motor de Base de Datos Vectorial k-NN (Mejora 67).
 * @module utils/vectorDbEngine.test
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  dotProduct,
  magnitude,
  normalizeVector,
  cosineSimilarity,
  euclideanDistance,
  generateTextEmbedding,
  InMemoryVectorDB,
} from './vectorDbEngine'

describe('Base de Datos Vectorial y Búsqueda Semántica (vectorDbEngine.js)', () => {
  it('calcula correctamente el producto punto y la magnitud', () => {
    const v1 = [1, 2, 3]
    const v2 = [4, 5, 6]
    // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    expect(dotProduct(v1, v2)).toBe(32)
    // sqrt(3^2 + 4^2) = 5
    expect(magnitude([3, 4])).toBe(5)
  })

  it('calcula la similitud coseno con precisión (1 para idénticos, 0 para ortogonales)', () => {
    const v1 = [1, 0, 0]
    const v2 = [1, 0, 0]
    const v3 = [0, 1, 0]

    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0, 4)
    expect(cosineSimilarity(v1, v3)).toBeCloseTo(0.0, 4)
  })

  it('calcula la distancia euclidiana correctamente', () => {
    const v1 = [0, 0]
    const v2 = [3, 4]
    expect(euclideanDistance(v1, v2)).toBe(5)
  })

  it('genera embeddings deterministas de texto', () => {
    const emb1 = generateTextEmbedding('cifrado rsa criptografia')
    const emb2 = generateTextEmbedding('cifrado rsa criptografia')
    const embDiff = generateTextEmbedding('base de datos postgres sql')

    expect(emb1).toEqual(emb2)
    const simHigh = cosineSimilarity(emb1, emb2)
    const simLow = cosineSimilarity(emb1, embDiff)
    expect(simHigh).toBeGreaterThan(simLow)
  })

  describe('Operaciones en InMemoryVectorDB', () => {
    let db

    beforeEach(() => {
      db = new InMemoryVectorDB()
    })

    it('permite insertar, buscar por similitud k-NN y eliminar vectores', () => {
      db.insert('custom-1', [1, 0, 0, 0], { title: 'Test Custom', category: 'Custom' })

      const results = db.query([1, 0, 0, 0], { topK: 1, metric: 'cosine' })
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('custom-1')
      expect(results[0].similarityPercent).toBe(100)

      db.delete('custom-1')
      const afterDelete = db.query([1, 0, 0, 0], { topK: 1 })
      expect(afterDelete.some((r) => r.id === 'custom-1')).toBe(false)
    })

    it('realiza búsquedas semánticas relevantes con texto en lenguaje natural', () => {
      const results = db.query('vulnerabilidades de seguridad web cors owasp', { topK: 3 })
      expect(results.length).toBeGreaterThan(0)
      // Debe rankear primero el documento de seguridad CORS
      expect(results[0].title).toContain('CORS')
    })

    it('aplica filtros de categoría estrictos en las consultas vectoriales', () => {
      const results = db.query('consenso y cluster', {
        topK: 5,
        categoryFilter: 'Criptografía',
      })
      results.forEach((r) => {
        expect(r.category).toBe('Criptografía')
      })
    })
  })
})
