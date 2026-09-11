/**
 * @fileoverview Componente UI para el Motor de Búsqueda de Texto Completo con Índice Invertido y BM25 (Mejora 80).
 *
 * Muestra:
 * - Buscador en tiempo real con ranking BM25, snippets con resaltado y desglose matemático del score.
 * - Explorador del Índice Invertido (Términos, IDF, Frecuencia de Documentos, Postings List).
 * - Control de Parámetros de BM25 (k1: saturación de TF, b: penalización por longitud).
 * - Formulario para indexar nuevos documentos o artículos dinámicamente.
 *
 * @module components/ui/InvertedIndexSearch/InvertedIndexSearch
 */
import { useState, useRef, useMemo } from 'react'
import { InvertedIndexEngine } from '../../../utils/invertedIndex'
import './InvertedIndexSearch.css'

const INITIAL_CORPUS = [
  {
    id: 'doc_1',
    title: '🛡️ Mitigación de Vulnerabilidades SSRF y Validación DNS',
    category: 'Ciberseguridad',
    content: 'El filtrado de direcciones IP privadas, la resolución DNS previa y el bloqueo de loopback previenen ataques Server-Side Request Forgery en aplicaciones cloud.',
  },
  {
    id: 'doc_2',
    title: '🌲 Verificación Criptográfica con Árboles de Merkle',
    category: 'Criptografía',
    content: 'Los árboles de Merkle proporcionan pruebas de inclusión compactas O(log N) para auditar la integridad de transacciones y estados en ledgers distribuidos.',
  },
  {
    id: 'doc_3',
    title: '🚀 Despliegue Progresivo Canary y Feature Flags',
    category: 'DevOps',
    content: 'Las feature flags habilitan despliegues sin tiempo de inactividad, rollouts porcentuales de tráfico y kill switches inmediatos para aislar regresiones.',
  },
  {
    id: 'doc_4',
    title: '⚡ Consenso Distribuido Raft y Tolerancia a Fallos Bizantinos',
    category: 'Sistemas Distribuidos',
    content: 'El protocolo Raft mantiene un registro de logs replicado consistente entre nodos mediante elección de líder y latidos de sincronización periódicos.',
  },
  {
    id: 'doc_5',
    title: '📦 Message Broker Kafka y Consumer Groups Escalables',
    category: 'Arquitectura',
    content: 'Apache Kafka particiona topics para distribuir streams de eventos concurrentes entre consumidores sin pérdida de mensajes gracias al offset commit.',
  },
  {
    id: 'doc_6',
    title: '🔑 Autenticación Biométrica WebAuthn y Criptografía FIDO2',
    category: 'Ciberseguridad',
    content: 'FIDO2 reemplaza las contraseñas débiles mediante pares de claves asimétricas en enclaves seguros de hardware con protección contra phishing.',
  },
]

export default function InvertedIndexSearch() {
  const [k1, setK1] = useState(1.2)
  const [b, setB] = useState(0.75)
  const [query, setQuery] = useState('criptografia verificacion')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [activeTab, setActiveTab] = useState('search') // 'search' | 'index' | 'new_doc'
  const [expandedDoc, setExpandedDoc] = useState(null)

  // Documentos en el índice
  const [documents, setDocuments] = useState(INITIAL_CORPUS)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Arquitectura')
  const [newContent, setNewContent] = useState('')

  // Instancia de motor recalculada cuando cambian documentos o hiperparámetros
  const engine = useMemo(() => {
    const eng = new InvertedIndexEngine({ k1, b })
    eng.addDocuments(documents)
    return eng
  }, [documents, k1, b])

  const stats = useMemo(() => engine.getStats(), [engine])
  const vocabulary = useMemo(() => engine.getVocabularyList(), [engine])

  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    return engine.search(query, {
      category: categoryFilter === 'ALL' ? undefined : categoryFilter,
      limit: 10,
    })
  }, [engine, query, categoryFilter])

  const handleAddDoc = (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    const newDoc = {
      id: `doc_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
    }

    setDocuments((prev) => [newDoc, ...prev])
    setNewTitle('')
    setNewContent('')
    setActiveTab('search')
  }

  const handleDeleteDoc = (id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  const categories = useMemo(() => {
    const set = new Set(documents.map((d) => d.category))
    return ['ALL', ...Array.from(set)]
  }, [documents])

  return (
    <section className="inverted-index-search" aria-labelledby="iis-title">
      {/* ── Header ── */}
      <div className="iis-header">
        <div className="iis-header__info">
          <span className="badge badge--brand">Recuperación de Información & IR</span>
          <h2 id="iis-title" className="iis-title">
            Motor de Búsqueda de Texto Completo con BM25
          </h2>
          <p className="iis-desc">
            Simulador de motor de búsqueda con <strong>Índice Invertido</strong> y algoritmo de ranking probabilístico
            <strong> Okapi BM25</strong> (el estándar de la industria en Apache Lucene y Elasticsearch).
          </p>
        </div>

        {/* Stats del Índice */}
        <div className="iis-stats-pill">
          <div className="iis-stat-item">
            <span className="iis-stat-label">Documentos:</span>
            <strong className="iis-stat-val">{stats.totalDocuments}</strong>
          </div>
          <div className="iis-stat-item">
            <span className="iis-stat-label">Términos Únicos:</span>
            <strong className="iis-stat-val">{stats.totalTerms}</strong>
          </div>
          <div className="iis-stat-item">
            <span className="iis-stat-label">Longitud Promedio (avgdl):</span>
            <strong className="iis-stat-val">{stats.avgDocLength} palabras</strong>
          </div>
        </div>
      </div>

      {/* ── Controles de Hiperparámetros BM25 ── */}
      <div className="iis-hyperparams">
        <div className="iis-param-card">
          <div className="iis-param-head">
            <span>Saturación de Frecuencia (<code>k1</code>): <strong>{k1}</strong></span>
            <small>Controla qué tan rápido satura la repetición de un término (1.2 normal)</small>
          </div>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={k1}
            onChange={(e) => setK1(Number(e.target.value))}
            className="iis-slider"
          />
        </div>

        <div className="iis-param-card">
          <div className="iis-param-head">
            <span>Penalización por Longitud (<code>b</code>): <strong>{b}</strong></span>
            <small>Ajusta el impacto del tamaño del documento (0 = sin penalización, 1 = total)</small>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
            className="iis-slider"
          />
        </div>
      </div>

      {/* ── Selector de Pestañas ── */}
      <div className="iis-tabs">
        <button
          type="button"
          className={`iis-tab-btn ${activeTab === 'search' ? 'iis-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Buscador en Vivo & Ranking ({searchResults.length})
        </button>
        <button
          type="button"
          className={`iis-tab-btn ${activeTab === 'index' ? 'iis-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('index')}
        >
          📚 Explorador del Índice Invertido ({vocabulary.length} términos)
        </button>
        <button
          type="button"
          className={`iis-tab-btn ${activeTab === 'new_doc' ? 'iis-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('new_doc')}
        >
          ➕ Indexar Nuevo Documento
        </button>
      </div>

      {/* ── Tab: Buscador ── */}
      {activeTab === 'search' && (
        <div className="iis-search-section">
          {/* Barra de Búsqueda */}
          <div className="iis-searchbar-container">
            <div className="iis-input-wrapper">
              <span className="iis-search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                className="iis-search-input"
                placeholder="Ej: criptografia verificacion, fallos kafka, ssrf..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="iis-clear-btn"
                  onClick={() => setQuery('')}
                  title="Limpiar consulta"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtro por Categoría */}
            <select
              className="iis-category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'Todas las Categorías' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Resultados */}
          <div className="iis-results-container">
            {searchResults.length === 0 ? (
              <div className="iis-empty-state">
                <span className="iis-empty-icon">📭</span>
                <h4>No se encontraron coincidencias para "{query}"</h4>
                <p>Prueba con términos como <em>seguridad, merkle, kafka, flags, consenso</em>.</p>
              </div>
            ) : (
              searchResults.map((res, rank) => {
                const isExpanded = expandedDoc === res.id
                const maxScore = searchResults[0]?.score || 1
                const relPercent = Math.round((res.score / maxScore) * 100)

                return (
                  <article key={res.id} className="iis-result-card">
                    <div className="iis-result-top">
                      <div className="iis-result-title-group">
                        <span className="iis-rank-badge">#{rank + 1}</span>
                        <h3 className="iis-result-title">{res.title}</h3>
                        <span className="badge badge--neutral">{res.category}</span>
                      </div>
                      <div className="iis-score-box">
                        <span className="iis-score-label">BM25 Score</span>
                        <strong className="iis-score-val">{res.score}</strong>
                      </div>
                    </div>

                    {/* Barra de Relevancia Relativa */}
                    <div className="iis-rel-bar">
                      <div className="iis-rel-fill" style={{ width: `${relPercent}%` }} />
                    </div>

                    {/* Snippet con Highlight */}
                    <p className="iis-snippet">{res.snippet}</p>

                    {/* Términos que hicieron Match */}
                    <div className="iis-matched-terms">
                      <span className="iis-matched-label">Términos encontrados:</span>
                      {res.matchedTerms.map((t) => (
                        <span key={t} className="iis-term-chip">
                          {t}
                        </span>
                      ))}
                      <button
                        type="button"
                        className="iis-breakdown-toggle"
                        onClick={() => setExpandedDoc(isExpanded ? null : res.id)}
                      >
                        {isExpanded ? '▲ Ocultar Fórmula BM25' : '▼ Ver Desglose Matemático'}
                      </button>
                    </div>

                    {/* Desglose Matemático de la fórmula BM25 */}
                    {isExpanded && (
                      <div className="iis-breakdown-table-box">
                        <table className="iis-table">
                          <thead>
                            <tr>
                              <th>Término</th>
                              <th>TF (Frec.)</th>
                              <th>IDF (Rareza)</th>
                              <th>TF Component (Sat.)</th>
                              <th>Score Término</th>
                            </tr>
                          </thead>
                          <tbody>
                            {res.termBreakdowns.map((tb) => (
                              <tr key={tb.term}>
                                <td><code>{tb.term}</code></td>
                                <td>{tb.tf}</td>
                                <td>{tb.idf}</td>
                                <td>{tb.tfComponent}</td>
                                <td><strong style={{ color: 'var(--color-brand-500)' }}>{tb.termScore}</strong></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Explorador del Índice Invertido ── */}
      {activeTab === 'index' && (
        <div className="iis-index-explorer">
          <p className="iis-index-desc">
            Visualización de la estructura de datos interna del motor: cada término apunta a su lista de postings
            (documentos donde aparece, con sus frecuencias respectivas e IDF calculado).
          </p>
          <div className="iis-vocab-table-wrapper">
            <table className="iis-table">
              <thead>
                <tr>
                  <th>Término (Lexicon)</th>
                  <th>IDF (Log Okapi)</th>
                  <th>Docs</th>
                  <th>Posting List [DocId : Term Frequency]</th>
                </tr>
              </thead>
              <tbody>
                {vocabulary.map((entry) => (
                  <tr key={entry.term}>
                    <td><strong className="iis-vocab-term">{entry.term}</strong></td>
                    <td><code>{entry.idf}</code></td>
                    <td><span className="badge badge--neutral">{entry.docCount}</span></td>
                    <td>
                      <div className="iis-postings-list">
                        {entry.postings.map((p) => (
                          <span key={p.docId} className="iis-posting-tag">
                            {p.docId} (TF: {p.tf})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Indexar Nuevo Documento ── */}
      {activeTab === 'new_doc' && (
        <div className="iis-new-doc-section">
          <form className="iis-form" onSubmit={handleAddDoc}>
            <div className="iis-form-row">
              <div className="iis-form-group">
                <label htmlFor="doc-title">Título del Documento:</label>
                <input
                  id="doc-title"
                  type="text"
                  required
                  placeholder="Ej: 🛡️ Criptografía Post-Cuántica con Dilithium"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="iis-input"
                />
              </div>

              <div className="iis-form-group">
                <label htmlFor="doc-cat">Categoría:</label>
                <select
                  id="doc-cat"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="iis-select"
                >
                  <option value="Ciberseguridad">Ciberseguridad</option>
                  <option value="Criptografía">Criptografía</option>
                  <option value="Arquitectura">Arquitectura</option>
                  <option value="Sistemas Distribuidos">Sistemas Distribuidos</option>
                  <option value="DevOps">DevOps</option>
                  <option value="IA & Data">IA & Data</option>
                </select>
              </div>
            </div>

            <div className="iis-form-group">
              <label htmlFor="doc-content">Contenido / Texto Completo:</label>
              <textarea
                id="doc-content"
                rows={4}
                required
                placeholder="Escribe el contenido a indexar en el vocabulario..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="iis-textarea"
              />
            </div>

            <button type="submit" className="btn-primary">
              ⚡ Indexar Documento y Actualizar Postings
            </button>
          </form>

          {/* Lista de Documentos Indexados Actuales */}
          <div className="iis-current-docs">
            <h4 className="iis-current-docs-title">Documentos en el Corpus ({documents.length})</h4>
            <div className="iis-docs-grid">
              {documents.map((d) => (
                <div key={d.id} className="iis-doc-card">
                  <div className="iis-doc-card-head">
                    <h5>{d.title}</h5>
                    <button
                      type="button"
                      className="iis-doc-delete-btn"
                      onClick={() => handleDeleteDoc(d.id)}
                      title="Eliminar documento del índice"
                    >
                      🗑️
                    </button>
                  </div>
                  <span className="badge badge--neutral">{d.category}</span>
                  <p className="iis-doc-card-preview">{d.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
