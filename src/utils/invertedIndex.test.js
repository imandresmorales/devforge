/**
 * @fileoverview Tests unitarios para el Motor de Búsqueda con Índice Invertido y BM25.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { InvertedIndexEngine, tokenize, DEFAULT_STOPWORDS } from './invertedIndex'

describe('Inverted Index & BM25 Scoring Engine', () => {
  let engine

  const SAMPLE_DOCS = [
    {
      id: 'doc1',
      title: 'Arquitectura de Microservicios y Circuit Breaker',
      category: 'Arquitectura',
      content: 'Los microservicios permiten desacoplar componentes y aislar fallos mediante el patron circuit breaker.',
    },
    {
      id: 'doc2',
      title: 'Seguridad Web y Sanitizacion Anti-XSS',
      category: 'Seguridad',
      content: 'La sanitizacion de entradas y la implementacion de Content Security Policy previenen ataques XSS y robo de tokens.',
    },
    {
      id: 'doc3',
      title: 'Criptografia Asimetrica y Arboles de Merkle',
      category: 'Criptografía',
      content: 'Los arboles de merkle garantizan la integridad de bloques de datos y permiten verificaciones criptograficas eficientes.',
    },
    {
      id: 'doc4',
      title: 'Despliegue Continuo con Feature Flags',
      category: 'DevOps',
      content: 'El despliegue con feature flags permite canary releases progresivos y desactivacion instantanea con kill switch.',
    },
  ]

  beforeEach(() => {
    engine = new InvertedIndexEngine({ k1: 1.2, b: 0.75 })
    engine.addDocuments(SAMPLE_DOCS)
  })

  it('debe tokenizar correctamente y filtrar stopwords', () => {
    const tokens = tokenize('El circuito y la seguridad en microservicios!', DEFAULT_STOPWORDS)
    const terms = tokens.map((t) => t.term)

    expect(terms).toContain('circuito')
    expect(terms).toContain('seguridad')
    expect(terms).toContain('microservicios')
    expect(terms).not.toContain('el')
    expect(terms).not.toContain('y')
    expect(terms).not.toContain('la')
    expect(terms).not.toContain('en')
  })

  it('debe indexar documentos y construir el vocabulario', () => {
    const stats = engine.getStats()
    expect(stats.totalDocuments).toBe(4)
    expect(stats.totalTerms).toBeGreaterThan(15)
    expect(stats.avgDocLength).toBeGreaterThan(0)
  })

  it('debe encontrar documentos relevantes y ordenarlos por BM25 score', () => {
    const results = engine.search('circuit breaker microservicios')

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].id).toBe('doc1')
    expect(results[0].score).toBeGreaterThan(0)
    expect(results[0].matchedTerms).toContain('microservicios')
    expect(results[0].matchedTerms).toContain('circuit')
    expect(results[0].matchedTerms).toContain('breaker')
  })

  it('debe filtrar resultados por categoria', () => {
    const resultsSec = engine.search('seguridad tokens', { category: 'Seguridad' })
    expect(resultsSec.length).toBe(1)
    expect(resultsSec[0].id).toBe('doc2')

    const resultsDevOps = engine.search('seguridad tokens', { category: 'DevOps' })
    expect(resultsDevOps.length).toBe(0)
  })

  it('debe soportar agregar y eliminar documentos dinamicamente', () => {
    const newDoc = {
      id: 'doc5',
      title: 'Bases de Datos Vectoriales k-NN',
      category: 'IA',
      content: 'Las bases vectoriales almacenan embeddings de alta dimensionalidad para busquedas semanticas.',
    }

    engine.addDocument(newDoc)
    expect(engine.documents.size).toBe(5)

    let results = engine.search('embeddings dimensionalidad')
    expect(results[0].id).toBe('doc5')

    const removed = engine.removeDocument('doc5')
    expect(removed).toBe(true)
    expect(engine.documents.size).toBe(4)

    results = engine.search('embeddings dimensionalidad')
    expect(results.length).toBe(0)
  })

  it('debe calcular IDF positivo para terminos presentes', () => {
    const idfMerkle = engine.calculateIDF('merkle')
    expect(idfMerkle).toBeGreaterThan(0)

    const idfNonExistent = engine.calculateIDF('palabra_inexistente')
    expect(idfNonExistent).toBe(0)
  })

  it('debe generar snippets contextuales con highlight', () => {
    const results = engine.search('merkle criptograficas')
    expect(results[0].snippet).toBeDefined()
    expect(results[0].snippet.toLowerCase()).toContain('merkle')
  })
})
