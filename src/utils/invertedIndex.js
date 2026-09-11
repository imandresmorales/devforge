/**
 * @fileoverview Motor de Búsqueda de Texto Completo con Índice Invertido y Algoritmo BM25.
 *
 * Implementa los fundamentos de recuperación de información (Information Retrieval)
 * utilizados por motores como Elasticsearch y Apache Lucene:
 * - Tokenización, normalización y filtrado de Stopwords (Español e Inglés).
 * - Estructura de Índice Invertido: Término -> Posting List (docId, TF, posiciones).
 * - Función de Ranking Probabilístico Okapi BM25 con parámetros k1 y b.
 * - Generador de fragmentos destacados (snippets con highlight) y desglose de score.
 *
 * @module utils/invertedIndex
 */

export const DEFAULT_STOPWORDS = new Set([
  // Español
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para',
  'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'pero', 'sus', 'le', 'ya', 'o',
  'este', 'si', 'porque', 'esta', 'son', 'entre', 'esta', 'cuando', 'muy', 'sin', 'sobre',
  'tambien', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante',
  'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e',
  // Inglés
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'with',
  'by', 'from', 'or', 'as', 'that', 'this', 'it', 'are', 'be', 'was', 'were', 'not'
])

/**
 * Normaliza y tokeniza un texto eliminando tildes, signos de puntuación y stopwords.
 * @param {string} text - Texto a procesar.
 * @param {Set<string>} [stopwords=DEFAULT_STOPWORDS] - Conjunto de stopwords.
 * @returns {Array<{ term: string, position: number, raw: string }>} Lista de tokens.
 */
export function tokenize(text, stopwords = DEFAULT_STOPWORDS) {
  if (!text || typeof text !== 'string') return []

  const clean = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita diacríticos/tildes
    .toLowerCase()

  const regex = /[\p{L}\p{N}_]+/gu
  const tokens = []
  let match

  while ((match = regex.exec(clean)) !== null) {
    const term = match[0]
    if (term.length > 1 && !stopwords.has(term)) {
      tokens.push({
        term,
        position: match.index,
        raw: match[0],
      })
    }
  }

  return tokens
}

/**
 * Clase para gestionar el Índice Invertido y las búsquedas con Okapi BM25.
 */
export class InvertedIndexEngine {
  /**
   * @param {Object} [options]
   * @param {number} [options.k1=1.2] - Parámetro de saturación de frecuencia de término.
   * @param {number} [options.b=0.75] - Parámetro de normalización por longitud de documento.
   */
  constructor(options = {}) {
    this.k1 = options.k1 ?? 1.2
    this.b = options.b ?? 0.75

    /** @type {Map<string, Object>} docId -> Document */
    this.documents = new Map()

    /** @type {Map<string, Array<{ docId: string, tf: number, positions: number[] }>>} term -> Postings */
    this.index = new Map()

    /** Longitud total de todos los documentos para calcular avgDocLength */
    this.totalLength = 0
  }

  /**
   * Agrega o actualiza un documento en el índice invertido.
   * @param {Object} doc - Documento con { id, title, category, content }
   */
  addDocument(doc) {
    if (!doc || !doc.id) {
      throw new Error('El documento debe tener un id único.')
    }

    // Si ya existía, removerlo primero
    if (this.documents.has(doc.id)) {
      this.removeDocument(doc.id)
    }

    const fullText = `${doc.title || ''} ${doc.content || ''}`
    const tokens = tokenize(fullText)
    const docLength = tokens.length

    // Mapear frecuencia de términos para este documento
    const termStats = new Map()
    tokens.forEach((t) => {
      if (!termStats.has(t.term)) {
        termStats.set(t.term, { count: 0, positions: [] })
      }
      const stat = termStats.get(t.term)
      stat.count++
      stat.positions.push(t.position)
    })

    // Actualizar índice invertido
    termStats.forEach((stat, term) => {
      if (!this.index.has(term)) {
        this.index.set(term, [])
      }
      this.index.get(term).push({
        docId: doc.id,
        tf: stat.count,
        positions: stat.positions,
      })
    })

    this.documents.set(doc.id, {
      ...doc,
      docLength,
      tokenCount: tokens.length,
      indexedAt: new Date().toISOString(),
    })

    this.totalLength += docLength
  }

  /**
   * Agrega múltiples documentos en lote.
   * @param {Array<Object>} docs - Lista de documentos.
   */
  addDocuments(docs) {
    docs.forEach((doc) => this.addDocument(doc))
  }

  /**
   * Elimina un documento del índice invertido.
   * @param {string} docId - ID del documento a eliminar.
   * @returns {boolean} True si se eliminó con éxito.
   */
  removeDocument(docId) {
    const doc = this.documents.get(docId)
    if (!doc) return false

    this.totalLength -= doc.docLength
    this.documents.delete(docId)

    // Limpiar postings
    this.index.forEach((postings, term) => {
      const filtered = postings.filter((p) => p.docId !== docId)
      if (filtered.length === 0) {
        this.index.delete(term)
      } else {
        this.index.set(term, filtered)
      }
    })

    return true
  }

  /**
   * Retorna la longitud promedio de los documentos indexados (avgdl).
   * @returns {number}
   */
  getAvgDocLength() {
    const totalDocs = this.documents.size
    return totalDocs === 0 ? 0 : this.totalLength / totalDocs
  }

  /**
   * Calcula el Inverse Document Frequency (IDF) de Okapi BM25 para un término.
   * IDF = ln( (N - n + 0.5) / (n + 0.5) + 1 )
   * @param {string} term - Término buscado.
   * @returns {number} Valor IDF.
   */
  calculateIDF(term) {
    const N = this.documents.size
    const postings = this.index.get(term) || []
    const n = postings.length

    if (N === 0 || n === 0) return 0
    return Math.log(((N - n + 0.5) / (n + 0.5)) + 1)
  }

  /**
   * Realiza una búsqueda de texto completo clasificada por score BM25.
   * @param {string} queryString - Consulta ingresada por el usuario.
   * @param {Object} [options]
   * @param {number} [options.limit=10] - Cantidad máxima de resultados.
   * @param {string} [options.category] - Filtrado opcional por categoría.
   * @returns {Array<Object>} Resultados ordenados por score descendente con desglose.
   */
  search(queryString, options = {}) {
    const { limit = 10, category } = options
    const queryTokens = tokenize(queryString)

    if (queryTokens.length === 0 || this.documents.size === 0) {
      return []
    }

    const avgdl = this.getAvgDocLength()
    const docScores = new Map()

    // Extraer términos únicos de la consulta
    const uniqueQueryTerms = Array.from(new Set(queryTokens.map((t) => t.term)))

    uniqueQueryTerms.forEach((term) => {
      const postings = this.index.get(term)
      if (!postings) return

      const idf = this.calculateIDF(term)

      postings.forEach((posting) => {
        const doc = this.documents.get(posting.docId)
        if (!doc) return
        if (category && doc.category !== category) return

        const tf = posting.tf
        const docLen = doc.docLength

        // Fórmula BM25 para el término en este doc
        // numerator = tf * (k1 + 1)
        // denominator = tf + k1 * (1 - b + b * (docLen / avgdl))
        const lengthNorm = 1 - this.b + this.b * (avgdl > 0 ? docLen / avgdl : 1)
        const tfComponent = (tf * (this.k1 + 1)) / (tf + this.k1 * lengthNorm)
        const termScore = idf * tfComponent

        if (!docScores.has(posting.docId)) {
          docScores.set(posting.docId, {
            docId: posting.docId,
            score: 0,
            termBreakdowns: [],
            matchedTerms: [],
          })
        }

        const entry = docScores.get(posting.docId)
        entry.score += termScore
        entry.matchedTerms.push(term)
        entry.termBreakdowns.push({
          term,
          tf,
          idf: Number(idf.toFixed(4)),
          tfComponent: Number(tfComponent.toFixed(4)),
          termScore: Number(termScore.toFixed(4)),
        })
      })
    })

    // Convertir a lista y ordenar por relevancia
    const results = Array.from(docScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((res) => {
        const doc = this.documents.get(res.docId)
        const snippet = this.generateSnippet(doc.content, res.matchedTerms)
        return {
          id: doc.id,
          title: doc.title,
          category: doc.category,
          content: doc.content,
          docLength: doc.docLength,
          score: Number(res.score.toFixed(4)),
          matchedTerms: res.matchedTerms,
          termBreakdowns: res.termBreakdowns,
          snippet,
        }
      })

    return results
  }

  /**
   * Genera un fragmento contextual (snippet) con los términos encontrados.
   * @param {string} content - Contenido completo del documento.
   * @param {string[]} matchedTerms - Términos que hicieron match.
   * @returns {string} Fragmento contextual de ~160 caracteres.
   */
  generateSnippet(content, matchedTerms) {
    if (!content) return ''
    if (!matchedTerms || matchedTerms.length === 0) {
      return content.slice(0, 160) + (content.length > 160 ? '...' : '')
    }

    const lower = content.toLowerCase()
    let firstPos = -1

    for (const term of matchedTerms) {
      const idx = lower.indexOf(term)
      if (idx !== -1 && (firstPos === -1 || idx < firstPos)) {
        firstPos = idx
      }
    }

    if (firstPos === -1) {
      return content.slice(0, 160) + (content.length > 160 ? '...' : '')
    }

    const start = Math.max(0, firstPos - 40)
    const end = Math.min(content.length, firstPos + 120)
    let snippet = content.slice(start, end)

    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'

    return snippet
  }

  /**
   * Retorna estadísticas y vocabulario actual del índice.
   * @returns {Object}
   */
  getStats() {
    return {
      totalDocuments: this.documents.size,
      totalTerms: this.index.size,
      avgDocLength: Number(this.getAvgDocLength().toFixed(2)),
      k1: this.k1,
      b: this.b,
    }
  }

  /**
   * Retorna las entradas del índice invertido para inspección visual.
   * @returns {Array<{ term: string, docCount: number, postings: Array<{ docId: string, tf: number }> }>}
   */
  getVocabularyList() {
    const list = []
    this.index.forEach((postings, term) => {
      list.push({
        term,
        docCount: postings.length,
        idf: Number(this.calculateIDF(term).toFixed(4)),
        postings: postings.map((p) => ({ docId: p.docId, tf: p.tf })),
      })
    })
    return list.sort((a, b) => b.docCount - a.docCount || a.term.localeCompare(b.term))
  }
}
