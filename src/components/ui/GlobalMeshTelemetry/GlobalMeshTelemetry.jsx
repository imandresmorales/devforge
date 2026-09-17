/**
 * @fileoverview Componente GlobalMeshTelemetry — Monitor de Service Mesh y mTLS.
 *
 * MEJORA 101 (Bonus Enterprise): Telemetría Global de Service Mesh y Enrutamiento Zero-Trust.
 * Monitoreo en tiempo real de interconexión con mTLS, presupuestos de error (SLO/SLI 99.99%),
 * división de tráfico Canary y latencias percentiles p99.
 *
 * @module components/ui/GlobalMeshTelemetry
 */
import { useState, useMemo } from 'react'
import {
  MESH_SERVICES,
  calculateMeshSLO,
  splitCanaryTraffic
} from '../../../utils/globalMeshEngine.js'
import './GlobalMeshTelemetry.css'

export default function GlobalMeshTelemetry() {
  const [canaryWeight, setCanaryWeight] = useState(15)
  const [services, setServices] = useState(() => MESH_SERVICES)

  const sloMetrics = useMemo(() => {
    return calculateMeshSLO(services)
  }, [services])

  const trafficSplit = useMemo(() => {
    return splitCanaryTraffic(canaryWeight, 1100)
  }, [canaryWeight])

  return (
    <section className="mesh-telemetry" aria-labelledby="mesh-title">
      <div className="mesh-header">
        <div className="mesh-header__badge">
          <span>MEJORA 101</span>
          <span className="mesh-badge-tag">Cloud-Native Service Mesh & Zero-Trust mTLS</span>
        </div>
        <h2 id="mesh-title" className="mesh-header__title">
          Centro de Comando Service Mesh & Telemetría Global de Red
        </h2>
        <p className="mesh-header__desc">
          Supervisión holística de la arquitectura de microservicios con cifrado <strong>Mutual TLS (mTLS)</strong> estricto, gestión de presupuestos de error SLO 99.99% y control dinámico de tráfico Canary en vivo.
        </p>
      </div>

      {/* Métricas Globales de SLO */}
      <div className="mesh-metrics-grid">
        <div className="mesh-metric-card">
          <span className="mesh-metric-label">Tráfico Agregado Global:</span>
          <strong className="mesh-metric-val">{sloMetrics.totalRps.toLocaleString()} RPS</strong>
          <span className="mesh-metric-sub">Picos de carga HTTP/3 & gRPC</span>
        </div>

        <div className="mesh-metric-card">
          <span className="mesh-metric-label">Disponibilidad Actual (SLI):</span>
          <strong className="mesh-metric-val green">{sloMetrics.currentAvailability}%</strong>
          <span className="mesh-metric-sub">Objetivo SLO: 99.99% (Four Nines)</span>
        </div>

        <div className="mesh-metric-card">
          <span className="mesh-metric-label">Presupuesto de Error Restante:</span>
          <strong className="mesh-metric-val cyan">{sloMetrics.remainingBudgetPercent}%</strong>
          <span className="mesh-metric-sub">SLO Health: {sloMetrics.meshHealth}</span>
        </div>

        <div className="mesh-metric-card">
          <span className="mesh-metric-label">Seguridad mTLS Cifrada:</span>
          <strong className="mesh-metric-val gold">100% Zero-Trust</strong>
          <span className="mesh-metric-sub">Certificados X.509 Rotados</span>
        </div>
      </div>

      {/* Control de Enrutamiento Canary */}
      <div className="mesh-canary-panel">
        <div className="mesh-canary-header">
          <h3 className="mesh-section-title">Enrutamiento Ponderado Canary (Core API v1 vs v2)</h3>
          <span className="mesh-split-badge">
            v1.0: <strong>{100 - canaryWeight}% ({trafficSplit.baselineRps} RPS)</strong> | v2.0 Canary: <strong>{canaryWeight}% ({trafficSplit.canaryRps} RPS)</strong>
          </span>
        </div>

        <div className="mesh-slider-row">
          <input
            type="range"
            min="0"
            max="100"
            value={canaryWeight}
            onChange={(e) => setCanaryWeight(Number(e.target.value))}
            className="mesh-range-slider"
          />
        </div>
      </div>

      {/* Topología de Nodos del Service Mesh */}
      <div className="mesh-nodes-panel">
        <h3 className="mesh-section-title">Nodos Activos en la Malla de Servicios</h3>
        <div className="mesh-grid">
          {services.map((s) => (
            <div key={s.id} className="mesh-service-card">
              <div className="mesh-card-top">
                <span className="mesh-srv-name">{s.name}</span>
                <span className="mesh-mtls-tag">🔒 mTLS Activo</span>
              </div>
              <div className="mesh-srv-proto"><code>{s.protocol}</code></div>
              <div className="mesh-card-stats">
                <div>Throughput: <strong>{s.rps} RPS</strong></div>
                <div>Latencia p99: <strong>{s.p99LatencyMs}ms</strong></div>
                <div>Error Rate: <strong>{(s.errorRate * 100).toFixed(3)}%</strong></div>
                <div>Cert X.509: <strong>{s.certExpiryDays} días</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
