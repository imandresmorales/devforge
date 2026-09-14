/**
 * @fileoverview Componente BinarySerializationExplorer — Laboratorio de Serialización Binaria y Compresión (Mejora 90).
 *
 * Muestra la comparativa de eficiencia, consumo de ancho de banda y tamaño de payload
 * entre JSON (Textual), MessagePack (Binario dinámico) y Protobuf (Binario tipado con Varints).
 *
 * @module components/ui/BinarySerializationExplorer
 */
import { useState, useMemo } from 'react'
import {
  compareSerializationFormats,
} from '../../../utils/binarySerializer'
import './BinarySerializationExplorer.css'

const TEMPLATES = {
  IOT_SENSOR: {
    id: 'iot_sensor',
    name: '📡 Telemetría IoT (SensorStream)',
    schema: {
      deviceId: { tag: 1, type: 'int' },
      sensorType: { tag: 2, type: 'string' },
      reading: { tag: 3, type: 'float' },
      batteryLevel: { tag: 4, type: 'int' },
      isAlert: { tag: 5, type: 'bool' },
    },
    payload: {
      deviceId: 40921,
      sensorType: 'TEMPERATURE_HUMIDITY_INDUSTRIAL',
      reading: 38.75,
      batteryLevel: 94,
      isAlert: false,
    },
  },
  FINTECH_ORDER: {
    id: 'fintech_order',
    name: '📈 Orden de Trading Financiero (High-Frequency)',
    schema: {
      orderId: { tag: 1, type: 'int' },
      account: { tag: 2, type: 'string' },
      symbol: { tag: 3, type: 'string' },
      price: { tag: 4, type: 'float' },
      quantity: { tag: 5, type: 'int' },
      isMarket: { tag: 6, type: 'bool' },
    },
    payload: {
      orderId: 9812401,
      account: 'ACC-QUANT-ALPHA-99',
      symbol: 'BTC-USDT-PERPETUAL',
      price: 64120.5,
      quantity: 50,
      isMarket: true,
    },
  },
  USER_SESSION: {
    id: 'user_session',
    name: '👤 Sesión de Usuario & Tokens de Seguridad',
    schema: {
      userId: { tag: 1, type: 'int' },
      username: { tag: 2, type: 'string' },
      role: { tag: 3, type: 'string' },
      isMfaVerified: { tag: 4, type: 'bool' },
    },
    payload: {
      userId: 88102,
      username: 'andres_morales_dev',
      role: 'PRINCIPAL_SYSTEM_ARCHITECT',
      isMfaVerified: true,
    },
  },
}

export default function BinarySerializationExplorer() {
  const [templateKey, setTemplateKey] = useState('FINTECH_ORDER')
  const template = TEMPLATES[templateKey]

  const comparison = useMemo(() => {
    return compareSerializationFormats(template.payload, template.schema)
  }, [template])

  return (
    <section className="bin-explorer" aria-labelledby="bin-title">
      {/* ── Encabezado ── */}
      <div className="bin-explorer__header">
        <div className="bin-explorer__title-row">
          <h2 id="bin-title" className="bin-explorer__title">
            <span>⚡</span> Motor de Serialización Binaria (Protobuf / MsgPack vs JSON)
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span className="badge badge--brand">Mejora 90</span>
            <span className="badge badge--success">gRPC Protobuf v3</span>
            <span className="badge badge--neutral">MessagePack Binary</span>
            <span className="badge badge--warning">Varint LEB128</span>
          </div>
        </div>
        <p className="bin-explorer__desc">
          Comparador de protocolos de serialización para sistemas distribuidos y microservicios de alto rendimiento.
          Mientras que <strong>JSON</strong> introduce sobrecarga excesiva al repetir los nombres de las claves en texto plano,
          <strong>Protocol Buffers (Protobuf)</strong> utiliza etiquetas binarias numéricas (Varints) logrando ahorros masivos de ancho de banda.
        </p>
      </div>

      {/* ── Selector de Plantilla ── */}
      <div className="bin-template-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Plantilla de Carga Útil (Payload):
          </label>
          <select
            className="bin-select"
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value)}
          >
            <option value="IOT_SENSOR">📡 Telemetría IoT (SensorStream)</option>
            <option value="FINTECH_ORDER">📈 Orden de Trading Financiero (High-Frequency)</option>
            <option value="USER_SESSION">👤 Sesión de Usuario & Tokens de Seguridad</option>
          </select>
        </div>

        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Roundtrip Lossless: <strong style={{ color: '#10b981' }}>{comparison.isRoundtripValid ? '✅ VÁLIDO' : '❌ ERROR'}</strong>
        </div>
      </div>

      {/* ── Grid de Formatos ── */}
      <div className="bin-format-grid">
        {/* JSON */}
        <article className="bin-format-card bin-format-card--json">
          <div className="bin-format-card__header">
            <span className="bin-format-card__title">1. JSON (Textual UTF-8)</span>
            <span className="badge badge--neutral">Línea Base (0%)</span>
          </div>
          <div className="bin-format-card__size">{comparison.jsonBytes} Bytes</div>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            Formato de texto verboso. Cada clave ('{Object.keys(template.payload)[0]}', etc.) se envía repetidamente en cada solicitud.
          </p>
          <div className="bin-format-card__hex" title="Hex Dump Preview">
            {comparison.jsonHex}...
          </div>
        </article>

        {/* MessagePack */}
        <article className="bin-format-card bin-format-card--msgpack">
          <div className="bin-format-card__header">
            <span className="bin-format-card__title">2. MessagePack (Binario)</span>
            <span className="badge badge--brand">-{comparison.msgpackSavingsPercent}%</span>
          </div>
          <div className="bin-format-card__size" style={{ color: '#38bdf8' }}>
            {comparison.msgpackBytes} Bytes
          </div>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            Binario dinámico sin esquema previo. Compacta tipos y enteros, reduciendo el tamaño total.
          </p>
          <div className="bin-format-card__hex" title="Hex Dump Preview">
            {comparison.msgpackHex}...
          </div>
        </article>

        {/* Protobuf */}
        <article className="bin-format-card bin-format-card--protobuf">
          <div className="bin-format-card__header">
            <span className="bin-format-card__title">3. Protobuf (gRPC Schema)</span>
            <span className="badge badge--success">-{comparison.protobufSavingsPercent}% Ahorro</span>
          </div>
          <div className="bin-format-card__size" style={{ color: '#10b981' }}>
            {comparison.protobufBytes} Bytes
          </div>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            Binario estricto basado en esquema con codificación Varint LEB128. Máxima velocidad de deserialización en CPU.
          </p>
          <div className="bin-format-card__hex" title="Hex Dump Completo">
            {comparison.protobufHex}
          </div>
        </article>
      </div>

      {/* ── Gráfico de Comparación de Tamaño ── */}
      <div className="bin-chart-card">
        <h4 style={{ margin: '0 0 var(--space-3) 0', color: '#fff', fontSize: 'var(--text-xs)' }}>
          📊 Comparación Visual del Consumo de Ancho de Banda:
        </h4>

        <div className="bin-bar-row">
          <span className="bin-bar-label">JSON:</span>
          <div className="bin-bar-track">
            <div className="bin-bar-fill" style={{ width: '100%', background: '#94a3b8' }} />
          </div>
          <span className="bin-bar-val">{comparison.jsonBytes} B</span>
        </div>

        <div className="bin-bar-row">
          <span className="bin-bar-label">MessagePack:</span>
          <div className="bin-bar-track">
            <div
              className="bin-bar-fill"
              style={{
                width: `${(comparison.msgpackBytes / comparison.jsonBytes) * 100}%`,
                background: '#38bdf8',
              }}
            />
          </div>
          <span className="bin-bar-val" style={{ color: '#38bdf8' }}>{comparison.msgpackBytes} B</span>
        </div>

        <div className="bin-bar-row">
          <span className="bin-bar-label">Protobuf (gRPC):</span>
          <div className="bin-bar-track">
            <div
              className="bin-bar-fill"
              style={{
                width: `${(comparison.protobufBytes / comparison.jsonBytes) * 100}%`,
                background: '#10b981',
              }}
            />
          </div>
          <span className="bin-bar-val" style={{ color: '#10b981' }}>{comparison.protobufBytes} B</span>
        </div>
      </div>
    </section>
  )
}
