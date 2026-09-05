/**
 * @fileoverview Componente LoadBalancerSimulator — Simulador de algoritmos de balanceo de carga y alta disponibilidad (Mejora 57).
 *
 * CARACTERÍSTICAS:
 * - Soporte interactivo para Round Robin, Weighted Round Robin, Least Connections e IP Hash (Sticky Sessions).
 * - Control dinámico de Health Checks: Botones de failover para simular caídas y recuperaciones de nodos en caliente.
 * - Despachador de peticiones individuales y ráfagas concurrentes de tráfico.
 * - Tablero de monitoreo con latencias, conexiones activas y porcentaje de distribución de carga.
 *
 * @module components/ui/LoadBalancerSimulator
 */
import { useState, useRef, useEffect } from 'react'
import {
  LoadBalancerSimulator,
  LOAD_BALANCING_ALGORITHMS,
} from '../../../utils/loadBalancer'
import { useToast } from '../../../context/ToastContext'
import './LoadBalancerSimulator.css'

function LoadBalancerSimulatorComponent() {
  const { addToast } = useToast()
  const lbRef = useRef(new LoadBalancerSimulator())

  const [algorithm, setAlgorithm] = useState('round_robin')
  const [stats, setStats] = useState(lbRef.current.getStats())
  const [logs, setLogs] = useState([])
  const [clientIpInput, setClientIpInput] = useState('192.168.1.100')
  const [lastDispatched, setLastDispatched] = useState(null)

  const syncState = () => {
    setStats(lbRef.current.getStats())
    setLogs([...lbRef.current.requestLogs])
  }

  useEffect(() => {
    syncState()
  }, [])

  const handleAlgorithmChange = (newAlg) => {
    setAlgorithm(newAlg)
    lbRef.current.setAlgorithm(newAlg)
    syncState()
    addToast({
      type: 'info',
      title: 'Algoritmo Actualizado',
      message: `Balanceo cambiado a ${LOAD_BALANCING_ALGORITHMS[newAlg].name}.`,
    })
  }

  const handleDispatchOne = () => {
    const res = lbRef.current.dispatch(clientIpInput.trim() || '192.168.1.100', '/api/v1/checkout')
    setLastDispatched(res)

    if (res.success) {
      addToast({
        type: 'success',
        title: 'Petición Enrutada',
        message: `Tráfico asignado a "${res.server.name}" (${res.latencyMs}ms).`,
      })
    } else {
      addToast({
        type: 'danger',
        title: 'Error 503 Backend Caído',
        message: res.error,
      })
    }

    syncState()
  }

  const handleTrafficBurst = () => {
    lbRef.current.simulateTrafficBurst(15)
    syncState()
    addToast({
      type: 'success',
      title: 'Ráfaga de Tráfico Despachada',
      message: '15 peticiones concurrentes distribuidas entre los nodos disponibles.',
    })
  }

  const handleToggleHealth = (serverId, currentStatus) => {
    lbRef.current.setServerHealth(serverId, !currentStatus)
    syncState()
    addToast({
      type: currentStatus ? 'warning' : 'success',
      title: currentStatus ? 'Nodo Fuera de Servicio' : 'Nodo Restaurado',
      message: `Servidor ${serverId} marcado como ${currentStatus ? 'INACTIVO (Failover)' : 'ACTIVO (Failback)'}.`,
    })
  }

  const handleWeightChange = (serverId, weight) => {
    lbRef.current.setServerWeight(serverId, weight)
    syncState()
  }

  const handleReset = () => {
    lbRef.current.reset()
    setLastDispatched(null)
    syncState()
    addToast({
      type: 'info',
      title: 'Simulación Reiniciada',
      message: 'Nodos y métricas restablecidos a sus valores por defecto.',
    })
  }

  return (
    <section className="load-balancer-section" aria-label="Simulador de Balanceo de Carga y Alta Disponibilidad">
      {/* ── Encabezado ── */}
      <div className="load-balancer-header">
        <div>
          <div className="lb-badge-wrapper">
            <span className="badge badge--brand">🌐 Capa L4 / L7 Load Balancing</span>
            <span className="badge badge--success">Alta Disponibilidad (HA)</span>
          </div>
          <h2 className="load-balancer-title">
            Simulador de Algoritmos de Balanceo de Carga (HA & Failover)
          </h2>
          <p className="load-balancer-subtitle">
            Experimenta cómo los balanceadores distribuyen el tráfico web, optimizan la latencia y gestionan caídas de nodos sin interrupción de servicio.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="lb-actions-bar">
          <button
            type="button"
            className="btn-primary lb-btn-action"
            onClick={handleDispatchOne}
          >
            ⚡ Despachar Petición
          </button>
          <button
            type="button"
            className="btn-secondary lb-btn-action"
            onClick={handleTrafficBurst}
          >
            🚀 Ráfaga (15 Req)
          </button>
          <button
            type="button"
            className="btn-danger lb-btn-action"
            onClick={handleReset}
          >
            🧹 Reiniciar
          </button>
        </div>
      </div>

      {/* ── Configuración y Algoritmos ── */}
      <div className="lb-controls-grid">
        <div className="lb-card">
          <h3 className="lb-card-title">⚙️ Algoritmo de Balanceo Activo</h3>
          <div className="lb-algorithms-list">
            {Object.keys(LOAD_BALANCING_ALGORITHMS).map((key) => {
              const alg = LOAD_BALANCING_ALGORITHMS[key]
              return (
                <button
                  key={key}
                  type="button"
                  className={`lb-alg-btn ${algorithm === key ? 'lb-alg-btn--active' : ''}`}
                  onClick={() => handleAlgorithmChange(key)}
                >
                  <div className="lb-alg-name">{alg.name}</div>
                  <div className="lb-alg-desc">{alg.description}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel de Cliente Simulado */}
        <div className="lb-card">
          <h3 className="lb-card-title">👤 Cliente Simulado (Origen de Tráfico)</h3>
          <div className="lb-form-group">
            <label htmlFor="lb-ip-input" className="lb-label">Dirección IP del Cliente:</label>
            <input
              id="lb-ip-input"
              type="text"
              className="lb-input"
              value={clientIpInput}
              onChange={(e) => setClientIpInput(e.target.value)}
              placeholder="192.168.1.100"
            />
          </div>

          <div className="lb-quick-ips">
            <span className="lb-quick-label">IPs Rápidas:</span>
            {['192.168.1.45', '10.200.4.12', '172.16.8.99'].map((ip) => (
              <button
                key={ip}
                type="button"
                className="lb-quick-btn"
                onClick={() => setClientIpInput(ip)}
              >
                {ip}
              </button>
            ))}
          </div>

          {/* Último Enrutamiento */}
          {lastDispatched && (
            <div className={`lb-last-dispatch ${lastDispatched.success ? 'lb-last-dispatch--success' : 'lb-last-dispatch--error'}`}>
              {lastDispatched.success ? (
                <>
                  <span>🎯 Enrutado a: <strong>{lastDispatched.server.name}</strong></span>
                  <span className="lb-latency-tag">⚡ {lastDispatched.latencyMs}ms</span>
                </>
              ) : (
                <span>⚠️ {lastDispatched.error}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Nodos Servidores Backend (Clúster) ── */}
      <div className="lb-servers-section">
        <div className="lb-servers-header">
          <h3 className="lb-servers-title">
            🖥️ Clúster de Nodos Backend ({stats.healthyServers} de {stats.totalServers} Saludables)
          </h3>
          <span className="lb-servers-sub">Total peticiones procesadas: {stats.totalDispatched}</span>
        </div>

        <div className="lb-servers-grid">
          {stats.servers.map((server) => (
            <div
              key={server.id}
              className={`lb-server-card ${server.isHealthy ? '' : 'lb-server-card--down'}`}
            >
              <div className="lb-server-top">
                <div>
                  <h4 className="lb-server-name">{server.name}</h4>
                  <span className="lb-server-host">{server.host}:{server.port}</span>
                </div>
                <button
                  type="button"
                  className={`lb-health-toggle ${server.isHealthy ? 'lb-health-toggle--on' : 'lb-health-toggle--off'}`}
                  onClick={() => handleToggleHealth(server.id, server.isHealthy)}
                  title={server.isHealthy ? 'Simular fallo de servidor (Crash)' : 'Restaurar servidor (Recover)'}
                >
                  {server.isHealthy ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </button>
              </div>

              <div className="lb-server-metrics">
                <div className="lb-metric-item">
                  <span className="lb-metric-label">Conexiones Activas</span>
                  <span className="lb-metric-val">{server.activeConnections}</span>
                </div>
                <div className="lb-metric-item">
                  <span className="lb-metric-label">Peticiones Atendidas</span>
                  <span className="lb-metric-val">{server.totalRequestsServed}</span>
                </div>
                <div className="lb-metric-item">
                  <span className="lb-metric-label">Latencia Promedio</span>
                  <span className="lb-metric-val">{server.responseTimeMs}ms</span>
                </div>
              </div>

              {/* Slider de Peso (Weighted) */}
              <div className="lb-server-weight-box">
                <label className="lb-label">Peso / Capacidad: <strong>{server.weight}x</strong></label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={server.weight}
                  disabled={!server.isHealthy}
                  onChange={(e) => handleWeightChange(server.id, e.target.value)}
                  className="lb-slider"
                />
              </div>

              {/* Barra de Distribución de Carga */}
              <div className="lb-load-share">
                <div className="lb-load-share-header">
                  <span>Carga Asignada</span>
                  <strong>{server.sharePercent}%</strong>
                </div>
                <div className="lb-load-bar-track">
                  <div
                    className="lb-load-bar-fill"
                    style={{ width: `${server.sharePercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Registro de Tráfico en Tiempo Real ── */}
      {logs.length > 0 && (
        <div className="lb-logs-card">
          <h3 className="lb-logs-title">📋 Registro de Tráfico Reciente (Acceso L7)</h3>
          <div className="lb-logs-table-wrapper">
            <table className="lb-logs-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>IP Cliente</th>
                  <th>Ruta</th>
                  <th>Nodo Asignado</th>
                  <th>Latencia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 8).map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td><code>{log.clientIp}</code></td>
                    <td><code>{log.path}</code></td>
                    <td><strong>{log.serverName || 'Ninguno (Failover)'}</strong></td>
                    <td>{log.latencyMs ? `${log.latencyMs}ms` : '—'}</td>
                    <td>
                      <span className={`badge badge--${log.status === 200 ? 'success' : 'danger'}`}>
                        {log.status} {log.status === 200 ? 'OK' : 'Error'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

export default LoadBalancerSimulatorComponent
