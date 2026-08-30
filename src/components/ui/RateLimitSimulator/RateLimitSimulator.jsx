/**
 * @fileoverview Componente RateLimitSimulator — Simulador interactivo de Rate Limiting y Token Bucket (Mejora 45).
 *
 * CARACTERÍSTICAS:
 * - Balde de tokens visual animado con nivel de llenado en tiempo real.
 * - Disparador de peticiones individuales, ráfagas y simulación de saturación DDoS.
 * - Inspección de cabeceras HTTP (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`).
 * - Registro de auditoría con código de estado HTTP 200 OK (Verde 🟢) vs HTTP 429 Too Many Requests (Rojo 🔴).
 *
 * @module components/ui/RateLimitSimulator
 */
import { useState, useEffect, useRef } from 'react'
import { TokenBucketLimiter } from '../../../utils/rateLimiter'
import './RateLimitSimulator.css'

function RateLimitSimulator() {
  const [capacity, setCapacity] = useState(10)
  const [refillRate, setRefillRate] = useState(2)
  const limiterRef = useRef(new TokenBucketLimiter(10, 2))

  const [metrics, setMetrics] = useState(limiterRef.current.getMetrics())
  const [logs, setLogs] = useState([])

  // Sincronizar cambios en capacidad o tasa
  useEffect(() => {
    limiterRef.current = new TokenBucketLimiter(capacity, refillRate)
    setMetrics(limiterRef.current.getMetrics())
  }, [capacity, refillRate])

  // Timer para actualizar en tiempo real el llenado del balde
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(limiterRef.current.getMetrics())
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const handleSendRequests = (count = 1) => {
    const newLogs = []
    for (let i = 0; i < count; i++) {
      const res = limiterRef.current.consume(1)
      newLogs.unshift({
        id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        endpoint: '/api/v1/auth/token',
        status: res.status,
        statusText: res.statusText,
        remaining: res.remaining,
        limit: res.limit,
        retryAfter: res.retryAfter,
        time: new Date().toLocaleTimeString(),
      })
    }
    setLogs((prev) => [...newLogs, ...prev].slice(0, 10))
    setMetrics(limiterRef.current.getMetrics())
  }

  const handleReset = () => {
    limiterRef.current.reset()
    setMetrics(limiterRef.current.getMetrics())
    setLogs([])
  }

  return (
    <section className="ratelimit-section" aria-label="Simulador de Rate Limiting">
      <div className="ratelimit-header">
        <div>
          <h2 className="ratelimit-title">🛡️ Simulador de Rate Limiting (Token Bucket)</h2>
          <p className="ratelimit-subtitle">
            Experimenta cómo los sistemas distribuidos mitigan ataques de fuerza bruta y saturan con HTTP 429.
          </p>
        </div>
      </div>

      <div className="ratelimit-container">
        {/* Panel Izquierdo: Visualización del Balde de Tokens */}
        <div className="ratelimit-visual-pane">
          <div className="bucket-card">
            <div className="bucket-gauge-container">
              <div className="bucket-rim" />
              <div className="bucket-body">
                <div
                  className={`bucket-water${metrics.tokens <= 1 ? ' bucket-water--depleted' : ''}`}
                  style={{ height: `${metrics.fillPercentage}%` }}
                />
                <div className="bucket-tokens-label">
                  <span className="bucket-tokens-val">{metrics.tokens}</span>
                  <small>/{metrics.capacity} tokens</small>
                </div>
              </div>
            </div>

            <div className="bucket-stats">
              <div className="bucket-stat-row">
                <span>Capacidad Total:</span>
                <strong>{metrics.capacity} tokens</strong>
              </div>
              <div className="bucket-stat-row">
                <span>Tasa de Recarga:</span>
                <strong>+{metrics.refillRate} tokens/seg</strong>
              </div>
              <div className="bucket-stat-row">
                <span>Nivel del Balde:</span>
                <strong style={{ color: metrics.fillPercentage > 25 ? '#10b981' : '#ef4444' }}>
                  {metrics.fillPercentage}%
                </strong>
              </div>
            </div>
          </div>

          {/* Sliders de Configuración */}
          <div className="bucket-controls">
            <div className="bucket-control-item">
              <label className="form-label" htmlFor="cap-range">
                Capacidad (Límite): {capacity} reqs
              </label>
              <input
                id="cap-range"
                type="range"
                min="5"
                max="25"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </div>

            <div className="bucket-control-item">
              <label className="form-label" htmlFor="refill-range">
                Recarga: {refillRate} tokens/s
              </label>
              <input
                id="refill-range"
                type="range"
                min="1"
                max="5"
                value={refillRate}
                onChange={(e) => setRefillRate(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Panel Derecho: Disparadores y Registro de Peticiones */}
        <div className="ratelimit-actions-pane">
          <div className="ratelimit-buttons-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleSendRequests(1)}
            >
              🎯 1 Petición
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleSendRequests(5)}
            >
              ⚡ Ráfaga (5 reqs)
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleSendRequests(12)}
              style={{ background: '#ef4444', borderColor: '#dc2626' }}
            >
              💥 Ráfaga Masiva (12 reqs)
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
              title="Reiniciar balde de tokens"
            >
              🔄
            </button>
          </div>

          {/* Registro de Auditoría */}
          <div className="ratelimit-logs-box">
            <div className="ratelimit-logs-header">
              <span className="ratelimit-logs-title">Registro de Respuestas de API</span>
              <span className="badge badge--brand">{logs.length} peticiones</span>
            </div>

            {logs.length === 0 ? (
              <div className="ratelimit-logs-empty">
                <span>📡 No hay peticiones registradas. Pulsa los botones superiores para disparar tráfico.</span>
              </div>
            ) : (
              <div className="ratelimit-logs-list">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`ratelimit-log-item${log.status === 429 ? ' ratelimit-log-item--blocked' : ''}`}
                  >
                    <div className="ratelimit-log-top">
                      <span className={`badge badge--${log.status === 200 ? 'success' : 'error'}`}>
                        HTTP {log.status} {log.statusText}
                      </span>
                      <code className="ratelimit-log-endpoint">{log.endpoint}</code>
                      <span className="ratelimit-log-time">{log.time}</span>
                    </div>

                    <div className="ratelimit-log-headers">
                      <span>X-RateLimit-Remaining: <strong>{log.remaining}</strong></span>
                      {log.retryAfter && (
                        <span className="ratelimit-retry-badge">
                          Retry-After: <strong>{log.retryAfter}s</strong>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default RateLimitSimulator
