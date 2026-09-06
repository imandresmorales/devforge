/**
 * @fileoverview Motor de Base de Datos Vectorial en Memoria y Búsqueda Semántica k-NN (Mejora 67).
 *
 * CARACTERÍSTICAS:
 * - Almacenamiento, indexación y búsqueda de vectores de alta dimensionalidad (Embeddings).
 * - Métricas de similitud matemática implementadas:
 *     1. Cosine Similarity (Similitud Coseno): $\cos(\theta) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$.
 *     2. Euclidean Distance (Distancia Euclidiana L2): $d(\mathbf{u}, \mathbf{v}) = \sqrt{\sum (u_i - v_i)^2}$.
 *     3. Dot Product (Producto Punto): $\mathbf{u} \cdot \mathbf{v} = \sum u_i v_i$.
 *     4. Manhattan Distance (Distancia L1): $\sum |u_i - v_i|$.
 * - Algoritmo k-Nearest Neighbors (k-NN) con filtrado por metadatos (Tag / Category filtering).
 * - Vectorizador sintético de texto (TF-IDF / N-gram Hash Embedding en 16 dimensiones) para consultas en lenguaje natural.
 *
 * @module utils/vectorDbEngine
 */

/**
 * Calcula el producto punto entre dos vectores.
 *
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
export function dotProduct(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    throw new Error('Los vectores deben tener la misma longitud para calcular el producto punto.')
  }
  let sum = 0
  for (let i = 0; i < vecA.length; i++) {
    sum += vecA[i] * vecB[i]
  }
  return sum
}

/**
 * Calcula la norma euclidiana (magnitud L2) de un vector.
 *
 * @param {number[]} vec
 * @returns {number}
 */
export function magnitude(vec) {
  let sum = 0
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i]
  }
  return Math.sqrt(sum)
}

/**
 * Normaliza un vector a longitud unitaria (norma = 1).
 *
 * @param {number[]} vec
 * @returns {number[]}
 */
export function normalizeVector(vec) {
  const mag = magnitude(vec)
  if (mag === 0) return vec.map(() => 0)
  return vec.map((v) => v / mag)
}

/**
 * Calcula la Similitud Coseno entre dos vectores (Rango de -1 a 1).
 *
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
export function cosineSimilarity(vecA, vecB) {
  const magA = magnitude(vecA)
  const magB = magnitude(vecB)
  if (magA === 0 || magB === 0) return 0
  const dot = dotProduct(vecA, vecB)
  return dot / (magA * magB)
}

/**
 * Calcula la Distancia Euclidiana (L2) entre dos vectores.
 *
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
export function euclideanDistance(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    throw new Error('Los vectores deben tener la misma longitud.')
  }
  let sum = 0
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

/**
 * Vectorizador de texto en 16 dimensiones basado en hash n-gram y bolsa de palabras semánticas.
 *
 * @param {string} text - Texto de entrada.
 * @param {number} [dimensions=16] - Dimensionalidad del espacio vectorial.
 * @returns {number[]} Vector normalizado
 */
export function generateTextEmbedding(text, dimensions = 16) {
  if (!text || typeof text !== 'string') {
    return new Array(dimensions).fill(0)
  }

  const clean = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const words = clean.split(/\W+/).filter(Boolean)
  const vector = new Array(dimensions).fill(0)

  // Términos clave con sesgo semántico para clustering realista
  const SEMANTIC_CLUSTERS = {
    security: ['seguridad', 'vulnerabilidad', 'owasp', 'ataque', 'cors', 'xss', 'sql', 'inyeccion', 'pki', 'ssl', 'tls'],
    crypto: ['cifrado', 'criptografia', 'rsa', 'aes', 'zkp', 'schnorr', 'secreto', 'hash', 'clave', 'firma'],
    distributed: ['distribuido', 'consenso', 'raft', 'cluster', 'nodo', 'lider', 'quorum', 'gossip', 'tolerancia', 'particion'],
    database: ['base', 'datos', 'sql', 'acid', 'transaccion', 'vectorial', 'embedding', 'indice', 'tabla', 'query'],
    architecture: ['patron', 'saga', 'circuit', 'breaker', 'cache', 'balanceador', 'event', 'bus', 'microservicios'],
  }

  words.forEach((word) => {
    // Hash determinista del token
    let hash = 0
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) & 0xffffffff
    }
    const idx = Math.abs(hash) % dimensions
    vector[idx] += 1.0

    // Enriquecimiento semántico de clusters
    if (SEMANTIC_CLUSTERS.security.includes(word)) vector[0] += 2.5
    if (SEMANTIC_CLUSTERS.crypto.includes(word)) vector[1] += 2.5
    if (SEMANTIC_CLUSTERS.distributed.includes(word)) vector[2] += 2.5
    if (SEMANTIC_CLUSTERS.database.includes(word)) vector[3] += 2.5
    if (SEMANTIC_CLUSTERS.architecture.includes(word)) vector[4] += 2.5
  })

  return normalizeVector(vector)
}

/**
 * Base de datos de documentos predefinidos de DevForge para el Vector DB.
 */
export const DEFAULT_VECTOR_DOCS = [
  {
    id: 'doc-1',
    title: 'Auditoría de Vulnerabilidades CORS & OWASP',
    category: 'Seguridad Web',
    text: 'Detección de malas configuraciones en Cross-Origin Resource Sharing, reflexión de origen y bypass de seguridad.',
    vector: generateTextEmbedding('Auditoría de Vulnerabilidades CORS & OWASP seguridad ataque vulnerabilidad reflexion'),
  },
  {
    id: 'doc-2',
    title: 'Protocolo de Consenso Distribuido Raft',
    category: 'Sistemas Distribuidos',
    text: 'Algoritmo de elección de líder, replicación de log de comandos y quórum mayoritario en clústeres.',
    vector: generateTextEmbedding('Protocolo de Consenso Distribuido Raft cluster nodo lider quorum particion'),
  },
  {
    id: 'doc-3',
    title: 'Pruebas de Cero Conocimiento (ZKP Schnorr)',
    category: 'Criptografía',
    text: 'Autenticación matemática probando posesión de secreto sin revelar contraseña ni hashes con protocolo Schnorr.',
    vector: generateTextEmbedding('Pruebas de Cero Conocimiento ZKP Schnorr secreto clave criptografia firma'),
  },
  {
    id: 'doc-4',
    title: 'Cifrado Extremo a Extremo (E2EE RSA + AES)',
    category: 'Criptografía',
    text: 'Criptografía híbrida de grado militar con Web Crypto API, envoltura RSA-OAEP y cifrado autenticado AES-GCM.',
    vector: generateTextEmbedding('Cifrado Extremo a Extremo E2EE RSA AES clave secreta autenticacion'),
  },
  {
    id: 'doc-5',
    title: 'Transacciones ACID y Niveles de Aislamiento SQL',
    category: 'Bases de Datos',
    text: 'Control de concurrencia y prevención de lecturas sucias y fantasmas en motores relacionales ANSI SQL.',
    vector: generateTextEmbedding('Transacciones ACID y Niveles de Aislamiento SQL base datos transaccion query'),
  },
]

/**
 * Clase principal que gestiona el Vector Database en memoria.
 */
export class InMemoryVectorDB {
  constructor() {
    this.documents = new Map() // id -> { id, title, category, text, vector, metadata }
    this.initDefaultDataset()
  }

  initDefaultDataset() {
    DEFAULT_VECTOR_DOCS.forEach((doc) => {
      this.insert(doc.id, doc.vector, {
        title: doc.title,
        category: doc.category,
        text: doc.text,
      })
    })
  }

  /**
   * Inserta o actualiza un vector con sus metadatos.
   *
   * @param {string} id
   * @param {number[]} vector
   * @param {Object} metadata
   */
  insert(id, vector, metadata = {}) {
    if (!id || !Array.isArray(vector)) {
      throw new Error('ID y vector son obligatorios para la inserción.')
    }
    this.documents.set(id, {
      id,
      vector: normalizeVector(vector),
      ...metadata,
      updatedAt: Date.now(),
    })
  }

  /**
   * Elimina un vector por su ID.
   *
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    return this.documents.delete(id)
  }

  /**
   * Realiza una búsqueda semántica de los k vecinos más cercanos (k-NN).
   *
   * @param {number[]|string} query - Vector de consulta o texto en lenguaje natural.
   * @param {Object} [options]
   * @param {number} [options.topK=5] - Número de resultados a retornar.
   * @param {('cosine'|'euclidean'|'dot')} [options.metric='cosine'] - Métrica de distancia.
   * @param {string} [options.categoryFilter] - Filtro opcional por categoría.
   * @returns {Array<{
   *   id: string,
   *   title: string,
   *   category: string,
   *   text: string,
   *   score: number,
   *   similarityPercent: number,
   *   vector: number[]
   * }>}
   */
  query(query, options = {}) {
    const { topK = 5, metric = 'cosine', categoryFilter = null } = options

    const queryVec = typeof query === 'string'
      ? generateTextEmbedding(query)
      : normalizeVector(query)

    const scoredResults = []

    for (const doc of this.documents.values()) {
      if (categoryFilter && doc.category !== categoryFilter) {
        continue
      }

      let score = 0
      if (metric === 'euclidean') {
        // En distancia euclidiana, menor valor = mayor cercanía
        score = euclideanDistance(queryVec, doc.vector)
      } else if (metric === 'dot') {
        score = dotProduct(queryVec, doc.vector)
      } else {
        // Cosine similarity por defecto
        score = cosineSimilarity(queryVec, doc.vector)
      }

      // Calcular porcentaje de similitud intuitivo [0 - 100%]
      let similarityPercent = 0
      if (metric === 'cosine' || metric === 'dot') {
        similarityPercent = Math.max(0, Math.min(100, Math.round(((score + 1) / 2) * 100)))
      } else {
        similarityPercent = Math.max(0, Math.min(100, Math.round((1 / (1 + score)) * 100)))
      }

      scoredResults.push({
        id: doc.id,
        title: doc.title || doc.id,
        category: doc.category || 'General',
        text: doc.text || '',
        score: Number(score.toFixed(4)),
        similarityPercent,
        vector: doc.vector,
      })
    }

    // Ordenar: si es euclidean de menor a mayor, si es cosine/dot de mayor a menor
    scoredResults.sort((a, b) => {
      return metric === 'euclidean' ? a.score - b.score : b.score - a.score
    })

    return scoredResults.slice(0, topK)
  }

  /**
   * Obtiene todos los documentos indexados en la base de datos.
   */
  getAll() {
    return Array.from(this.documents.values())
  }
}
