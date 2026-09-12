/**
 * @fileoverview Componente UI para el Simulador de CDN Edge Caching y Anycast Routing (Mejora 84).
 *
 * Muestra:
 * - Mapa global de PoPs (US-East, EU-West, AP-East, SA-East) con latencias en tiempo real.
 * - Generador de peticiones HTTP desde distintas ciudades del mundo (Madrid, NY, Tokio, Buenos Aires).
 * - Comparativa de latencia (Servidor de Origen vs Edge Hit: hasta 96% de aceleración).
 * - Panel de Control de Cabeceras HTTP (Cache-Control: max-age, s-maxage, stale-while-revalidate).
 * - Centro de Purga de Caché perimetral (por URL y por Cache-Tag / Surrogate-Key).
 *
 * @module components/ui/CDNSimulator/CDNSimulator
 */
import { useState, useRef } from 'react'
import {
  CDNEngine,
  EDGE_POPS,
  CLIENT_LOCATIONS,
  CACHE_STATUS,
} from '../../../utils/cdnSimulator'
import './CDNSimulator.css'

const ASSET_PRESETS = [
  {
    id: 'static_bundle',
    label: '⚡ JS Bundle (React App)',
    url: '/assets/index-93f48a.js',
    cacheControl: 'public, max-age=31536000, immutable',
    cacheTags: ['tag:frontend', 'tag:static'],
    body: '/* React 18 Production Bundle (Minified) */ const e=window.React...',
  },
  {
    id: 'product_api',
    label: '🛍️ API Catálogo Productos',
    url: '/api/v1/products',
    cacheControl: 'public, s-maxage=60, stale-while-revalidate=120',
    cacheTags: ['tag:products', 'tag:catalog'],
    body: '{"items":[{"id":101,"name":"MacBook Pro M3","price":1999}]}',
  },
  {
    id: 'user_profile',
    label: '🔒 Perfil Privado (No Cacheable)',
    url: '/api/v1/user/profile',
    cacheControl: 'private, no-cache, no-store',
    cacheTags: [],
    body: '{"userId":"usr_88","email":"vip@devforge.app","balance":4500}',
  },
  {
    id: 'dynamic_price',
    label: '📈 Cotización Crypto en Vivo',
    url: '/api/v1/crypto/rates',
    cacheControl: 'public, s-maxage=5, stale-while-revalidate=15',
    cacheTags: ['tag:crypto'],
    body: '{"BTC_USD": 68450.20, "ETH_USD": 3840.10, "timestamp": 1726084800}',
  },
]

export default function CDNSimulator() {
  const cdnRef = useRef(null)
  if (!cdnRef.current) {
    cdnRef.current = new CDNEngine()
  }

  const [selectedClientLoc, setSelectedClientLoc] = useState('loc_madrid')
  const [selectedAsset, setSelectedAsset] = useState(ASSET_PRESETS[0].id)
  const [lastResponse, setLastResponse] = useState(null)
  const [tagToPurge, setTagToPurge] = useState('tag:products')
  const [purgeFeedback, setPurgeFeedback] = useState('')
  const [, setTick] = useState(0)

  const currentAsset = ASSET_PRESETS.find((a) => a.id === selectedAsset) || ASSET_PRESETS[0]
  const currentClientLoc = CLIENT_LOCATIONS.find((l) => l.id === selectedClientLoc) || CLIENT_LOCATIONS[0]
  const nearestPoP = cdnRef.current.resolveAnycastPoP(selectedClientLoc)
  const snapshot = cdnRef.current.getSnapshot()

  const handleSendRequest = () => {
    const res = cdnRef.current.fetch(
      { url: currentAsset.url, clientLocationId: selectedClientLoc },
      {
        body: currentAsset.body,
        cacheControl: currentAsset.cacheControl,
        cacheTags: currentAsset.cacheTags,
      }
    )
    setLastResponse(res)
    setPurgeFeedback('')
    setTick((t) => t + 1)
  }

  const handlePurgeTag = () => {
    const count = cdnRef.current.purgeByTag(tagToPurge)
    setPurgeFeedback(`🧹 Se purgaron ${count} entradas cacheadas con la etiqueta "${tagToPurge}".`)
    setTick((t) => t + 1)
  }

  const handlePurgeUrl = (url) => {
    const count = cdnRef.current.purgeByUrl(url)
    setPurgeFeedback(`🧹 Recurso "${url}" purgado globalmente en todos los Edge PoPs (${count} instancias).`)
    setTick((t) => t + 1)
  }

  const handleReset = () => {
    cdnRef.current.reset()
    setLastResponse(null)
    setPurgeFeedback('Red CDN reiniciada por completo.')
    setTick((t) => t + 1)
  }

  return (
    <section className="cdn-simulator" aria-labelledby="cdn-title">
      {/* ── Header ── */}
      <div className="cdn-header">
        <div>
          <span className="badge badge--brand">Edge Computing & Arquitectura Web</span>
          <h2 id="cdn-title" className="cdn-title">
            Simulador de Red CDN: Edge Caching & Anycast Routing
          </h2>
          <p className="cdn-desc">
            Modela la distribución global de contenidos (Cloudflare / Fastly) evaluando cabeceras
            <code> Cache-Control</code>, <code>stale-while-revalidate</code> y enrutamiento por menor latencia Anycast.
          </p>
        </div>

        {/* Global Stats */}
        <div className="cdn-stats-pills">
          <div className="cdn-stat">
            <span>Peticiones:</span>
            <strong>{snapshot.stats.totalRequests}</strong>
          </div>
          <div className="cdn-stat">
            <span>Cache Hits:</span>
            <strong style={{ color: '#4ade80' }}>{snapshot.stats.cacheHits}</strong>
          </div>
          <div className="cdn-stat">
            <span>Cache Misses:</span>
            <strong style={{ color: '#f59e0b' }}>{snapshot.stats.cacheMisses}</strong>
          </div>
          <div className="cdn-stat">
            <span>Purgas:</span>
            <strong style={{ color: '#c084fc' }}>{snapshot.stats.purgedCount}</strong>
          </div>
        </div>
      </div>

      {/* ── Mapa Global de Edge PoPs ── */}
      <div className="cdn-pops-grid">
        {Object.values(EDGE_POPS).map((pop) => {
          const cachedEntries = snapshot.edgeSummary[pop.id] || []
          const isTargeted = nearestPoP.id === pop.id

          return (
            <div key={pop.id} className={`cdn-pop-card ${isTargeted ? 'cdn-pop-card--targeted' : ''}`}>
              <div className="cdn-pop-head">
                <span className="cdn-pop-name">{pop.name}</span>
                {isTargeted && <span className="badge badge--brand">🎯 Anycast Route</span>}
              </div>
              <div className="cdn-pop-details">
                <span>Latencia Edge: <strong>~{pop.edgeLatencyMs}ms</strong></span>
                <span>Objetos en Caché: <strong>{cachedEntries.length}</strong></span>
              </div>
              <div className="cdn-pop-entries">
                {cachedEntries.length === 0 ? (
                  <small className="cdn-empty-pop">Sin recursos cacheados aún</small>
                ) : (
                  cachedEntries.map((e, idx) => (
                    <div key={idx} className="cdn-entry-item">
                      <code>{e.url}</code>
                      <span className={`badge badge--${e.isFresh ? 'success' : 'warning'}`}>
                        {e.isFresh ? `HIT (${e.ageSec}s)` : 'STALE'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
      </div>

      {/* ── Panel de Emisión de Peticiones ── */}
      <div className="cdn-request-box">
        <div className="cdn-request-selectors">
          <div className="cdn-field">
            <label>📍 Ubicación del Cliente (Anycast Client):</label>
            <select
              className="cdn-select"
              value={selectedClientLoc}
              onChange={(e) => setSelectedClientLoc(e.target.value)}
            >
              {CLIENT_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} (Origen directo: ~{loc.directOriginLatencyMs}ms)
                </option>
              ))}
            </select>
          </div>

          <div className="cdn-field">
            <label>📦 Recurso / Asset Solicitado:</label>
            <select
              className="cdn-select"
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
            >
              {ASSET_PRESETS.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.label} ({asset.url})
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="btn-primary" onClick={handleSendRequest}>
            🚀 Enviar Petición HTTP
          </button>
        </div>

        {/* Info Cabeceras de este Asset */}
        <div className="cdn-asset-headers-info">
          <span>Cabecera Origen: <code>Cache-Control: {currentAsset.cacheControl}</code></span>
          {currentAsset.cacheTags.length > 0 && (
            <span>Tags: {currentAsset.cacheTags.map((t) => <code key={t} className="cdn-tag">{t}</code>)}</span>
          )}
        </div>
      </div>

      {/* ── Telemetría de la Respuesta ── */}
      {lastResponse && (
        <div className="cdn-telemetry-card">
          <div className="cdn-telemetry-head">
            <div className="cdn-status-group">
              <span className={`badge badge--${lastResponse.cacheStatus === CACHE_STATUS.HIT ? 'success' : lastResponse.cacheStatus === CACHE_STATUS.MISS ? 'warning' : 'neutral'}`}>
                CF-Cache-Status: {lastResponse.cacheStatus}
              </span>
              <span className="cdn-served-by">Atendido por: <strong>{lastResponse.servedBy}</strong></span>
            </div>

            <div className="cdn-latency-box">
              <span className="cdn-latency-label">Latencia Total</span>
              <strong className="cdn-latency-val">{lastResponse.latencyMs}ms</strong>
            </div>
          </div>

          {/* Gráfico de Aceleración */}
          <div className="cdn-perf-bar-wrapper">
            <div className="cdn-perf-labels">
              <span>Origen Directo: {lastResponse.originLatencyMs}ms</span>
              <span>Con CDN Edge: {lastResponse.latencyMs}ms</span>
              {lastResponse.latencySavedPercent > 0 && (
                <strong style={{ color: '#4ade80' }}>⚡ Aceleración: {lastResponse.latencySavedPercent}% más rápido</strong>
              )}
            </div>
            <div className="cdn-perf-bar-track">
              <div
                className="cdn-perf-bar-fill"
                style={{ width: `${Math.max(5, (lastResponse.latencyMs / (lastResponse.originLatencyMs + 20)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="cdn-response-body">
            <span className="cdn-body-label">Cuerpo de la Respuesta:</span>
            <pre className="cdn-code-preview">{lastResponse.body}</pre>
          </div>
        </div>
      )}

      {/* ── Centro de Purga de Caché ── */}
      <div className="cdn-purge-section">
        <div className="cdn-purge-head">
          <h4>🧹 Control de Invalidación y Purga Instantánea</h4>
          <button type="button" className="btn-secondary" onClick={handleReset}>
            🔄 Reiniciar Red CDN
          </button>
        </div>

        <div className="cdn-purge-controls">
          <div className="cdn-purge-group">
            <input
              type="text"
              className="cdn-input"
              value={tagToPurge}
              onChange={(e) => setTagToPurge(e.target.value)}
              placeholder="Ej. tag:products, tag:catalog"
            />
            <button type="button" className="btn-secondary" onClick={handlePurgeTag}>
              🗑️ Purgar por Cache-Tag
            </button>
          </div>

          <div className="cdn-purge-group">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handlePurgeUrl(currentAsset.url)}
            >
              🗑️ Purgar URL Actual ({currentAsset.url})
            </button>
          </div>
        </div>

        {purgeFeedback && <p className="cdn-purge-feedback">{purgeFeedback}</p>}
      </div>
    </section>
  )
}
