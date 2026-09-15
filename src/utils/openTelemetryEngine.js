/**
 * @fileoverview Motor de Observabilidad OpenTelemetry y Trazabilidad Distribuida (Mejora 93).
 *
 * ESTÁNDARES Y OBSERVABILIDAD DISTRIBUIDA:
 * - Especificación OpenTelemetry (OTel) y CNCF.
 * - Estándar W3C Trace Context (RFC/W3C Recommendation): Cabeceras 'traceparent' y 'tracestate'.
 * - Generación y propagación de grafos acíclicos de Spans (Root y Child Spans) a través de microservicios.
 * - Cálculo de cascadas de latencia (Waterfall), detección de cuellos de botella y propagación de errores.
 *
 * @module utils/openTelemetryEngine
 */

/**
 * Genera un ID hexadecimal aleatorio.
 * @param {number} bytes - Longitud en bytes (16 bytes = 32 hex chars, 8 bytes = 16 hex chars)
 * @returns {string}
 */
export function generateHexId(bytes = 16) {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < bytes * 2; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

/**
 * Formatea una cabecera W3C traceparent (version-traceId-parentSpanId-traceFlags).
 * Ejemplo: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
 *
 * @param {string} traceId - 32 hex chars
 * @param {string} spanId - 16 hex chars
 * @param {string} [flags='01'] - '01' para muestreado (sampled)
 * @returns {string}
 */
export function formatTraceParent(traceId, spanId, flags = '01') {
  return `00-${traceId}-${spanId}-${flags}`
}

/**
 * Parsea una cabecera W3C traceparent.
 *
 * @param {string} header
 * @returns {{ version: string, traceId: string, parentSpanId: string, flags: string }|null}
 */
export function parseTraceParent(header) {
  if (!header || typeof header !== 'string') return null
  const parts = header.trim().split('-')
  if (parts.length !== 4 || parts[1].length !== 32 || parts[2].length !== 16) {
    return null
  }
  return {
    version: parts[0],
    traceId: parts[1],
    parentSpanId: parts[2],
    flags: parts[3],
  }
}

/**
 * Representa un Span de OpenTelemetry.
 */
export class SimulatedSpan {
  constructor({
    name,
    serviceName,
    kind = 'INTERNAL',
    traceId,
    parentSpanId = null,
    startTime = 0,
    durationMs = 10,
    attributes = {},
    status = 'OK',
    events = [],
  }) {
    this.name = name
    this.serviceName = serviceName
    this.kind = kind
    this.traceId = traceId || generateHexId(16)
    this.spanId = generateHexId(8)
    this.parentSpanId = parentSpanId
    this.startTime = startTime
    this.durationMs = durationMs
    this.attributes = {
      'telemetry.sdk.language': 'javascript',
      'service.name': serviceName,
      ...attributes,
    }
    this.status = status // 'OK' | 'ERROR'
    this.events = events
  }
}

/**
 * Escenarios de transacciones distribuidas preconfigurados.
 */
export const TRACE_SCENARIOS = {
  CHECKOUT_FLOW: {
    id: 'checkout_flow',
    name: '🛒 Transacción de Checkout E-Commerce (Multi-Microservicio)',
    generateTrace: (options = {}) => {
      const { injectFailure = false, injectLatency = false } = options
      const traceId = generateHexId(16)

      const dbLatency = injectLatency ? 180 : 35
      const paymentStatus = injectFailure ? 'ERROR' : 'OK'

      // 1. Root Span: HTTP POST /api/orders/checkout (API Gateway)
      const rootSpan = new SimulatedSpan({
        name: 'POST /api/orders/checkout',
        serviceName: 'api-gateway',
        kind: 'SERVER',
        traceId,
        parentSpanId: null,
        startTime: 0,
        durationMs: injectLatency ? 290 : 120,
        status: injectFailure ? 'ERROR' : 'OK',
        attributes: {
          'http.method': 'POST',
          'http.route': '/api/orders/checkout',
          'http.status_code': injectFailure ? 500 : 200,
        },
      })

      // 2. Child Span: Auth Verification (Auth Service)
      const authSpan = new SimulatedSpan({
        name: 'VerifyJWT & CheckPermissions',
        serviceName: 'auth-service',
        kind: 'INTERNAL',
        traceId,
        parentSpanId: rootSpan.spanId,
        startTime: 10,
        durationMs: 25,
        attributes: { 'user.id': 'usr_98124', 'auth.type': 'Bearer JWT' },
      })

      // 3. Child Span: Payment Processing (Payment Service)
      const paymentSpan = new SimulatedSpan({
        name: 'Stripe API /v1/charges',
        serviceName: 'payment-service',
        kind: 'CLIENT',
        traceId,
        parentSpanId: rootSpan.spanId,
        startTime: 40,
        durationMs: injectFailure ? 50 : 45,
        status: paymentStatus,
        attributes: {
          'payment.provider': 'Stripe',
          'payment.amount': 15000,
          'payment.currency': 'USD',
          ...(injectFailure ? { 'error.message': 'Card Declined: Insufficient Funds' } : {}),
        },
        events: injectFailure ? [{ name: 'PaymentError', timestamp: 85, payload: 'StripeCardError' }] : [],
      })

      // 4. Child Span: Database Inventory Lock (PostgreSQL DB)
      const dbSpan = new SimulatedSpan({
        name: 'UPDATE inventory SET stock = stock - 1',
        serviceName: 'inventory-db',
        kind: 'CLIENT',
        traceId,
        parentSpanId: rootSpan.spanId,
        startTime: 38,
        durationMs: dbLatency,
        attributes: {
          'db.system': 'postgresql',
          'db.name': 'production_inventory',
          'db.statement': 'UPDATE inventory SET stock = stock - 1 WHERE item_id = $1',
        },
      })

      // 5. Child Span: Event Notification (Kafka Message Broker)
      const kafkaSpan = new SimulatedSpan({
        name: 'ProduceEvent: order.created',
        serviceName: 'kafka-broker',
        kind: 'PRODUCER',
        traceId,
        parentSpanId: rootSpan.spanId,
        startTime: 90,
        durationMs: 20,
        attributes: {
          'messaging.system': 'kafka',
          'messaging.destination': 'orders.events',
        },
      })

      return [rootSpan, authSpan, paymentSpan, dbSpan, kafkaSpan]
    },
  },
}
