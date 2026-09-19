/**
 * @fileoverview Componente OfflineSyncManager — Centro de Sincronización en Segundo Plano (Background Sync).
 *
 * Permite simular mutaciones offline, encolar peticiones pendientes, inspeccionar firmas criptográficas
 * anti-tampering y ejecutar reintentos automáticos mediante Background Sync API.
 *
 * @module components/ui/OfflineSyncManager
 */

import { useState } from 'react'
import {
  defaultSyncQueue,
  MUTATION_STATUS,
} from '../../../utils/offlineSyncQueue'
import './OfflineSyncManager.css'

// Cargar un par de elementos iniciales si la cola está vacía
if (defaultSyncQueue.queue.length === 0) {
  defaultSyncQueue.enqueue('/api/kanban/cards', 'POST', { id: 'c-1', column: 'done', title: 'Completar auditoría ISO 27001' })
  defaultSyncQueue.enqueue('/api/users/preferences', 'PUT', { theme: 'dark', reducedMotion: true })
}

export default function OfflineSyncManager() {
  const [endpoint, setEndpoint] = useState('/api/progress/mark-completed')
  const [method, setMethod] = useState('POST')
  const [payloadText, setPayloadText] = useState('{\n  "lessonId": "pwa-bg-sync-103",\n  "completed": true\n}')
  const [isProcessing, setIsProcessing] = useState(false)
  const [simulatedFailure, setSimulatedFailure] = useState(false)
  const [queueItems, setQueueItems] = useState(() => defaultSyncQueue.getAll())
  const [feedback, setFeedback] = useState(null)

  const refreshQueue = () => {
    setQueueItems(defaultSyncQueue.getAll())
  }

  const handleEnqueue = (e) => {
    e.preventDefault()
    let payload = {}
    try {
      payload = JSON.parse(payloadText)
    } catch {
      setFeedback({ type: 'error', text: 'El payload debe ser un JSON válido.' })
      return
    }

    const item = defaultSyncQueue.enqueue(endpoint, method, payload)
    setFeedback({ type: 'success', text: `Mutación [${item.id}] encolada con Idempotency Key: ${item.idempotencyKey.slice(0, 14)}...` })
    refreshQueue()
  }

  const handleProcessSync = async () => {
    setIsProcessing(true)
    setFeedback(null)

    const result = await defaultSyncQueue.processQueue(async () => {
      if (simulatedFailure) {
        throw new Error('Servidor temporalmente inalcanzable (503 Service Unavailable)')
      }
      return true
    })

    setIsProcessing(false)
    refreshQueue()

    if (result.failed > 0) {
      setFeedback({
        type: 'error',
        text: `Sincronización procesada: ${result.succeeded} exitosa(s), ${result.failed} fallida(s). Se reintentará en el próximo ciclo de Background Sync.`,
      })
    } else {
      setFeedback({
        type: 'success',
        text: `¡Todas las mutaciones (${result.succeeded}) fueron sincronizadas exitosamente con el backend!`,
      })
    }
  }

  const handleClearCompleted = () => {
    defaultSyncQueue.clearCompleted()
    refreshQueue()
    setFeedback({ type: 'info', text: 'Se han eliminado las mutaciones ya sincronizadas o fallidas.' })
  }

  const handleClearAll = () => {
    defaultSyncQueue.clearAll()
    refreshQueue()
    setFeedback({ type: 'info', text: 'Cola de sincronización vaciada.' })
  }

  const pendingCount = queueItems.filter((q) => q.status === MUTATION_STATUS.PENDING).length
  const syncedCount = queueItems.filter((q) => q.status === MUTATION_STATUS.SYNCED).length
  const failedCount = queueItems.filter((q) => q.status === MUTATION_STATUS.FAILED).length

  return (
    <div className="offline-sync-card" role="region" aria-label="Gestor de Background Sync y Mutaciones Offline">
      <div className="offline-sync-card__header">
        <div className="offline-sync-card__badge">⚡ Mejora 103</div>
        <h3 className="offline-sync-card__title">Gestor de Background Sync API & Mutaciones Offline</h3>
        <p className="offline-sync-card__subtitle">
          Encola acciones en modo offline con firmas criptográficas de integridad y reintentos exponenciales automáticos al volver online.
        </p>
      </div>

      {feedback && (
        <div className={`offline-sync-feedback offline-sync-feedback--${feedback.type}`} role="status">
          {feedback.text}
        </div>
      )}

      {/* Grid de Estado */}
      <div className="offline-sync-stats-grid">
        <div className="offline-sync-stat-item">
          <span className="offline-sync-stat-item__label">Pendientes</span>
          <span className="offline-sync-stat-item__value" style={{ color: '#fbbf24' }}>{pendingCount}</span>
        </div>
        <div className="offline-sync-stat-item">
          <span className="offline-sync-stat-item__label">Sincronizadas</span>
          <span className="offline-sync-stat-item__value" style={{ color: '#34d399' }}>{syncedCount}</span>
        </div>
        <div className="offline-sync-stat-item">
          <span className="offline-sync-stat-item__label">Fallidas</span>
          <span className="offline-sync-stat-item__value" style={{ color: '#f87171' }}>{failedCount}</span>
        </div>
        <div className="offline-sync-stat-item">
          <span className="offline-sync-stat-item__label">Total en Cola</span>
          <span className="offline-sync-stat-item__value">{queueItems.length}</span>
        </div>
      </div>

      {/* Formulario para encolar mutaciones */}
      <form className="offline-sync-form" onSubmit={handleEnqueue}>
        <div className="offline-sync-form__row">
          <div className="offline-sync-form__group" style={{ flex: 1 }}>
            <label htmlFor="sync-method-select">Método:</label>
            <select
              id="sync-method-select"
              className="offline-sync-select"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="offline-sync-form__group" style={{ flex: 3 }}>
            <label htmlFor="sync-endpoint-input">Endpoint de la Mutación:</label>
            <input
              id="sync-endpoint-input"
              type="text"
              className="offline-sync-input"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="offline-sync-form__group">
          <label htmlFor="sync-payload-textarea">Payload JSON (con protección anti-tampering):</label>
          <textarea
            id="sync-payload-textarea"
            className="offline-sync-textarea"
            rows={3}
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
          />
        </div>

        <div className="offline-sync-form__actions">
          <button type="submit" className="offline-sync-btn offline-sync-btn--primary">
            📥 Encolar Mutación Offline
          </button>

          <label className="offline-sync-checkbox-label">
            <input
              type="checkbox"
              checked={simulatedFailure}
              onChange={(e) => setSimulatedFailure(e.target.checked)}
            />
            Simular Fallo de Servidor (503)
          </label>
        </div>
      </form>

      {/* Botones de Procesamiento y Limpieza */}
      <div className="offline-sync-control-bar">
        <button
          type="button"
          className="offline-sync-btn offline-sync-btn--sync"
          onClick={handleProcessSync}
          disabled={isProcessing || pendingCount === 0}
        >
          {isProcessing ? '🔄 Sincronizando...' : `🚀 Ejecutar Background Sync (${pendingCount} pendientes)`}
        </button>
        <button type="button" className="offline-sync-btn offline-sync-btn--secondary" onClick={handleClearCompleted}>
          🧹 Limpiar Sincronizados
        </button>
        <button type="button" className="offline-sync-btn offline-sync-btn--danger" onClick={handleClearAll}>
          🗑️ Vaciar Cola
        </button>
      </div>

      {/* Lista de Mutaciones */}
      <div className="offline-sync-list">
        {queueItems.length === 0 ? (
          <p className="offline-sync-empty">No hay mutaciones encoladas actualmente.</p>
        ) : (
          queueItems.map((item) => (
            <div key={item.id} className={`offline-sync-item offline-sync-item--${item.status.toLowerCase()}`}>
              <div className="offline-sync-item__header">
                <span className="offline-sync-item__method">{item.method}</span>
                <span className="offline-sync-item__endpoint">{item.endpoint}</span>
                <span className={`offline-sync-badge offline-sync-badge--${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </div>
              <div className="offline-sync-item__meta">
                <span><strong>ID:</strong> {item.id}</span>
                <span><strong>Idempotency:</strong> {item.idempotencyKey.slice(0, 16)}...</span>
                <span><strong>Firma:</strong> <code className="offline-sync-sig">{item.signature}</code></span>
                <span><strong>Intentos:</strong> {item.attempts}/{item.maxAttempts}</span>
              </div>
              {item.error && (
                <div className="offline-sync-item__error">⚠️ {item.error}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
