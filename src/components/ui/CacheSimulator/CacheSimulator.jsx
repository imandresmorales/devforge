/**
 * @fileoverview Componente CacheSimulator — Simulador de memoria caché distribuida con políticas LRU, LFU, FIFO y TTL (Mejora 55).
 *
 * CARACTERÍSTICAS:
 * - Visualización gráfica de slots de memoria y barras dinámicas de tiempo de vida (TTL).
 * - Selector interactivo de políticas de desalojo (LRU, LFU, FIFO) y capacidad de memoria.
 * - Operaciones GET (Lectura con animación de HIT/MISS) y SET (Escritura con TTL).
 * - Simulador de carga de tráfico sintético con distribución Zipf/Pareto (80/20).
 * - Tablero de KPIs de rendimiento en tiempo real (Hit Ratio, Hits, Misses, Desalojos).
 * - Guía de patrones de diseño de sistemas (Cache-Aside, Write-Through, prevención de Cache Stampede).
 *
 * @module components/ui/CacheSimulator
 */
import { useState, useEffect, useRef } from 'react'
import {
  DistributedCacheSimulator,
  CACHE_POLICIES,
  DEFAULT_CACHE_PRESETS,
} from '../../../utils/cacheEngine'
import { useToast } from '../../../context/ToastContext'
import './CacheSimulator.css'

function CacheSimulator() {
  const { addToast } = useToast()

  // Referencia al motor de caché en memoria
  const cacheRef = useRef(new DistributedCacheSimulator({ capacity: 5, policy: 'LRU' }))

  // Estados locales reactivos
  const [policy, setPolicy] = useState('LRU')
  const [capacity, setCapacity] = useState(5)
  const [stats, setStats] = useState(cacheRef.current.getStats())
  const [entries, setEntries] = useState([])
  const [eventLogs, setEventLogs] = useState([])

  // Formularios interactivos
  const [getKeyInput, setGetKeyInput] = useState('user:session:1001')
  const [setKeyInput, setSetKeyInput] = useState('api:jwt:token_xyz')
  const [setValueInput, setSetValueInput] = useState('{"sub":"usr_882","role":"editor"}')
  const [setTtlSeconds, setSetTtlSeconds] = useState(15)
  const [lastOpResult, setLastOpResult] = useState(null) // { type: 'HIT'|'MISS'|'SET'|'EVICT', message: string }

  // Cargar datos iniciales
  const syncState = () => {
    setStats(cacheRef.current.getStats())
    setEntries(cacheRef.current.getEntries())
    setEventLogs([...cacheRef.current.eventLogs])
  }

  // Inicialización
  useEffect(() => {
    DEFAULT_CACHE_PRESETS.forEach((item) => {
      cacheRef.current.set(item.key, item.value, { ttlMs: item.ttlMs })
    })
    syncState()
  }, [])

  // Timer para refrescar barras de TTL en tiempo real cada 500ms
  useEffect(() => {
    const timer = setInterval(() => {
      setEntries(cacheRef.current.getEntries())
      setStats(cacheRef.current.getStats())
    }, 500)
    return () => clearInterval(timer)
  }, [])

  // Cambio de política
  const handlePolicyChange = (newPolicy) => {
    setPolicy(newPolicy)
    cacheRef.current.setPolicy(newPolicy)
    syncState()
    addToast({
      type: 'info',
      title: 'Política Actualizada',
      message: `Estrategia de desalojo cambiada a ${CACHE_POLICIES[newPolicy]}.`,
    })
  }

  // Cambio de capacidad
  const handleCapacityChange = (newCap) => {
    const capNum = Number(newCap)
    setCapacity(capNum)
    cacheRef.current.setCapacity(capNum)
    syncState()
  }

  // Operación GET (Lectura)
  const handleGet = (keyToFetch) => {
    const key = keyToFetch || getKeyInput
    if (!key.trim()) return

    const result = cacheRef.current.get(key.trim())
    if (result !== null) {
      setLastOpResult({
        type: 'HIT',
        message: `HIT 🟢 Clave "${key}" encontrada en memoria caché. Latencia: ~0.2ms.`,
      })
      addToast({
        type: 'success',
        title: 'Cache HIT',
        message: `Clave "${key}" leída desde memoria ultrarrápida.`,
      })
    } else {
      setLastOpResult({
        type: 'MISS',
        message: `MISS 🔴 Clave "${key}" no encontrada o expirada. Simulando lectura de Base de Datos (~85ms).`,
      })
      addToast({
        type: 'warning',
        title: 'Cache MISS',
        message: `Clave "${key}" no estaba en caché. Consultando Base de Datos.`,
      })
    }
    syncState()
  }

  // Operación SET (Escritura)
  const handleSet = (e) => {
    e?.preventDefault()
    if (!setKeyInput.trim()) return

    const ttlMs = setTtlSeconds > 0 ? setTtlSeconds * 1000 : undefined
    const { evictedKey } = cacheRef.current.set(setKeyInput.trim(), setValueInput.trim(), { ttlMs })

    if (evictedKey) {
      setLastOpResult({
        type: 'EVICT',
        message: `SET ⚡ Elemento guardado. Capacidad superada: desalojada clave "${evictedKey}" por política ${policy}.`,
      })
      addToast({
        type: 'info',
        title: 'Evicción de Memoria',
        message: `Se desalojó "${evictedKey}" para dar espacio al nuevo elemento.`,
      })
    } else {
      setLastOpResult({
        type: 'SET',
        message: `SET ⚡ Clave "${setKeyInput}" almacenada exitosamente (${ttlMs ? `${setTtlSeconds}s TTL` : 'Sin expiración'}).`,
      })
      addToast({
        type: 'success',
        title: 'Elemento Almacenado',
        message: `Clave "${setKeyInput}" guardada en la caché.`,
      })
    }

    syncState()
  }

  // Eliminar clave específica
  const handleDeleteKey = (key) => {
    cacheRef.current.delete(key)
    syncState()
    addToast({
      type: 'info',
      title: 'Clave Invalidada',
      message: `Clave "${key}" purgada de la memoria.`,
    })
  }

  // Vaciar caché completa
  const handleClear = () => {
    cacheRef.current.clear(true)
    setLastOpResult({
      type: 'PURGE',
      message: 'PURGE 🧹 Memoria caché purgada y contadores reiniciados a cero.',
    })
    syncState()
    addToast({
      type: 'info',
      title: 'Memoria Purgada',
      message: 'Todos los slots han sido liberados.',
    })
  }

  // Cargar presets
  const handleLoadPresets = () => {
    cacheRef.current.clear(false)
    DEFAULT_CACHE_PRESETS.forEach((item) => {
      cacheRef.current.set(item.key, item.value, { ttlMs: item.ttlMs })
    })
    syncState()
    addToast({
      type: 'success',
      title: 'Datos de Ejemplo Cargados',
      message: 'Se cargaron 4 registros con TTL escalonado.',
    })
  }

  // Simular ráfaga de tráfico Zipf
  const handleSimulateWorkload = () => {
    const results = cacheRef.current.simulateWorkload(15)
    const hitCount = results.filter((r) => r.result === 'HIT').length
    setLastOpResult({
      type: 'TRAFFIC',
      message: `Ráfaga completada: 15 solicitudes ejecutadas con distribución Pareto 80/20 (${hitCount} HITS, ${15 - hitCount} MISSES poblados).`,
    })
    syncState()
    addToast({
      type: 'success',
      title: 'Ráfaga de Tráfico Simulada',
      message: `15 peticiones concurrentes procesadas. Hit Ratio: ${cacheRef.current.getStats().hitRatio}%.`,
    })
  }

  return (
    <section className="cache-simulator-section" aria-label="Simulador de Memoria Caché Distribuida">
      {/* ── Encabezado ── */}
      <div className="cache-simulator-header">
        <div>
          <div className="cache-badge-wrapper">
            <span className="badge badge--brand">⚡ Alta Concurrencia & Rendimiento</span>
            <span className="badge badge--success">Redis / In-Memory</span>
          </div>
          <h2 className="cache-simulator-title">
            Simulador de Memoria Caché Distribuida (LRU / LFU / TTL)
          </h2>
          <p className="cache-simulator-subtitle">
            Simula el comportamiento de un clúster de caché en memoria, experimenta con algoritmos de desalojo por capacidad finita y observa la expiración reactiva por TTL.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="cache-header-actions">
          <button
            type="button"
            className="btn-secondary cache-btn-preset"
            onClick={handleLoadPresets}
          >
            🔄 Cargar Presets
          </button>
          <button
            type="button"
            className="btn-secondary cache-btn-traffic"
            onClick={handleSimulateWorkload}
          >
            🚀 Simular Tráfico (15 req)
          </button>
          <button
            type="button"
            className="btn-danger cache-btn-clear"
            onClick={handleClear}
          >
            🧹 Vaciar Caché
          </button>
        </div>
      </div>

      {/* ── Barra de Métricas y KPIs ── */}
      <div className="cache-kpi-grid">
        <div className="cache-kpi-card cache-kpi-card--brand">
          <span className="cache-kpi-label">Hit Ratio Global</span>
          <div className="cache-kpi-val-row">
            <span className="cache-kpi-value">{stats.hitRatio}%</span>
            <span className={`cache-kpi-grade ${stats.hitRatio >= 70 ? 'cache-kpi-grade--good' : stats.hitRatio >= 40 ? 'cache-kpi-grade--avg' : 'cache-kpi-grade--low'}`}>
              {stats.hitRatio >= 70 ? 'Excelente' : stats.hitRatio >= 40 ? 'Moderado' : 'Bajo'}
            </span>
          </div>
          <div className="cache-kpi-bar-track">
            <div
              className="cache-kpi-bar-fill"
              style={{ width: `${Math.min(100, stats.hitRatio)}%` }}
            />
          </div>
        </div>

        <div className="cache-kpi-card">
          <span className="cache-kpi-label">Cache Hits (Aciertos)</span>
          <span className="cache-kpi-value text-success">{stats.hits}</span>
          <span className="cache-kpi-sub">Lecturas en memoria (~0.2ms)</span>
        </div>

        <div className="cache-kpi-card">
          <span className="cache-kpi-label">Cache Misses (Fallos)</span>
          <span className="cache-kpi-value text-warning">{stats.misses}</span>
          <span className="cache-kpi-sub">Lecturas a BD / Fallback (~85ms)</span>
        </div>

        <div className="cache-kpi-card">
          <span className="cache-kpi-label">Desalojos (Evictions)</span>
          <span className="cache-kpi-value text-danger">{stats.evictions}</span>
          <span className="cache-kpi-sub">Expulsados por capacidad</span>
        </div>

        <div className="cache-kpi-card">
          <span className="cache-kpi-label">Slots Ocupados</span>
          <span className="cache-kpi-value">{stats.size} / {capacity}</span>
          <span className="cache-kpi-sub">{stats.memoryUsagePercent}% capacidad usada</span>
        </div>
      </div>

      {/* ── Banner de Última Operación ── */}
      {lastOpResult && (
        <div className={`cache-op-banner cache-op-banner--${lastOpResult.type.toLowerCase()}`} role="status">
          <span>{lastOpResult.message}</span>
        </div>
      )}

      {/* ── Configuración y Formularios ── */}
      <div className="cache-controls-grid">
        {/* Panel de Configuración de Motor */}
        <div className="cache-card">
          <h3 className="cache-card-title">⚙️ Parámetros del Motor</h3>
          <div className="cache-form-group">
            <label htmlFor="cache-policy-select" className="cache-label">Política de Desalojo (Eviction Policy):</label>
            <select
              id="cache-policy-select"
              className="cache-select"
              value={policy}
              onChange={(e) => handlePolicyChange(e.target.value)}
            >
              <option value="LRU">LRU (Least Recently Used) — Más Popular</option>
              <option value="LFU">LFU (Least Frequently Used) — Por Frecuencia</option>
              <option value="FIFO">FIFO (First In, First Out) — Orden de llegada</option>
            </select>
          </div>

          <div className="cache-form-group">
            <div className="cache-slider-header">
              <label htmlFor="cache-capacity-slider" className="cache-label">Capacidad de Memoria:</label>
              <span className="cache-slider-val">{capacity} slots</span>
            </div>
            <input
              id="cache-capacity-slider"
              type="range"
              min={2}
              max={8}
              value={capacity}
              onChange={(e) => handleCapacityChange(e.target.value)}
              className="cache-slider"
            />
          </div>
        </div>

        {/* Panel GET (Lectura) */}
        <div className="cache-card">
          <h3 className="cache-card-title">🔍 Consulta GET (Simular Lectura)</h3>
          <div className="cache-get-row">
            <input
              type="text"
              className="cache-input"
              value={getKeyInput}
              onChange={(e) => setGetKeyInput(e.target.value)}
              placeholder="ej. user:session:1001"
            />
            <button
              type="button"
              className="btn-primary cache-btn-get"
              onClick={() => handleGet()}
            >
              GET Key
            </button>
          </div>
          <div className="cache-quick-keys">
            <span className="cache-quick-label">Atajos:</span>
            {entries.slice(0, 3).map((e) => (
              <button
                key={e.key}
                type="button"
                className="cache-quick-btn"
                onClick={() => {
                  setGetKeyInput(e.key)
                  handleGet(e.key)
                }}
              >
                {e.key}
              </button>
            ))}
          </div>
        </div>

        {/* Panel SET (Escritura) */}
        <div className="cache-card cache-card--wide">
          <h3 className="cache-card-title">💾 Escritura SET (Insertar / Actualizar)</h3>
          <form onSubmit={handleSet} className="cache-set-form">
            <div className="cache-set-row">
              <div className="cache-form-group">
                <label className="cache-label">Clave (Key):</label>
                <input
                  type="text"
                  className="cache-input"
                  value={setKeyInput}
                  onChange={(e) => setSetKeyInput(e.target.value)}
                  placeholder="ej. product:sku:990"
                  required
                />
              </div>

              <div className="cache-form-group">
                <label className="cache-label">TTL en Segundos (0 = infinito):</label>
                <input
                  type="number"
                  min={0}
                  max={300}
                  className="cache-input"
                  value={setTtlSeconds}
                  onChange={(e) => setSetTtlSeconds(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="cache-form-group">
              <label className="cache-label">Valor (Payload / JSON):</label>
              <input
                type="text"
                className="cache-input"
                value={setValueInput}
                onChange={(e) => setSetValueInput(e.target.value)}
                placeholder='{"status":"ok"}'
                required
              />
            </div>

            <button type="submit" className="btn-primary cache-btn-submit-set">
              ➕ Guardar en Caché (SET)
            </button>
          </form>
        </div>
      </div>

      {/* ── Visualizador de Slots de Memoria en Vivo ── */}
      <div className="cache-slots-card">
        <div className="cache-slots-header">
          <h3 className="cache-slots-title">
            🧠 Mapa Visual de Memoria ({entries.length} de {capacity} slots ocupados)
          </h3>
          <span className="cache-slots-policy-badge">Política activa: {policy}</span>
        </div>

        <div className="cache-slots-grid">
          {entries.map((item) => {
            const ttlPercent = item.ttlMs && item.remainingTtlMs !== null
              ? Math.max(0, Math.min(100, (item.remainingTtlMs / item.ttlMs) * 100))
              : 100

            return (
              <div key={item.key} className="cache-slot-item">
                <div className="cache-slot-top">
                  <span className="cache-slot-key" title={item.key}>{item.key}</span>
                  <button
                    type="button"
                    className="cache-slot-del-btn"
                    onClick={() => handleDeleteKey(item.key)}
                    title="Invalidar clave"
                  >
                    ✕
                  </button>
                </div>

                <div className="cache-slot-val-box">
                  <code>{typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}</code>
                </div>

                <div className="cache-slot-meta">
                  <span className="cache-slot-freq">🔥 {item.frequency} hits</span>
                  <span className="cache-slot-ttl">
                    {item.remainingTtlMs !== null
                      ? `⏳ ${(item.remainingTtlMs / 1000).toFixed(1)}s`
                      : '♾️ Sin TTL'}
                  </span>
                </div>

                {item.ttlMs && (
                  <div className="cache-ttl-bar-track">
                    <div
                      className={`cache-ttl-bar-fill ${ttlPercent < 25 ? 'cache-ttl-bar-fill--danger' : ttlPercent < 50 ? 'cache-ttl-bar-fill--warning' : ''}`}
                      style={{ width: `${ttlPercent}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {/* Slots Vacíos */}
          {Array.from({ length: Math.max(0, capacity - entries.length) }).map((_, idx) => (
            <div key={`empty-${idx}`} className="cache-slot-item cache-slot-item--empty">
              <span className="cache-slot-empty-label">Slot {entries.length + idx + 1} Libre</span>
              <span className="cache-slot-empty-desc">Memoria disponible</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Guía de Diseño de Sistemas y Arquitectura ── */}
      <div className="cache-guide-card">
        <h3 className="cache-guide-title">📚 Patrones de Arquitectura de Caché en Microservicios</h3>
        <div className="cache-guide-grid">
          <div className="cache-guide-item">
            <strong>1. Cache-Aside (Lazy Loading):</strong>
            <p>La aplicación consulta primero la caché. Si ocurre un Miss, consulta la BD, guarda el resultado en caché con un TTL y responde al cliente.</p>
          </div>
          <div className="cache-guide-item">
            <strong>2. Mitigación de Cache Stampede:</strong>
            <p>Cuando una clave de alto tráfico expira, miles de peticiones golpean la base de datos simultáneamente. Se mitiga mediante <em>Probabilistic Early Expiration (X-Fetch)</em> o locks distribuidos (Redlock).</p>
          </div>
          <div className="cache-guide-item">
            <strong>3. Write-Through vs Write-Back:</strong>
            <p><strong>Write-Through:</strong> Escribe en caché y BD a la vez (consistencia alta). <strong>Write-Back:</strong> Escribe en caché inmediatamente y asíncronamente en BD (máxima velocidad).</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CacheSimulator
