/**
 * @fileoverview Componente PeriodicSyncSimulator — Simulador de Periodic Background Sync & Prefetching.
 *
 * Permite registrar tareas periódicas de sincronización en el Service Worker,
 * inspeccionar las rutas pre-cacheadas, alternar modos de conexión (Save-Data, 4G, 2G)
 * y observar la actualización proactiva de recursos en segundo plano.
 *
 * @module components/ui/PeriodicSyncSimulator
 */

import { useState } from 'react'
import {
  defaultPrefetchEngine,
  PREFETCH_MANIFEST,
  evaluatePrefetchEligibility,
} from '../../../utils/periodicPrefetchEngine'
import './PeriodicSyncSimulator.css'

export default function PeriodicSyncSimulator() {
  const [saveData, setSaveData] = useState(false)
  const [effectiveType, setEffectiveType] = useState('4g')
  const [minHours, setMinHours] = useState(12)
  const [isExecuting, setIsExecuting] = useState(false)
  const [history, setHistory] = useState(() => defaultPrefetchEngine.history)
  const [feedback, setFeedback] = useState(null)

  const currentEligibility = evaluatePrefetchEligibility({ saveData, effectiveType })

  const handleSimulateSync = async () => {
    setIsExecuting(true)
    setFeedback(null)

    const result = await defaultPrefetchEngine.executePeriodicSync(
      async () => true,
      { saveData, effectiveType }
    )

    setIsExecuting(false)
    setHistory([...defaultPrefetchEngine.history])

    if (!result.executed) {
      setFeedback({
        type: 'error',
        text: `Periodic Sync omitido: ${currentEligibility.reason}`,
      })
    } else {
      setFeedback({
        type: 'success',
        text: `Periodic Sync completado: ${result.fetchedCount} recursos actualizados proactivamente (~${(result.totalBytes / 1024).toFixed(1)} KB pre-cacheados).`,
      })
    }
  }

  const handleClearHistory = () => {
    defaultPrefetchEngine.history = []
    setHistory([])
    setFeedback({ type: 'info', text: 'Historial de prefetch limpiado.' })
  }

  return (
    <div className="periodic-sync-card" role="region" aria-label="Simulador de Periodic Background Sync">
      <div className="periodic-sync-card__header">
        <div className="periodic-sync-card__badge">⚡ Mejora 104</div>
        <h3 className="periodic-sync-card__title">Periodic Background Sync & Prefetching Inteligente</h3>
        <p className="periodic-sync-card__subtitle">
          Actualiza recursos documentales y assets estáticos en segundo plano cuando el dispositivo está en reposo, optimizando consumo de batería y datos móviles.
        </p>
      </div>

      {feedback && (
        <div className={`periodic-sync-feedback periodic-sync-feedback--${feedback.type}`} role="status">
          {feedback.text}
        </div>
      )}

      {/* Controles de Red y Simulación */}
      <div className="periodic-sync-config-grid">
        <div className="periodic-sync-config-item">
          <label htmlFor="periodic-interval-input">Intervalo Mínimo (Horas):</label>
          <input
            id="periodic-interval-input"
            type="number"
            min="1"
            max="72"
            className="periodic-sync-input"
            value={minHours}
            onChange={(e) => {
              const val = Number(e.target.value)
              setMinHours(val)
              defaultPrefetchEngine.minIntervalHours = val
            }}
          />
        </div>

        <div className="periodic-sync-config-item">
          <label htmlFor="periodic-type-select">Tipo de Conexión Simulada:</label>
          <select
            id="periodic-type-select"
            className="periodic-sync-select"
            value={effectiveType}
            onChange={(e) => setEffectiveType(e.target.value)}
          >
            <option value="4g">4G (Alta velocidad / Ilimitada)</option>
            <option value="3g">3G (Velocidad media)</option>
            <option value="2g">2G (Lenta - Prefetch bloqueado)</option>
            <option value="slow-2g">Slow-2G (Muy lenta - Bloqueado)</option>
          </select>
        </div>

        <div className="periodic-sync-config-item periodic-sync-config-item--toggle">
          <label className="periodic-sync-checkbox-label">
            <input
              type="checkbox"
              checked={saveData}
              onChange={(e) => setSaveData(e.target.checked)}
            />
            <span>Modo Save-Data Activo (Ahorro de Datos)</span>
          </label>
        </div>
      </div>

      {/* Banner de Diagnóstico de Red */}
      <div className={`periodic-sync-status-banner ${currentEligibility.allowed ? 'periodic-sync-status-banner--allowed' : 'periodic-sync-status-banner--blocked'}`}>
        <span className="periodic-sync-status-icon">{currentEligibility.allowed ? '🟢' : '🔴'}</span>
        <span className="periodic-sync-status-text">
          <strong>Diagnóstico:</strong> {currentEligibility.reason}
        </span>
      </div>

      {/* Barra de Acciones */}
      <div className="periodic-sync-actions">
        <button
          type="button"
          className="periodic-sync-btn periodic-sync-btn--primary"
          onClick={handleSimulateSync}
          disabled={isExecuting}
        >
          {isExecuting ? '⏳ Ejecutando Prefetch...' : '🔄 Disparar Periodic Background Sync'}
        </button>

        <button
          type="button"
          className="periodic-sync-btn periodic-sync-btn--secondary"
          onClick={handleClearHistory}
        >
          🧹 Limpiar Historial
        </button>
      </div>

      {/* Manifiesto de Prefetching */}
      <h4 className="periodic-sync-section-title">📦 Rutas Registradas para Prefetching Periódico</h4>
      <div className="periodic-sync-manifest-grid">
        {PREFETCH_MANIFEST.map((item) => (
          <div key={item.path} className="periodic-sync-manifest-item">
            <div className="periodic-sync-manifest-item__top">
              <code className="periodic-sync-path">{item.path}</code>
              <span className={`periodic-sync-prio periodic-sync-prio--${item.priority}`}>
                {item.priority}
              </span>
            </div>
            <div className="periodic-sync-manifest-item__bottom">
              <span>Categoría: {item.category}</span>
              <span>~{(item.estimatedBytes / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        ))}
      </div>

      {/* Historial de Sincronizaciones */}
      {history.length > 0 && (
        <div className="periodic-sync-history">
          <h4 className="periodic-sync-section-title">📋 Registro de Descargas en Background ({history.length})</h4>
          <ul className="periodic-sync-history-list">
            {history.slice(-6).reverse().map((entry, idx) => (
              <li key={idx} className={`periodic-sync-history-entry periodic-sync-history-entry--${entry.status}`}>
                <span>{entry.path}</span>
                <span>{new Date(entry.prefetchedAt).toLocaleTimeString()}</span>
                <span>{(entry.bytes / 1024).toFixed(1)} KB</span>
                <span className="periodic-sync-history-badge">{entry.status.toUpperCase()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
