/**
 * @fileoverview Componente UI para la Base de Datos Vectorial & Búsqueda Semántica k-NN (Mejora 67).
 *
 * Muestra:
 * - Buscador semántico en lenguaje natural impulsado por similitud Coseno / Distancia Euclidiana.
 * - Clasificación de documentos por afinidad temática en tiempo real.
 * - Formulario para indexar nuevos documentos vectorizados en la base de datos.
 * - Visualizador de mapa vectorial con desglose de dimensiones matemáticas.
 *
 * @module components/ui/VectorDbSimulator/VectorDbSimulator
 */
import { useState, useMemo, useRef } from 'react'
import {
  InMemoryVectorDB,
  generateTextEmbedding,
} from '../../../utils/vectorDbEngine'
import './VectorDbSimulator.css'

export default function VectorDbSimulator() {
  const dbRef = useRef(null)
  if (!dbRef.current) {
    dbRef.current = new InMemoryVectorDB()
  }

  const [searchQuery, setSearchQuery] = useState('seguridad en transferencias y proteccion contra ataques')
  const [metric, setMetric] = useState('cosine')
  const [topK, setTopK] = useState(4)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Seguridad Web')
  const [newContent, setNewContent] = useState('')
  const [dbVersion, setDbVersion] = useState(0)

  const queryResults = useMemo(() => {
    return dbRef.current.query(searchQuery, {
      topK: Number(topK),
      metric,
      categoryFilter: categoryFilter === 'ALL' ? null : categoryFilter,
    })
  }, [searchQuery, metric, topK, categoryFilter, dbVersion])

  const totalDocuments = dbRef.current.getAll().length

  const handleInsertDocument = (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    const id = `doc-${Date.now()}`
    const vector = generateTextEmbedding(`${newTitle} ${newCategory} ${newContent}`)
    dbRef.current.insert(id, vector, {
      title: newTitle.trim(),
      category: newCategory,
      text: newContent.trim(),
    })

    setNewTitle('')
    setNewContent('')
    setDbVersion((v) => v + 1)
  }

  const queryVectorPreview = useMemo(() => {
    return generateTextEmbedding(searchQuery).slice(0, 8)
  }, [searchQuery])

  return (
    <section className="vectordb-simulator" aria-labelledby="vectordb-title">
      <div className="vectordb-simulator__header">
        <div>
          <span className="badge badge--brand">Inteligencia Artificial & Embeddings</span>
          <h2 id="vectordb-title" className="vectordb-simulator__title">
            Base de Datos Vectorial & Búsqueda Semántica k-NN
          </h2>
          <p className="vectordb-simulator__desc">
            Motor de almacenamiento vectorial para Inteligencia Artificial generativa y búsqueda por similitud Coseno.
            Encuentra documentos por su significado conceptual en lugar de coincidencia exacta de palabras clave.
          </p>
        </div>

        <div className="vectordb-stats-badge">
          <span>📚 {totalDocuments} Vectores Indexados</span>
        </div>
      </div>

      {/* ── Barra de Búsqueda Semántica ── */}
      <div className="vectordb-search-card">
        <div className="vectordb-search-row">
          <input
            type="text"
            className="input vectordb-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Introduce una consulta en lenguaje natural (ej. 'criptografia y contraseñas')..."
          />
        </div>

        <div className="vectordb-controls-grid">
          <div className="vectordb-control-item">
            <label className="vectordb-control-label">Métrica de Distancia:</label>
            <select
              className="select vectordb-select"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
            >
              <option value="cosine">Similitud Coseno (Cosine Similarity)</option>
              <option value="euclidean">Distancia Euclidiana (L2 Distance)</option>
              <option value="dot">Producto Punto (Dot Product)</option>
            </select>
          </div>

          <div className="vectordb-control-item">
            <label className="vectordb-control-label">Filtro de Categoría:</label>
            <select
              className="select vectordb-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="Seguridad Web">Seguridad Web</option>
              <option value="Criptografía">Criptografía</option>
              <option value="Sistemas Distribuidos">Sistemas Distribuidos</option>
              <option value="Bases de Datos">Bases de Datos</option>
            </select>
          </div>

          <div className="vectordb-control-item">
            <label className="vectordb-control-label">Top-K Resultados:</label>
            <input
              type="number"
              min="1"
              max="10"
              className="input vectordb-k-input"
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
            />
          </div>
        </div>

        {/* Vector Embedding Preview de la consulta */}
        <div className="vectordb-emb-preview">
          <span className="vectordb-emb-label">
            Vector Embedding de Consulta (Primeras 8 Dimensiones normalizadas L2):
          </span>
          <div className="vectordb-dim-bars">
            {queryVectorPreview.map((val, idx) => (
              <div key={idx} className="vectordb-dim-cell" title={`Dimensión ${idx + 1}: ${val.toFixed(3)}`}>
                <div
                  className="vectordb-dim-fill"
                  style={{ height: `${Math.min(100, Math.max(10, Math.abs(val) * 100))}%` }}
                />
                <span className="vectordb-dim-num">d{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="vectordb-main-layout">
        {/* ── Resultados de la Búsqueda k-NN ── */}
        <div className="vectordb-results-panel">
          <h3 className="vectordb-panel-title">
            🎯 Resultados más Cercanos (k-NN Ranking por {metric.toUpperCase()})
          </h3>

          <div className="vectordb-results-list">
            {queryResults.length === 0 ? (
              <p className="vectordb-empty">No se encontraron coincidencias vectoriales con los filtros seleccionados.</p>
            ) : (
              queryResults.map((doc, rank) => (
                <article key={doc.id} className="vectordb-result-card">
                  <div className="vectordb-result-header">
                    <span className="vectordb-rank-badge">#{rank + 1}</span>
                    <div className="vectordb-result-info">
                      <h4 className="vectordb-result-title">{doc.title}</h4>
                      <span className="vectordb-result-category">{doc.category}</span>
                    </div>
                    <div className="vectordb-score-box">
                      <span className="vectordb-score-pct">{doc.similarityPercent}% match</span>
                      <span className="vectordb-score-raw">Score: {doc.score}</span>
                    </div>
                  </div>

                  <p className="vectordb-result-snippet">{doc.text}</p>

                  <div className="vectordb-match-bar-track">
                    <div
                      className="vectordb-match-bar-fill"
                      style={{ width: `${doc.similarityPercent}%` }}
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* ── Formulario para Indexar Nuevo Documento ── */}
        <div className="vectordb-insert-panel">
          <h3 className="vectordb-panel-title">➕ Indexar Nuevo Vector</h3>
          <form onSubmit={handleInsertDocument} className="vectordb-insert-form">
            <div className="vectordb-field">
              <label className="vectordb-control-label">Título del Documento:</label>
              <input
                type="text"
                className="input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej: Token Bucket Rate Limiting"
                required
              />
            </div>

            <div className="vectordb-field">
              <label className="vectordb-control-label">Categoría:</label>
              <select
                className="select"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="Seguridad Web">Seguridad Web</option>
                <option value="Criptografía">Criptografía</option>
                <option value="Sistemas Distribuidos">Sistemas Distribuidos</option>
                <option value="Bases de Datos">Bases de Datos</option>
              </select>
            </div>

            <div className="vectordb-field">
              <label className="vectordb-control-label">Contenido Semántico:</label>
              <textarea
                className="textarea"
                rows={3}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Describe el contenido para que el motor genere su embedding..."
                required
              />
            </div>

            <button type="submit" className="btn-primary">
              ⚡ Vectorizar e Indexar
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
