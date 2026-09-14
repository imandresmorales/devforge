/**
 * @fileoverview Tests unitarios para el Orquestador de Contenedores y Health Checks (Mejora 91).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  K8sDeploymentSimulator,
  POD_PHASES,
  createPod,
} from './k8sOrchestrator'

describe('Kubernetes Container Orchestrator & Health Probes (k8sOrchestrator.js)', () => {
  let deployment

  beforeEach(() => {
    deployment = new K8sDeploymentSimulator('devforge-api', 3, 'devforge-api:v1.0.0')
  })

  describe('Inicialización y Ciclo de Vida de Pods', () => {
    it('debe inicializar el deployment con el número exacto de réplicas saludables', () => {
      expect(deployment.pods.length).toBe(3)
      expect(deployment.pods.every((p) => p.phase === POD_PHASES.RUNNING && p.ready)).toBe(true)
    })

    it('debe escalar hacia arriba y hacia abajo el número de réplicas', () => {
      deployment.scale(5)
      expect(deployment.pods.length).toBe(5)

      deployment.scale(2)
      expect(deployment.pods.length).toBe(2)
    })
  })

  describe('Sondas Liveness y Auto-Healing', () => {
    it('debe matar y reiniciar el contenedor cuando la sonda Liveness falla reiteradamente', () => {
      const podId = deployment.pods[0].id

      // Falla 1
      deployment.probeLiveness(podId, false)
      expect(deployment.pods[0].phase).toBe(POD_PHASES.RUNNING)
      expect(deployment.pods[0].restartCount).toBe(0)

      // Falla 2
      deployment.probeLiveness(podId, false)
      expect(deployment.pods[0].phase).toBe(POD_PHASES.RUNNING)

      // Falla 3 (Alcanza el threshold de 3)
      deployment.probeLiveness(podId, false)
      expect(deployment.pods[0].phase).toBe(POD_PHASES.CRASH_LOOP)
      expect(deployment.pods[0].ready).toBe(false)
      expect(deployment.pods[0].restartCount).toBe(1)
    })

    it('debe recuperar el pod mediante auto-healing', () => {
      const podId = deployment.pods[0].id
      deployment.triggerCrash(podId)
      expect(deployment.pods[0].phase).toBe(POD_PHASES.CRASH_LOOP)

      deployment.autoHeal(podId)
      expect(deployment.pods[0].phase).toBe(POD_PHASES.RUNNING)
      expect(deployment.pods[0].ready).toBe(true)
    })
  })

  describe('Sondas Readiness y Enrutamiento Ingress', () => {
    it('debe retirar el pod de los endpoints cuando la sonda Readiness falla sin reiniciar el pod', () => {
      const podId = deployment.pods[0].id
      deployment.probeReadiness(podId, false)

      expect(deployment.pods[0].ready).toBe(false)
      expect(deployment.pods[0].phase).toBe(POD_PHASES.RUNNING) // No se reinicia
      expect(deployment.pods[0].restartCount).toBe(0)
    })

    it('debe enrutar tráfico únicamente a pods 100% listos (Ready)', () => {
      // Dejar solo 1 pod en estado Ready
      deployment.pods[0].ready = false
      deployment.pods[1].ready = false
      deployment.pods[2].ready = true

      const result = deployment.routeRequest()
      expect(result.success).toBe(true)
      expect(result.podId).toBe(deployment.pods[2].id)
      expect(result.status).toBe(200)
    })

    it('debe retornar HTTP 503 cuando no hay pods listos para recibir tráfico', () => {
      deployment.pods.forEach((p) => { p.ready = false })
      const result = deployment.routeRequest()

      expect(result.success).toBe(false)
      expect(result.status).toBe(503)
    })
  })

  describe('Rolling Update (Actualización Progresiva Sin Caídas)', () => {
    it('debe actualizar la versión de imagen de todos los pods manteniendo el estado Ready', () => {
      const res = deployment.triggerRollingUpdate('devforge-api:v2.0.0')

      expect(res.success).toBe(true)
      expect(deployment.currentImage).toBe('devforge-api:v2.0.0')
      expect(deployment.pods.every((p) => p.image === 'devforge-api:v2.0.0')).toBe(true)
    })
  })
})
