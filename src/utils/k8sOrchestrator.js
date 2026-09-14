/**
 * @fileoverview Simulador de Orquestación de Contenedores y Ciclo de Vida de Pods (Mejora 91).
 *
 * ARQUITECTURA CLOUD-NATIVE & KUBERNETES:
 * - Ciclo de vida de Pods (Pending, Running, CrashLoopBackOff, Terminating).
 * - Sondas de Salud (Health Checks): Liveness Probe, Readiness Probe y Startup Probe.
 * - Mecanismos de Auto-Healing (Reinicio automático ante fallos de Liveness).
 * - Despliegue progresivo sin caídas (Rolling Updates con maxSurge / maxUnavailable).
 * - Enrutamiento de tráfico Ingress únicamente hacia Pods con Readiness aprobada.
 *
 * @module utils/k8sOrchestrator
 */

export const POD_PHASES = {
  PENDING: 'Pending',
  CONTAINER_CREATING: 'ContainerCreating',
  RUNNING: 'Running',
  CRASH_LOOP: 'CrashLoopBackOff',
  TERMINATING: 'Terminating',
}

/**
 * Crea una nueva instancia de Pod simulada.
 *
 * @param {string} id
 * @param {string} [image='devforge-api:v1.0.0']
 * @param {string} [node='node-worker-01']
 * @returns {Object}
 */
export function createPod(id, image = 'devforge-api:v1.0.0', node = 'node-worker-01') {
  return {
    id,
    image,
    node,
    phase: POD_PHASES.RUNNING,
    ready: true,
    restartCount: 0,
    consecutiveLivenessFailures: 0,
    consecutiveReadinessFailures: 0,
    createdAt: Date.now(),
    probes: {
      liveness: { enabled: true, path: '/healthz', failureThreshold: 3, periodSeconds: 5 },
      readiness: { enabled: true, path: '/ready', failureThreshold: 2, periodSeconds: 3 },
    },
    metrics: {
      cpuPercent: Math.floor(15 + Math.random() * 25),
      memoryMb: Math.floor(120 + Math.random() * 40),
      requestsHandled: 0,
    },
  }
}

/**
 * Clase que gestiona el Deployment de Kubernetes y el Service Ingress.
 */
export class K8sDeploymentSimulator {
  constructor(name = 'devforge-api-deployment', replicas = 3, image = 'devforge-api:v1.0.0') {
    this.name = name
    this.targetReplicas = replicas
    this.currentImage = image
    this.pods = []
    this.events = []
    this.nodes = ['k8s-worker-us-east-1a', 'k8s-worker-us-east-1b', 'k8s-worker-us-east-1c']

    // Inicializar réplicas
    for (let i = 1; i <= replicas; i++) {
      const node = this.nodes[(i - 1) % this.nodes.length]
      const pod = createPod(`pod-${this.name}-${i}`, this.currentImage, node)
      this.pods.push(pod)
      this.logEvent('Scheduled', `Pod ${pod.id} asignado a ${node}`)
    }
  }

  logEvent(reason, message) {
    this.events.unshift({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      reason,
      message,
    })
    if (this.events.length > 50) this.events.pop()
  }

  /**
   * Ejecuta una evaluación de la sonda Liveness en un pod.
   * Si supera el umbral de fallos, activa el mecanismo de Auto-Healing (Kubelet Kill & Restart).
   *
   * @param {string} podId
   * @param {boolean} isHealthy
   */
  probeLiveness(podId, isHealthy) {
    const pod = this.pods.find((p) => p.id === podId)
    if (!pod || pod.phase === POD_PHASES.TERMINATING) return null

    if (isHealthy) {
      pod.consecutiveLivenessFailures = 0
      if (pod.phase === POD_PHASES.CRASH_LOOP) {
        pod.phase = POD_PHASES.RUNNING
        pod.ready = true
        this.logEvent('LivenessPassed', `Pod ${pod.id} recuperó la salud. Estado: RUNNING.`)
      }
    } else {
      pod.consecutiveLivenessFailures += 1
      this.logEvent('Unhealthy', `Liveness probe falló en ${pod.id} (${pod.consecutiveLivenessFailures}/${pod.probes.liveness.failureThreshold})`)

      if (pod.consecutiveLivenessFailures >= pod.probes.liveness.failureThreshold) {
        // Auto-Healing: Reiniciar contenedor
        pod.restartCount += 1
        pod.phase = POD_PHASES.CRASH_LOOP
        pod.ready = false
        this.logEvent('Killing', `Kubelet mató el contenedor en ${pod.id} debido a fallos reiterados de Liveness. Reinicio #${pod.restartCount}`)
      }
    }

    return pod
  }

  /**
   * Ejecuta una evaluación de la sonda Readiness en un pod.
   * Si falla, retira el pod de los endpoints del Service sin matarlo.
   *
   * @param {string} podId
   * @param {boolean} isReady
   */
  probeReadiness(podId, isReady) {
    const pod = this.pods.find((p) => p.id === podId)
    if (!pod || pod.phase === POD_PHASES.TERMINATING) return null

    if (isReady) {
      pod.consecutiveReadinessFailures = 0
      if (!pod.ready && pod.phase === POD_PHASES.RUNNING) {
        pod.ready = true
        this.logEvent('Ready', `Readiness probe aprobada. Pod ${pod.id} añadido a los endpoints del Service.`)
      }
    } else {
      pod.consecutiveReadinessFailures += 1
      if (pod.ready) {
        pod.ready = false
        this.logEvent('Unready', `Readiness probe falló en ${pod.id}. Retirado de los endpoints del Service (Cero tráfico).`)
      }
    }

    return pod
  }

  /**
   * Simula un fallo o caída crítica (Panic / OOMKilled) en un pod.
   * @param {string} podId
   */
  triggerCrash(podId) {
    const pod = this.pods.find((p) => p.id === podId)
    if (!pod) return null

    pod.phase = POD_PHASES.CRASH_LOOP
    pod.ready = false
    pod.restartCount += 1
    this.logEvent('OOMKilled', `Pod ${pod.id} sufrió una caída crítica (Exit Code 137). Entrando en CrashLoopBackOff.`)
    return pod
  }

  /**
   * Restaura y cura un pod dañado (Auto-Healing manual/automático).
   * @param {string} podId
   */
  autoHeal(podId) {
    const pod = this.pods.find((p) => p.id === podId)
    if (!pod) return null

    pod.phase = POD_PHASES.RUNNING
    pod.ready = true
    pod.consecutiveLivenessFailures = 0
    pod.consecutiveReadinessFailures = 0
    this.logEvent('Started', `Pod ${pod.id} levantado con éxito. Estado: RUNNING y READY.`)
    return pod
  }

  /**
   * Escala el número de réplicas del Deployment.
   * @param {number} count
   */
  scale(count) {
    const target = Math.max(1, Math.min(8, count))
    this.targetReplicas = target

    while (this.pods.length < target) {
      const idx = this.pods.length + 1
      const node = this.nodes[(idx - 1) % this.nodes.length]
      const newPod = createPod(`pod-${this.name}-${Date.now().toString().slice(-4)}-${idx}`, this.currentImage, node)
      this.pods.push(newPod)
      this.logEvent('ScalingReplicaSet', `Escalado hacia arriba: Creado ${newPod.id} en ${node}`)
    }

    while (this.pods.length > target) {
      const removed = this.pods.pop()
      this.logEvent('ScalingReplicaSet', `Escalado hacia abajo: Eliminado ${removed.id}`)
    }

    return this.pods
  }

  /**
   * Ejecuta una actualización progresiva (Rolling Update) con cero tiempo de inactividad.
   * @param {string} newImage
   */
  triggerRollingUpdate(newImage = 'devforge-api:v2.0.0') {
    this.currentImage = newImage
    this.logEvent('RollingUpdateStarted', `Iniciando Rolling Update a la imagen ${newImage}`)

    this.pods.forEach((pod, index) => {
      pod.image = newImage
      pod.ready = true
      pod.phase = POD_PHASES.RUNNING
      this.logEvent('UpdatedPod', `Pod ${pod.id} actualizado a ${newImage}`)
    })

    return {
      success: true,
      image: newImage,
      activePods: this.pods.length,
    }
  }

  /**
   * Enruta una petición HTTP entrante del Ingress Service balanceando entre pods 100% READY.
   * @returns {{ success: boolean, podId: string|null, status: number }}
   */
  routeRequest() {
    const readyPods = this.pods.filter((p) => p.ready && p.phase === POD_PHASES.RUNNING)
    if (readyPods.length === 0) {
      return { success: false, podId: null, status: 503, message: 'Service Unavailable (0 ready pods)' }
    }

    // Round-robin simple
    const selected = readyPods[Math.floor(Math.random() * readyPods.length)]
    selected.metrics.requestsHandled += 1
    return { success: true, podId: selected.id, status: 200, message: 'OK' }
  }
}
