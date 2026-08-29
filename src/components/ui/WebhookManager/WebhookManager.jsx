/**
 * @fileoverview Componente WebhookManager — Gestor de Webhooks y Simulador de Eventos en Vivo (Mejora 42).
 *
 * CARACTERÍSTICAS:
 * - Selector de plantillas de eventos (Stripe, GitHub, Auth).
 * - Generador e inspector de firmas criptográficas HMAC SHA-256 (`X-DevForge-Signature`).
 * - Simulación de despacho con medición de latencia y estado HTTP 200 OK.
 * - Registro histórico de eventos enviados.
 *
 * @module components/ui/WebhookManager
 */
import { useState } from 'react'
import {
  WEBHOOK_TEMPLATES,
  dispatchWebhookSimulated,
  generateWebhookSignature,
} from '../../../utils/webhook'
import { useToast } from '../../../context/ToastContext'
import './WebhookManager.css'

function WebhookManager() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(WEBHOOK_TEMPLATES[0].id)
  const [payloadText, setPayloadText] = useState(WEBHOOK_TEMPLATES[0].payload)
  const [secretKey, setSecretKey] = useState('whsec_live_devforge_2026')
  const [showSecret, setShowSecret] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [logs, setLogs] = useState([])
  const { addToast } = useToast()

  const handleTemplateChange = (tpl) => {
    setSelectedTemplateId(tpl.id)
    setPayloadText(tpl.payload)
  }

  const liveSignature = generateWebhookSignature(payloadText, secretKey)

  const handleDispatch = async (e) => {
    e.preventDefault()
    setIsSending(true)

    try {
      const currentTpl = WEBHOOK_TEMPLATES.find((t) => t.id === selectedTemplateId)
      const res = await dispatchWebhookSimulated({
        event: currentTpl?.event || 'custom.event',
        payload: payloadText,
        secret: secretKey,
      })

      setLogs((prev) => [res, ...prev.slice(0, 9)])

      addToast({
        type: 'success',
        title: 'Webhook Despachado (200 OK)',
        message: `Evento "${res.event}" enviado con éxito en ${res.latencyMs}ms con firma HMAC válida.`,
      })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Fallo de despacho',
        message: err.message,
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="webhook-manager-section" aria-label="Gestor de Webhooks">
      <div className="webhook-header">
        <div>
          <h2 className="webhook-title">🪝 Gestor de Webhooks & Verificación HMAC</h2>
          <p className="webhook-subtitle">
            Simula, inspecciona y verifica eventos en tiempo real con validación criptográfica SHA-256.
          </p>
        </div>

        <div className="webhook-templates">
          {WEBHOOK_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className={`webhook-chip${selectedTemplateId === tpl.id ? ' webhook-chip--active' : ''}`}
              onClick={() => handleTemplateChange(tpl)}
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </div>

      <div className="webhook-container">
        {/* Panel Izquierdo: Configuración del Evento */}
        <form className="webhook-editor-pane" onSubmit={handleDispatch}>
          <div className="webhook-field">
            <div className="webhook-field-header">
              <label className="form-label" htmlFor="wh-secret">
                Clave Secreta HMAC (Signing Secret):
              </label>
              <button
                type="button"
                className="wh-toggle-btn"
                onClick={() => setShowSecret((p) => !p)}
              >
                {showSecret ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <input
              id="wh-secret"
              type={showSecret ? 'text' : 'password'}
              className="form-input"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              required
            />
          </div>

          <div className="webhook-field">
            <label className="form-label" htmlFor="wh-payload">
              Carga Útil JSON (Payload):
            </label>
            <textarea
              id="wh-payload"
              className="webhook-textarea"
              rows={8}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              spellCheck={false}
            />
          </div>

          {/* Firma en vivo */}
          <div className="webhook-sig-box">
            <span className="webhook-sig-label">Firma Generada (X-DevForge-Signature):</span>
            <code className="webhook-sig-code">{liveSignature}</code>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSending}
            style={{ width: '100%' }}
          >
            {isSending ? 'Despachando...' : '🚀 Enviar Webhook de Prueba'}
          </button>
        </form>

        {/* Panel Derecho: Registro de Eventos en Tiempo Real */}
        <div className="webhook-logs-pane">
          <div className="webhook-logs-header">
            <span className="webhook-logs-title">Registro de Auditoría (Logs en Vivo)</span>
            <span className="badge badge--success">{logs.length} entregados</span>
          </div>

          {logs.length === 0 ? (
            <div className="webhook-logs-empty">
              <span style={{ fontSize: 'var(--text-2xl)' }}>📬</span>
              <p>Aún no has despachado ningún webhook. Haz clic en "Enviar Webhook de Prueba".</p>
            </div>
          ) : (
            <div className="webhook-logs-list">
              {logs.map((log) => (
                <div key={log.id} className="webhook-log-item">
                  <div className="webhook-log-top">
                    <span className="badge badge--success">HTTP {log.status} {log.statusText}</span>
                    <span className="webhook-log-event">{log.event}</span>
                    <span className="webhook-log-time">{log.latencyMs} ms</span>
                  </div>
                  <div className="webhook-log-sig">
                    <small>Firma:</small> <code>{log.signature.slice(0, 24)}...</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default WebhookManager
