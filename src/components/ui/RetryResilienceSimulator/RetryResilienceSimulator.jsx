/**
 * @fileoverview Componente UI para el Simulador de Resiliencia con Retry Pattern, Backoff y Jitter (Mejora 81).
 *
 * Muestra:
 * - Selección de algoritmo de Backoff (Fijo, Lineal, Exponencial) y estrategia de Jitter (Ninguno, Full, Equal, Decorrelated).
 * - Gráfico comparativo de dispersión de tráfico (Mitigación de Thundering Herd).
 * - Simulador interactivo de microservicio con inyección de fallas (503 Service Unavailable, Rate Limit 429, 401 Unauthorized, Network Timeout).
 * - Bitácora de reintentos en tiempo real con tiempos de espera y análisis de resiliencia.
 *
 * @module components/ui/RetryResilienceSimulator/RetryResilienceSimulator
 */
import { useState, useMemo } from 'react'
import {
  calculateRetryDelay,
  executeWithRetry,
  JITTER_STRATEGIES,
  BACKOFF_TYPES,
} from '../../../utils/retryEngine'
import './RetryResilienceSimulator.css'

const ERROR_SCENARIOS = [
  {
    id: 'transient_503',
    label: '503 Service Unavailable (Falla Transitoria)',
    desc: 'El servicio aguas arriba se satura temporalmente y se recupera tras 2 intentos.',
    failsUntilAttempt: 2,
    status: 503,
    errorMsg: '503 Service Unavailable: upstream overloaded',
  },
  {
    id: 'rate_limit_429',
    label: '429 Too Many Requests (Rate Limit)',
    desc: 'Se excede la cuota momentánea y se normaliza tras el backoff.',
    failsUntilAttempt: 1,
    status: 429,
    errorMsg: '429 Too Many Requests: quota exceeded, retry after backoff',
  },
  {
    id: 'network_timeout',
    label: 'Network Timeout (Latencia Extrema)',
    desc: 'Pérdida de paquetes transitoria que resuelve al reintentar.',
    failsUntilAttempt: 2,
    status: 504,
    errorMsg: '504 Gateway Timeout: connection lost',
  },
  {
    id: 'permanent_401',
    label: '401 Unauthorized (Error Permanente No Reintentable)',
    desc: 'Fallo de autenticación definitivo que debe abortar inmediatamente sin reintentos inútiles.',
    failsUntilAttempt: 99,
    status: 401,
    errorMsg: '401 Unauthorized: token expired or invalid',
  },
]

export default function RetryResilienceSimulator() {
  const [backoffType, setBackoffType] = useState(BACKOFF_TYPES.EXPONENTIAL)
  const [jitter, setJitter] = useState(JITTER_STRATEGIES.FULL)
  const [baseDelay, setBaseDelay] = useState(200)
  const [maxDelay, setMaxDelay] = useState(4000)
  const [factor, setFactor] = useState(2)
  const [maxRetries, setMaxRetries] = useState(4)
  const [selectedScenario, setSelectedScenario] = useState('transient_503')

  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState([])
  const [lastResult, setLastResult] = useState(null)

  // Gráfico de simulación de 10 clientes concurrentes (Thundering Herd visualization)
  const concurrentSimulations = useMemo(() => {
    const clients = []
    for (let c = 1; c <= 8; c++) {
      const attempts = []
      let prev = 0
      for (let att = 0; att <= 4; att++) {
        const delay = calculateRetryDelay(att, {
          backoffType,
          baseDelay,
          maxDelay,
          factor,
          jitter,
          prevDelay: prev,
        })
        prev = delay
        attempts.push(delay)
      }
      clients.push({ id: `Client ${c}`, delays: attempts })
    }
    return clients
  }, [backoffType, baseDelay, maxDelay, factor, jitter])

  const activeScenario = ERROR_SCENARIOS.find((s) => s.id === selectedScenario) || ERROR_SCENARIOS[0]

  const handleRunSimulation = async () => {
    setIsRunning(true)
    setLogs([])
    setLastResult(null)

    let currentAttemptCounter = 0

    const mockService = async (attempt) => {
      currentAttemptCounter++
      // Simular latencia de red de 50ms
      await new Promise((r) => setTimeout(r, 50))

      if (attempt < activeScenario.failsUntilAttempt) {
        const err = new Error(activeScenario.errorMsg)
        err.status = activeScenario.status
        throw err
      }

      return {
        status: 200,
        message: '200 OK — Payload procesado con éxito por el microservicio.',
        data: { transactionId: `tx_${Math.random().toString(36).substring(2, 9)}` },
      }
    }

    try {
      const result = await executeWithRetry(mockService, {
        maxRetries,
        baseDelay,
        maxDelay,
        factor,
        backoffType,
        jitter,
        onRetry: (attemptNum, delayMs, err) => {
          setLogs((prev) => [
            ...prev,
            {
              time: new Date().toLocaleTimeString(),
              attempt: attemptNum,
              type: 'RETRY',
              message: `Intento #${attemptNum} falló (${err.status || err.message}). Esperando ${delayMs}ms con Jitter...`,
              delay: delayMs,
            },
          ])
        },
      })

      setLastResult({ success: true, ...result })
      setLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          attempt: result.attempts,
          type: 'SUCCESS',
          message: `✅ Petición exitosa en el intento #${result.attempts} (Tiempo total de backoff: ${result.totalDelay}ms)`,
        },
      ])
    } catch (err) {
      setLastResult({ success: false, error: err })
      setLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          attempt: err.attempts || currentAttemptCounter,
          type: 'FAILED',
          message: `🚫 Solicitud abortada: ${err.message} (${err.isRetryable ? 'Agotó los reintentos permitidos' : 'Error no reintentable'})`,
        },
      ])
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <section className="retry-resilience-simulator" aria-labelledby="rrs-title">
      {/* ── Header ── */}
      <div className="rrs-header">
        <div>
          <span className="badge badge--brand">Resiliencia & Sistemas Distribuidos</span>
          <h2 id="rrs-title" className="rrs-title">
            Motor de Resiliencia: Retry Pattern con Backoff & Jitter
          </h2>
          <p className="rrs-desc">
            Evita caídas en cascada y el fenómeno <strong>Thundering Herd</strong> distribuyendo los reintentos
            con aleatoriedad controlada y exponencial.
          </p>
        </div>
      </div>

      {/* ── Panel de Configuración de Resiliencia ── */}
      <div className="rrs-config-grid">
        {/* Selector de Backoff */}
        <div className="rrs-config-card">
          <label className="rrs-config-label">Tipo de Backoff:</label>
          <div className="rrs-btn-group">
            {Object.values(BACKOFF_TYPES).map((bt) => (
              <button
                key={bt}
                type="button"
                className={`btn-xs ${backoffType === bt ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setBackoffType(bt)}
              >
                {bt}
              </button>
            ))}
          </div>
          <small className="rrs-config-hint">
            {backoffType === BACKOFF_TYPES.EXPONENTIAL && 'Progresión exponencial: base * 2^intento'}
            {backoffType === BACKOFF_TYPES.LINEAR && 'Progresión lineal: base * intento'}
            {backoffType === BACKOFF_TYPES.FIXED && 'Intervalo constante entre reintentos'}
          </small>
        </div>

        {/* Selector de Jitter */}
        <div className="rrs-config-card">
          <label className="rrs-config-label">Estrategia de Jitter (AWS SRE):</label>
          <div className="rrs-btn-group">
            {Object.values(JITTER_STRATEGIES).map((jt) => (
              <button
                key={jt}
                type="button"
                className={`btn-xs ${jitter === jt ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setJitter(jt)}
              >
                {jt}
              </button>
            ))}
          </div>
          <small className="rrs-config-hint">
            {jitter === JITTER_STRATEGIES.FULL && 'Full Jitter: random(0, delay) — Máxima dispersión de tráfico'}
            {jitter === JITTER_STRATEGIES.EQUAL && 'Equal Jitter: delay/2 + random(0, delay/2) — Rango acotado'}
            {jitter === JITTER_STRATEGIES.DECORRELATED && 'Decorrelated: random(base, prev * 3) — Auto-adaptativo'}
            {jitter === JITTER_STRATEGIES.NONE && 'Sin Jitter: provoca picos sincronizados (Thundering Herd)'}
          </small>
        </div>

        {/* Sliders de Parámetros */}
        <div className="rrs-config-card">
          <div className="rrs-slider-row">
            <span>Base Delay: <strong>{baseDelay}ms</strong></span>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={baseDelay}
              onChange={(e) => setBaseDelay(Number(e.target.value))}
              className="rrs-slider"
            />
          </div>
          <div className="rrs-slider-row">
            <span>Max Delay (Cap): <strong>{maxDelay}ms</strong></span>
            <input
              type="range"
              min="1000"
              max="8000"
              step="500"
              value={maxDelay}
              onChange={(e) => setMaxDelay(Number(e.target.value))}
              className="rrs-slider"
            />
          </div>
        </div>
      </div>

      {/* ── Visualizador de Dispersión de Clientes Concurrente ── */}
      <div className="rrs-herd-card">
        <div className="rrs-herd-head">
          <span className="rrs-meta-title">📊 Simulación de 8 Clientes Concurrentes (Dispersión de Reintentos)</span>
          <span className="badge badge--neutral">
            {jitter === JITTER_STRATEGIES.NONE ? '⚠️ Alto Riesgo de Thundering Herd' : '🛡️ Tráfico Desincronizado'}
          </span>
        </div>
        <div className="rrs-clients-chart">
          {concurrentSimulations.map((client) => (
            <div key={client.id} className="rrs-client-row">
              <span className="rrs-client-name">{client.id}</span>
              <div className="rrs-timeline">
                {client.delays.map((d, i) => (
                  <div
                    key={i}
                    className="rrs-retry-point"
                    style={{ left: `${Math.min(95, (d / maxDelay) * 100)}%` }}
                    title={`Intento ${i + 1}: ${d}ms`}
                  >
                    <span>{d}ms</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Simulador de Petición HTTP con Inyección de Fallas ── */}
      <div className="rrs-simulator-box">
        <div className="rrs-sim-head">
          <div>
            <h4>🧪 Inyector de Fallos y Pruebas en Vivo</h4>
            <p className="rrs-sim-desc">Selecciona un escenario de error para comprobar cómo responde el motor.</p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={handleRunSimulation}
            disabled={isRunning}
          >
            {isRunning ? '⏳ Reintentando...' : '🚀 Disparar Petición con Retry'}
          </button>
        </div>

        <div className="rrs-scenarios-grid">
          {ERROR_SCENARIOS.map((sc) => (
            <div
              key={sc.id}
              className={`rrs-scenario-card ${selectedScenario === sc.id ? 'rrs-scenario-card--active' : ''}`}
              onClick={() => setSelectedScenario(sc.id)}
            >
              <div className="rrs-scenario-top">
                <span className="rrs-scenario-name">{sc.label}</span>
                <span className={`badge badge--${sc.status >= 500 || sc.status === 429 ? 'warning' : 'danger'}`}>
                  HTTP {sc.status}
                </span>
              </div>
              <p className="rrs-scenario-desc">{sc.desc}</p>
            </div>
          ))}
        </div>

        {/* Registro de Ejecución en Vivo */}
        {logs.length > 0 && (
          <div className="rrs-log-container">
            <h5 className="rrs-log-title">Consola de Ejecución en Tiempo Real</h5>
            <div className="rrs-log-list">
              {logs.map((log, idx) => (
                <div key={idx} className={`rrs-log-entry rrs-log-entry--${log.type.toLowerCase()}`}>
                  <span className="rrs-log-time">[{log.time}]</span>
                  <span className="rrs-log-text">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
