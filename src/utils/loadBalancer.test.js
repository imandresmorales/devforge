import { describe, it, expect, beforeEach } from 'vitest'
import { LoadBalancerSimulator } from './loadBalancer'

describe('Simulador de Balanceo de Carga (loadBalancer.js)', () => {
  let lb

  beforeEach(() => {
    lb = new LoadBalancerSimulator()
  })

  describe('Algoritmo Round Robin', () => {
    it('distribuye secuencialmente las solicitudes entre todos los nodos activos', () => {
      lb.setAlgorithm('round_robin')

      const res1 = lb.dispatch('192.168.1.1')
      const res2 = lb.dispatch('192.168.1.2')
      const res3 = lb.dispatch('192.168.1.3')
      const res4 = lb.dispatch('192.168.1.4')
      const res5 = lb.dispatch('192.168.1.5')

      expect(res1.server.id).toBe('srv-1')
      expect(res2.server.id).toBe('srv-2')
      expect(res3.server.id).toBe('srv-3')
      expect(res4.server.id).toBe('srv-4')
      expect(res5.server.id).toBe('srv-1') // Vuelve al inicio del ciclo
    })
  })

  describe('Algoritmo Least Connections', () => {
    it('enruta la solicitud al servidor con menor número de conexiones activas', () => {
      lb.setAlgorithm('least_connections')

      // srv-4 tiene activeConnections: 0 inicialmente
      const res = lb.dispatch('192.168.1.10')
      expect(res.server.id).toBe('srv-4')
    })
  })

  describe('Algoritmo IP Hash (Sticky Sessions)', () => {
    it('asigna de forma determinista la misma IP cliente al mismo servidor backend', () => {
      lb.setAlgorithm('ip_hash')

      const ipA = '10.50.2.100'
      const resA1 = lb.dispatch(ipA)
      const resA2 = lb.dispatch(ipA)
      const resA3 = lb.dispatch(ipA)

      expect(resA1.server.id).toBe(resA2.server.id)
      expect(resA2.server.id).toBe(resA3.server.id)
    })
  })

  describe('Health Checks & Failover Automático', () => {
    it('omite nodos marcados como caídos (isHealthy = false) y redirige el tráfico', () => {
      lb.setAlgorithm('round_robin')
      lb.setServerHealth('srv-1', false) // Apagamos srv-1

      const res = lb.dispatch('192.168.1.1')
      expect(res.server.id).not.toBe('srv-1')
      expect(res.server.isHealthy).toBe(true)
    })

    it('retorna error 503 si todos los servidores se encuentran caídos', () => {
      lb.servers.forEach((s) => lb.setServerHealth(s.id, false))

      const res = lb.dispatch('192.168.1.1')
      expect(res.success).toBe(false)
      expect(res.error).toContain('503 Service Unavailable')
    })
  })

  describe('Ráfaga de Tráfico y Estadísticas', () => {
    it('registra métricas de distribución de carga en peticiones múltiples', () => {
      lb.simulateTrafficBurst(20)
      const stats = lb.getStats()

      expect(stats.totalDispatched).toBe(20)
      expect(stats.servers.reduce((sum, s) => sum + s.totalRequestsServed, 0)).toBe(20)
    })
  })
})
