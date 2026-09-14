/**
 * @fileoverview Componente ContainerOrchestrationSimulator — Laboratorio de Kubernetes y Health Probes (Mejora 91).
 *
 * Muestra el ciclo de vida de Pods en un clúster Cloud-Native, evaluación de sondas
 * Liveness & Readiness, Auto-Healing ante fallos y Rolling Updates sin tiempo de inactividad.
 *
 * @module components/ui/ContainerOrchestrationSimulator
 */
import { useState, useRef, useEffect } from 'react'
import {
  K8sDeploymentSimulator,
  POD_PHASES,
} from '../../../utils/k8sOrchestrator'
import './ContainerOrchestrationSimulator.css'

export default function ContainerOrchestrationSimulator() {
  const [replicaCount, setReplicaCount] = useState(3)
  const [, setTick] = useState(0)
  const [trafficStats, setTrafficStats] = useState({ ok: 0, failed: 0 })

  const simulatorRef = useRef(null)
  if (!simulatorRef.current) {
    simulatorRef.current = new K8sDeploymentSimulator('devforge-api', 3, 'devforge-api:v1.0.0')
  }

  const deployment = simulatorRef.current

  const forceUpdate = () => setTick((t) => t + 1)

  // Escalar réplicas
  const handleScale = (delta) => {
    const newCount = Math.max(1, Math.min(8, replicaCount + delta))
    setReplicaCount(newCount)
    deployment.scale(newCount)
    forceUpdate()
  }

  // Rolling Update
  const handleRollingUpdate = () => {
    const nextVer = deployment.currentImage.includes('v1.0.0') ? 'devforge-api:v2.0.0' : 'devforge-api:v1.0.0'
    deployment.triggerRollingUpdate(nextVer)
    forceUpdate()
  }

  // Simular tráfico HTTP entrante (Ingress)
  const handleInjectTraffic = (requests = 10) => {
    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < requests; i++) {
      const res = deployment.routeRequest()
      if (res.success) successCount++
      else failedCount++
    }

    setTrafficStats((prev) => ({
      ok: prev.ok + successCount,
      failed: prev.failed + failedCount,
    }))
    forceUpdate()
  }

  // Acciones individuales sobre pods
  const handleFailLiveness = (podId) => {
    deployment.probeLiveness(podId, false)
    forceUpdate()
  }

  const handleToggleReadiness = (podId, currentReady) => {
    deployment.probeReadiness(podId, !currentReady)
    forceUpdate()
  }

  const handleCrashPod = (podId) => {
    deployment.triggerCrash(podId)
    forceUpdate()
  }

  const handleHealPod = (podId) => {
    deployment.autoHeal(podId)
    forceUpdate()
  }

  const handleAutoHealAll = () => {
    deployment.pods.forEach((p) => deployment.autoHeal(p.id))
    forceUpdate()
  }

  return (
    <section className="k8s-sim" aria-labelledby="k8s-title">
      {/* ── Encabezado ── */}
      <div className="k8s-sim__header">
        <div className="k8s-sim__title-row">
          <h2 id="k8s-title" className="k8s-sim__title">
            <span>☸️</span> Simulador de Orquestación Kubernetes & Health Probes
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span className="badge badge--brand">Mejora 91</span>
            <span className="badge badge--success">Cloud-Native k8s</span>
            <span className="badge badge--neutral">Liveness / Readiness</span>
            <span className="badge badge--warning">Auto-Healing</span>
          </div>
        </div>
        <p className="k8s-sim__desc">
          Laboratorio interactivo del ciclo de vida de <strong>Pods de Kubernetes</strong>.
          Observa cómo el <strong>Kubelet</strong> ejecuta sondas <code>Liveness</code> para reiniciar contenedores colapsados (Auto-Healing),
          sondas <code>Readiness</code> para aislar pods que no están listos sin matarlos, y realiza <strong>Rolling Updates</strong> sin caídas.
        </p>
      </div>

      {/* ── Barra de Acciones del Control Plane ── */}
      <div className="k8s-action-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Réplicas: <strong>{deployment.pods.length}</strong>
          </span>
          <button
            type="button"
            className="k8s-btn k8s-btn--secondary"
            onClick={() => handleScale(-1)}
            disabled={deployment.pods.length <= 1}
          >
            -
          </button>
          <button
            type="button"
            className="k8s-btn k8s-btn--secondary"
            onClick={() => handleScale(1)}
            disabled={deployment.pods.length >= 8}
          >
            +
          </button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="k8s-btn k8s-btn--primary"
            onClick={handleRollingUpdate}
          >
            🚀 Rolling Update ({deployment.currentImage.includes('v1.0.0') ? '→ v2.0.0' : '→ v1.0.0'})
          </button>

          <button
            type="button"
            className="k8s-btn k8s-btn--secondary"
            onClick={() => handleInjectTraffic(15)}
          >
            ⚡ Inyectar Tráfico (15 HTTP Reqs)
          </button>

          <button
            type="button"
            className="k8s-btn k8s-btn--secondary"
            onClick={handleAutoHealAll}
          >
            🩹 Auto-Heal Total
          </button>
        </div>
      </div>

      {/* ── Métricas de Tráfico Ingress ── */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          Tráfico HTTP Enrutado:{' '}
          <strong style={{ color: '#10b981' }}>{trafficStats.ok} (200 OK)</strong> |{' '}
          <strong style={{ color: trafficStats.failed > 0 ? '#ef4444' : '#94a3b8' }}>{trafficStats.failed} (503 Service Unavailable)</strong>
        </span>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          Imagen Actual:{' '}
          <strong style={{ color: '#a78bfa' }}>{deployment.currentImage}</strong>
        </span>
      </div>

      {/* ── Grid de Pods ── */}
      <div className="k8s-pods-grid">
        {deployment.pods.map((pod) => (
          <article
            key={pod.id}
            className={`k8s-pod-card ${
              pod.phase === POD_PHASES.CRASH_LOOP
                ? 'k8s-pod-card--crash'
                : !pod.ready
                ? 'k8s-pod-card--unready'
                : 'k8s-pod-card--running'
            }`}
          >
            <div className="k8s-pod-header">
              <span className="k8s-pod-id">{pod.id.replace('pod-devforge-api-', 'pod-')}</span>
              <span
                className={`badge ${
                  pod.phase === POD_PHASES.CRASH_LOOP
                    ? 'badge--error'
                    : !pod.ready
                    ? 'badge--warning'
                    : 'badge--success'
                }`}
              >
                {pod.ready ? '● Ready (1/1)' : '○ Unready (0/1)'}
              </span>
            </div>

            <div className="k8s-pod-metrics">
              <div className="k8s-pod-row">
                <span>Fase / Estado:</span>
                <strong style={{ color: pod.phase === POD_PHASES.RUNNING ? '#10b981' : '#ef4444' }}>
                  {pod.phase}
                </strong>
              </div>
              <div className="k8s-pod-row">
                <span>Nodo Worker:</span>
                <span>{pod.node}</span>
              </div>
              <div className="k8s-pod-row">
                <span>Reinicios (Restarts):</span>
                <span>{pod.restartCount}</span>
              </div>
              <div className="k8s-pod-row">
                <span>Fallos Liveness:</span>
                <span>{pod.consecutiveLivenessFailures} / {pod.probes.liveness.failureThreshold}</span>
              </div>
              <div className="k8s-pod-row">
                <span>Peticiones Procesadas:</span>
                <strong style={{ color: '#38bdf8' }}>{pod.metrics.requestsHandled} reqs</strong>
              </div>
            </div>

            {/* Acciones del Pod */}
            <div className="k8s-pod-actions">
              <button
                type="button"
                className="k8s-mini-btn"
                onClick={() => handleFailLiveness(pod.id)}
                title="Simula fallo en la comprobación de Liveness"
              >
                ⚠️ Fallar Liveness
              </button>
              <button
                type="button"
                className="k8s-mini-btn"
                onClick={() => handleToggleReadiness(pod.id, pod.ready)}
                title="Alterna la disponibilidad de Readiness"
              >
                {pod.ready ? '🚫 Desactivar Ready' : '✅ Activar Ready'}
              </button>
              {pod.phase === POD_PHASES.CRASH_LOOP ? (
                <button
                  type="button"
                  className="k8s-mini-btn"
                  style={{ borderColor: '#10b981', color: '#10b981' }}
                  onClick={() => handleHealPod(pod.id)}
                >
                  🩹 Auto-Heal
                </button>
              ) : (
                <button
                  type="button"
                  className="k8s-mini-btn"
                  style={{ borderColor: '#ef4444', color: '#f87171' }}
                  onClick={() => handleCrashPod(pod.id)}
                >
                  💥 Crash Pod
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* ── Flujo de Eventos de Kubelet ── */}
      <h4 style={{ margin: '0 0 var(--space-2) 0', color: '#fff', fontSize: 'var(--text-xs)' }}>
        📋 Registro de Eventos del Clúster (Kubelet & ReplicaSet Controller):
      </h4>
      <div className="k8s-events-box">
        {deployment.events.map((evt) => (
          <div key={evt.id} className="k8s-event-item">
            <span style={{ opacity: 0.5 }}>[{evt.timestamp}]</span>
            <span className="k8s-event-reason">{evt.reason}:</span>
            <span style={{ color: '#cbd5e1' }}>{evt.message}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
