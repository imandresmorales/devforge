/**
 * @fileoverview Componente PwaCacheManager — Gestor interactivo de estrategias de caché PWA.
 *
 * Permite visualizar el estado en tiempo real del almacenamiento de caché del Service Worker,
 * métricas de hits/misses, tamaño en memoria, TTL y purga manual de recursos expirados.
 *
 * @module components/ui/PwaCacheManager
 */

import { useState } from 'react'
import {
  defaultCacheStore,
  CACHE_STRATEGIES,
  DEFAULT_TTL_CONFIG,
} from '../../../utils/swCacheEngine'
import './PwaCacheManager.css'

// Cargar algunos datos iniciales simulados si está vacío
if (defaultCacheStore.entries.size === 0) {
  defaultCacheStore.put('/assets/index-D7h2k9.js', 'console.log("DevForge App Loaded")', DEFAULT_TTL_CONFIG.STATIC_ASSETS, 45200)
  defaultCacheStore.put('/assets/style-A1f89x.css', ':root { --color-brand: #4f46e5; }', DEFAULT_TTL_CONFIG.STATIC_ASSETS, 18400)
  defaultCacheStore.put('/docs/security-architecture', '{"title":"Security Architecture"}', DEFAULT_TTL_CONFIG.DOCUMENTATION, 8200)
  defaultCacheStore.put('/manifest.json', '{"name":"DevForge PWA"}', DEFAULT_TTL_CONFIG.STATIC_ASSETS, 731)
  defaultCacheStore.put('/icons/icon-512.svg', '<svg>DevForge Icon 512</svg>', DEFAULT_TTL_CONFIG.STATIC_ASSETS, 5120)
}

export default function PwaCacheManager() {
  const [selectedStrategy, setSelectedStrategy] = useState(CACHE_STRATEGIES.STALE_WHILE_REVALIDATE)
  const [urlInput, setUrlInput] = useState('')
  const [contentInput, setContentInput] = useState('')
  const [ttlMinutes, setTtlMinutes] = useState(60)
  const [stats, setStats] = useState(() => defaultCacheStore.getStats())
  const [feedback, setFeedback] = useState(null)

  const handleRefreshStats = () => {
    setStats(defaultCacheStore.getStats())
  }

  const handleAddCache = (e) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    const sizeBytes = (contentInput.length || 512) * 2
    const success = defaultCacheStore.put(
      urlInput.trim(),
      contentInput || 'Contenido pre-cacheado de DevForge',
      ttlMinutes * 60 * 1000,
      sizeBytes
    )

    if (success) {
      setFeedback({ type: 'success', text: `Recurso "${urlInput}" cacheado con éxito bajo ${selectedStrategy}.` })
      setUrlInput('')
      setContentInput('')
    } else {
      setFeedback({ type: 'error', text: `La URL "${urlInput}" fue rechazada por reglas de seguridad (datos sensibles o no HTTP/S).` })
    }
    handleRefreshStats()
  }

  const handleGetCache = (key) => {
    const data = defaultCacheStore.get(key)
    if (data !== null) {
      setFeedback({ type: 'success', text: `Cache HIT para [${key}]: ${typeof data === 'string' ? data.slice(0, 40) : 'Datos binarios'}` })
    } else {
      setFeedback({ type: 'error', text: `Cache MISS o expirado para [${key}].` })
    }
    handleRefreshStats()
  }

  const handleDeleteCache = (key) => {
    defaultCacheStore.delete(key)
    setFeedback({ type: 'info', text: `Recurso [${key}] eliminado de la caché.` })
    handleRefreshStats()
  }

  const handlePurgeExpired = () => {
    const purged = defaultCacheStore.purgeExpired()
    setFeedback({ type: 'info', text: `Se han purgado ${purged} recurso(s) expirado(s).` })
    handleRefreshStats()
  }

  const handleClearAll = () => {
    defaultCacheStore.clear()
    setFeedback({ type: 'info', text: 'Caché vaciada por completo.' })
    handleRefreshStats()
  }

  return (
    <div className="pwa-cache-card" role="region" aria-label="Gestor de Caché Service Worker">
      <div className="pwa-cache-card__header">
        <div className="pwa-cache-card__badge">⚡ Mejora 102</div>
        <h3 className="pwa-cache-card__title">Gestor de Estrategias de Caché PWA (TTL & LRU)</h3>
        <p className="pwa-cache-card__subtitle">
          Supervisa el ciclo de vida de la caché offline, políticas de invalidación TTL y desalojo LRU de DevForge.
        </p>
      </div>

      {feedback && (
        <div className={`pwa-cache-feedback pwa-cache-feedback--${feedback.type}`} role="status">
          {feedback.text}
        </div>
      )}

      {/* Grid de Métricas */}
      <div className="pwa-cache-stats-grid">
        <div className="pwa-cache-stat-item">
          <span className="pwa-cache-stat-item__label">Entradas Activas</span>
          <span className="pwa-cache-stat-item__value">{stats.totalEntries} / {stats.maxEntries}</span>
        </div>
        <div className="pwa-cache-stat-item">
          <span className="pwa-cache-stat-item__label">Espacio Estimado</span>
          <span className="pwa-cache-stat-item__value">{(stats.totalBytes / 1024).toFixed(1)} KB</span>
        </div>
        <div className="pwa-cache-stat-item">
          <span className="pwa-cache-stat-item__label">Tasa de Aciertos (Hit Rate)</span>
          <span className="pwa-cache-stat-item__value text-gradient">{stats.hitRatePercent}%</span>
        </div>
        <div className="pwa-cache-stat-item">
          <span className="pwa-cache-stat-item__label">Hits / Misses</span>
          <span className="pwa-cache-stat-item__value">{stats.hits} / {stats.misses}</span>
        </div>
      </div>

      {/* Formulario de Inserción / Prueba */}
      <form className="pwa-cache-form" onSubmit={handleAddCache}>
        <div className="pwa-cache-form__row">
          <div className="pwa-cache-form__group" style={{ flex: 2 }}>
            <label htmlFor="cache-url-input">Ruta o URL del Recurso:</label>
            <input
              id="cache-url-input"
              type="text"
              className="pwa-cache-input"
              placeholder="/docs/webrtc-guide o https://..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              required
            />
          </div>

          <div className="pwa-cache-form__group" style={{ flex: 1 }}>
            <label htmlFor="cache-strategy-select">Estrategia:</label>
            <select
              id="cache-strategy-select"
              className="pwa-cache-select"
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
            >
              <option value={CACHE_STRATEGIES.STALE_WHILE_REVALIDATE}>Stale-While-Revalidate</option>
              <option value={CACHE_STRATEGIES.CACHE_FIRST}>Cache-First</option>
              <option value={CACHE_STRATEGIES.NETWORK_FIRST}>Network-First</option>
            </select>
          </div>

          <div className="pwa-cache-form__group" style={{ flex: 1 }}>
            <label htmlFor="cache-ttl-input">TTL (Minutos):</label>
            <input
              id="cache-ttl-input"
              type="number"
              min="1"
              max="10080"
              className="pwa-cache-input"
              value={ttlMinutes}
              onChange={(e) => setTtlMinutes(Number(e.target.value))}
            />
          </div>
        </div>

        <button type="submit" className="pwa-cache-btn pwa-cache-btn--primary">
          ➕ Almacenar en Caché
        </button>
      </form>

      {/* Acciones Rápidas */}
      <div className="pwa-cache-actions">
        <button type="button" className="pwa-cache-btn pwa-cache-btn--secondary" onClick={handlePurgeExpired}>
          🧹 Purgar Expirados
        </button>
        <button type="button" className="pwa-cache-btn pwa-cache-btn--danger" onClick={handleClearAll}>
          🗑️ Vaciar Caché
        </button>
      </div>

      {/* Tabla de Entradas */}
      <div className="pwa-cache-table-wrapper">
        <table className="pwa-cache-table">
          <thead>
            <tr>
              <th>Recurso (Key)</th>
              <th>Tamaño</th>
              <th>TTL</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {stats.entriesList.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', opacity: 0.7 }}>No hay recursos almacenados en caché.</td>
              </tr>
            ) : (
              stats.entriesList.map((item) => (
                <tr key={item.key}>
                  <td>
                    <code className="pwa-cache-key-code">{item.key}</code>
                  </td>
                  <td>{(item.sizeBytes / 1024).toFixed(1)} KB</td>
                  <td>{Math.round(item.ttl / 60000)} min</td>
                  <td>
                    <span className={`pwa-cache-badge ${item.isExpired ? 'pwa-cache-badge--expired' : 'pwa-cache-badge--fresh'}`}>
                      {item.isExpired ? 'Expirado' : 'Fresco'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="pwa-cache-btn-mini"
                      onClick={() => handleGetCache(item.key)}
                      title="Probar lectura (Fetch/Hit)"
                    >
                      🔍 Leer
                    </button>
                    <button
                      type="button"
                      className="pwa-cache-btn-mini pwa-cache-btn-mini--delete"
                      onClick={() => handleDeleteCache(item.key)}
                      title="Eliminar recurso"
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
