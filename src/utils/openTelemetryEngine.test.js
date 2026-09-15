/**
 * @fileoverview Tests unitarios para el Motor de OpenTelemetry y Trazabilidad Distribuida (Mejora 93).
 */
import { describe, it, expect } from 'vitest'
import {
  formatTraceParent,
  parseTraceParent,
  generateHexId,
  TRACE_SCENARIOS,
} from './openTelemetryEngine'

describe('OpenTelemetry Engine & W3C Distributed Tracing (openTelemetryEngine.js)', () => {
  describe('Formateo y Parseo de W3C Trace Context (traceparent)', () => {
    it('debe formatear correctamente una cabecera traceparent estándar', () => {
      const traceId = '4bf92f3577b34da6a3ce929d0e0e4736'
      const spanId = '00f067aa0ba902b7'
      const header = formatTraceParent(traceId, spanId)

      expect(header).toBe('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01')
    })

    it('debe parsear y extraer los componentes de una cabecera válida', () => {
      const header = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
      const parsed = parseTraceParent(header)

      expect(parsed).not.toBeNull()
      expect(parsed.version).toBe('00')
      expect(parsed.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736')
      expect(parsed.parentSpanId).toBe('00f067aa0ba902b7')
      expect(parsed.flags).toBe('01')
    })

    it('debe retornar null ante cabeceras malformadas', () => {
      expect(parseTraceParent('invalid-header')).toBeNull()
      expect(parseTraceParent('')).toBeNull()
      expect(parseTraceParent('00-short-short-01')).toBeNull()
    })
  })

  describe('Generador de Trazas Distribuidas', () => {
    it('debe generar un grafo de spans conectados con el mismo Trace ID', () => {
      const spans = TRACE_SCENARIOS.CHECKOUT_FLOW.generateTrace()

      expect(spans.length).toBe(5)
      const rootSpan = spans[0]
      expect(rootSpan.parentSpanId).toBeNull()
      expect(rootSpan.kind).toBe('SERVER')

      const traceId = rootSpan.traceId
      expect(traceId.length).toBe(32)

      // Todos los spans secundarios deben compartir el mismo traceId y apuntar al rootSpan
      for (let i = 1; i < spans.length; i++) {
        expect(spans[i].traceId).toBe(traceId)
        expect(spans[i].parentSpanId).toBe(rootSpan.spanId)
      }
    })

    it('debe marcar correctamente el estado de error al inyectar fallos', () => {
      const spans = TRACE_SCENARIOS.CHECKOUT_FLOW.generateTrace({ injectFailure: true })
      const rootSpan = spans[0]
      const paymentSpan = spans.find((s) => s.serviceName === 'payment-service')

      expect(rootSpan.status).toBe('ERROR')
      expect(paymentSpan.status).toBe('ERROR')
      expect(paymentSpan.attributes['error.message']).toContain('Card Declined')
    })
  })
})
