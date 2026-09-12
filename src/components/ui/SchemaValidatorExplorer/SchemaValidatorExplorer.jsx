/**
 * @fileoverview Componente UI para el Motor de Verificación de Contratos y Validación de Schemas (Mejora 85).
 *
 * Muestra:
 * - Diseñador y probador interactivo de Contratos de API (Zod / JSON Schema).
 * - Protección en vivo contra inyección de campos no autorizados (Mass Assignment Attack / OWASP API3).
 * - Editor JSON interactivo con feedback instantáneo y desglose de errores por ruta de campo.
 * - Generador y visualizador de especificaciones OpenAPI 3.0 / JSON Schema v7.
 *
 * @module components/ui/SchemaValidatorExplorer/SchemaValidatorExplorer
 */
import { useState, useMemo } from 'react'
import { Contract } from '../../../utils/schemaValidator'
import './SchemaValidatorExplorer.css'

const SCHEMA_PRESETS = [
  {
    id: 'user_registration',
    label: '👤 Registro de Usuario (Estricto)',
    desc: 'Valida email, contraseña, rol y bloquea propiedades inyectadas como isAdmin.',
    schemaBuilder: () =>
      Contract.object({
        username: Contract.string().min(3).max(20),
        email: Contract.string().email(),
        age: Contract.number().int().min(18).max(120),
        role: Contract.enum(['USER', 'EDITOR', 'ADMIN']),
        newsletter: Contract.boolean().optional(),
      }).strict(),
    validSample: `{
  "username": "alex_dev",
  "email": "alex@devforge.app",
  "age": 28,
  "role": "USER",
  "newsletter": true
}`,
    maliciousSample: `{
  "username": "hacker_404",
  "email": "hacker@evil.com",
  "age": 30,
  "role": "USER",
  "isAdmin": true,
  "superUserBypass": true
}`,
  },
  {
    id: 'payment_checkout',
    label: '💳 Checkout de Pago y Facturación',
    desc: 'Valida monto mínimo, moneda, items del carrito y dirección de entrega.',
    schemaBuilder: () =>
      Contract.object({
        orderId: Contract.string().regex(/^ord_[a-zA-Z0-9]+$/, 'Debe comenzar con ord_'),
        amount: Contract.number().min(1.00),
        currency: Contract.enum(['USD', 'EUR', 'GBP']),
        items: Contract.array(
          Contract.object({
            sku: Contract.string().min(3),
            quantity: Contract.number().int().min(1),
            price: Contract.number().min(0.50),
          })
        ).min(1),
      }).strict(),
    validSample: `{
  "orderId": "ord_99812a",
  "amount": 149.90,
  "currency": "EUR",
  "items": [
    { "sku": "REACT-PRO", "quantity": 1, "price": 99.90 },
    { "sku": "DEV-SHIRT", "quantity": 2, "price": 25.00 }
  ]
}`,
    maliciousSample: `{
  "orderId": "invalid_id_format",
  "amount": -50.00,
  "currency": "BITCOIN",
  "items": []
}`,
  },
]

export default function SchemaValidatorExplorer() {
  const [selectedPresetId, setSelectedPresetId] = useState('user_registration')
  const [isStrictMode, setIsStrictMode] = useState(true)
  const [activeTab, setActiveTab] = useState('tester') // 'tester' | 'openapi'

  const activePreset = SCHEMA_PRESETS.find((p) => p.id === selectedPresetId) || SCHEMA_PRESETS[0]
  const [jsonInput, setJsonInput] = useState(activePreset.validSample)

  const schema = useMemo(() => {
    let s = activePreset.schemaBuilder()
    if (!isStrictMode) {
      // Recrear sin strict si está desactivado
      s._isStrict = false
    }
    return s
  }, [activePreset, isStrictMode])

  const openApiSpec = useMemo(() => {
    return JSON.stringify(schema.toJSONSchema(), null, 2)
  }, [schema])

  // Validación en tiempo real
  const validationResult = useMemo(() => {
    try {
      const parsedJson = JSON.parse(jsonInput)
      const res = schema.safeParse(parsedJson)
      return { jsonValid: true, ...res }
    } catch (err) {
      return {
        jsonValid: false,
        success: false,
        errors: [{ path: 'JSON_SYNTAX', message: `Sintaxis JSON inválida: ${err.message}`, code: 'SYNTAX_ERROR' }],
      }
    }
  }, [jsonInput, schema])

  const handleSelectPreset = (p) => {
    setSelectedPresetId(p.id)
    setJsonInput(p.validSample)
  }

  return (
    <section className="schema-validator-explorer" aria-labelledby="sve-title">
      {/* ── Header ── */}
      <div className="sve-header">
        <div>
          <span className="badge badge--brand">Seguridad de API & Type Safety (OWASP API3)</span>
          <h2 id="sve-title" className="sve-title">
            Motor de Validación de Contratos y Schemas Runtime
          </h2>
          <p className="sve-desc">
            Garantiza la integridad de datos entre cliente y servidor. Bloquea ataques de <strong>Mass Assignment</strong>
            (inyección de atributos de privilegio) y exporta especificaciones OpenAPI 3.0 estándar.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="sve-status-pill">
          <span className="sve-status-label">Resultado:</span>
          <span className={`badge badge--${validationResult.success ? 'success' : 'danger'}`}>
            {validationResult.success ? '✅ CONTRATO VÁLIDO' : '❌ FALLO DE CONTRATO'}
          </span>
        </div>
      </div>

      {/* ── Controles de Presets ── */}
      <div className="sve-controls-bar">
        <div className="sve-preset-group">
          <span className="sve-control-label">Contrato de API:</span>
          <div className="sve-btn-group">
            {SCHEMA_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`btn-xs ${selectedPresetId === p.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSelectPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botones de Payload de Prueba */}
        <div className="sve-sample-buttons">
          <button
            type="button"
            className="btn-xs btn-success"
            onClick={() => setJsonInput(activePreset.validSample)}
          >
            ✨ Cargar Payload Válido
          </button>
          <button
            type="button"
            className="btn-xs btn-danger"
            onClick={() => setJsonInput(activePreset.maliciousSample)}
          >
            🚨 Inyectar Ataque / Inválido
          </button>
        </div>

        {/* Toggle Modo Estricto */}
        <div className="sve-toggle-strict">
          <label className="sve-switch-label">
            <input
              type="checkbox"
              checked={isStrictMode}
              onChange={(e) => setIsStrictMode(e.target.checked)}
            />
            <span>🛡️ Modo Estricto (.strict() Anti Mass-Assignment)</span>
          </label>
        </div>
      </div>

      {/* ── Selector de Pestañas ── */}
      <div className="sve-tabs">
        <button
          type="button"
          className={`sve-tab-btn ${activeTab === 'tester' ? 'sve-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('tester')}
        >
          🔍 Validador Interactivo & Inspector de Errores
        </button>
        <button
          type="button"
          className={`sve-tab-btn ${activeTab === 'openapi' ? 'sve-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('openapi')}
        >
          📄 Especificación OpenAPI 3.0 / JSON Schema
        </button>
      </div>

      {/* ── Tab 1: Tester Interactivo ── */}
      {activeTab === 'tester' && (
        <div className="sve-tester-grid">
          {/* Editor JSON */}
          <div className="sve-panel">
            <div className="sve-panel-head">
              <span className="sve-panel-title">Payload JSON Recibido (Petición HTTP)</span>
              <small>{jsonInput.length} caracteres</small>
            </div>
            <textarea
              className="sve-textarea"
              rows={12}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Introduce un objeto JSON para validar contra el schema..."
            />
          </div>

          {/* Resultado de Validación y Errores */}
          <div className="sve-panel">
            <div className="sve-panel-head">
              <span className="sve-panel-title">
                {validationResult.success ? 'Datos Sanitizados y Tipados' : 'Diagnóstico de Errores de Contrato'}
              </span>
              <span className={`badge badge--${validationResult.success ? 'success' : 'danger'}`}>
                {validationResult.success ? '0 Errores' : `${validationResult.errors?.length || 1} Errores`}
              </span>
            </div>

            {validationResult.success ? (
              <div className="sve-success-box">
                <span className="sve-success-title">✨ Validación Exitosa (Zero Trust Boundary)</span>
                <p>Todos los tipos, rangos y restricciones pasaron la verificación formal.</p>
                <pre className="sve-code-preview">{JSON.stringify(validationResult.data, null, 2)}</pre>
              </div>
            ) : (
              <div className="sve-errors-list">
                {validationResult.errors?.map((err, idx) => (
                  <div key={idx} className="sve-error-item">
                    <div className="sve-error-top">
                      <code className="sve-error-path">{err.path || 'root'}</code>
                      <span className="badge badge--danger">{err.code}</span>
                    </div>
                    <p className="sve-error-msg">{err.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 2: OpenAPI Spec ── */}
      {activeTab === 'openapi' && (
        <div className="sve-openapi-section">
          <div className="sve-openapi-head">
            <span>Contrato Generado Automáticamente para Documentación de API y SDKs:</span>
            <span className="badge badge--brand">JSON Schema v7 / OpenAPI 3.0</span>
          </div>
          <pre className="sve-code-preview">{openApiSpec}</pre>
        </div>
      )}
    </section>
  )
}
