/**
 * @fileoverview Componente WebSocketLiveDemo — Monitor y Cliente WebSocket en vivo con chat interactivo (Mejora 46).
 *
 * CARACTERÍSTICAS:
 * - Indicador de estado de conexión WebSocket en vivo (CONNECTING / OPEN / CLOSED).
 * - Monitor de latencia Ping/Pong en milisegundos.
 * - Flujo de mensajes bi-direccionales (Eventos de Sistema, Cliente, ACK del Servidor).
 * - Botones de acción rápida para enviar payloads estructurados.
 * - Conmutador manual para simular caídas de red y reconexión.
 *
 * @module components/ui/WebSocketLiveDemo
 */
import { useState, useRef, useEffect } from 'react'
import useWebSocket, { WS_STATUS } from '../../../hooks/useWebSocket'
import './WebSocketLiveDemo.css'

function WebSocketLiveDemo() {
  const {
    status,
    isConnected,
    messages,
    latency,
    sendMessage,
    connect,
    disconnect,
    clearMessages,
  } = useWebSocket('wss://api.devforge.io/v1/stream')

  const [inputVal, setInputVal] = useState('')
  const logEndRef = useRef(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e?.preventDefault()
    if (!inputVal.trim() || !isConnected) return
    sendMessage(inputVal)
    setInputVal('')
  }

  const handleSendPreset = (text) => {
    if (!isConnected) return
    sendMessage(text)
  }

  return (
    <section className="ws-demo-section" aria-label="Cliente WebSocket en vivo">
      <div className="ws-header">
        <div>
          <h2 className="ws-title">⚡ Cliente WebSocket en Tiempo Real</h2>
          <p className="ws-subtitle">
            Transmisión bi-direccional de baja latencia con latidos Ping/Pong y reconexión resiliente.
          </p>
        </div>

        {/* Estado y Acciones de Conexión */}
        <div className="ws-status-bar">
          <div className="ws-status-badge">
            <span
              className={`ws-status-dot ws-status-dot--${
                status === WS_STATUS.OPEN
                  ? 'open'
                  : status === WS_STATUS.CONNECTING
                  ? 'connecting'
                  : 'closed'
              }`}
            />
            <span className="ws-status-text">
              {status === WS_STATUS.OPEN
                ? 'Conectado (OPEN)'
                : status === WS_STATUS.CONNECTING
                ? 'Estableciendo Conexión…'
                : 'Desconectado (CLOSED)'}
            </span>
          </div>

          {isConnected && (
            <div className="ws-latency-pill">
              <span>📶 {latency} ms</span>
            </div>
          )}

          {isConnected ? (
            <button type="button" className="btn-secondary ws-btn-sm" onClick={disconnect}>
              Desconectar
            </button>
          ) : (
            <button type="button" className="btn-primary ws-btn-sm" onClick={connect}>
              Conectar WebSocket
            </button>
          )}
        </div>
      </div>

      <div className="ws-container">
        {/* Presets de Eventos Rápidos */}
        <div className="ws-presets-bar">
          <span className="ws-presets-label">Eventos Rápidos:</span>
          <button
            type="button"
            className="ws-chip"
            disabled={!isConnected}
            onClick={() => handleSendPreset('PING_HEALTHCHECK')}
          >
            💓 Ping Heartbeat
          </button>
          <button
            type="button"
            className="ws-chip"
            disabled={!isConnected}
            onClick={() => handleSendPreset('METRIC_CPU_USAGE: 42.8%')}
          >
            📊 Enviar Métrica CPU
          </button>
          <button
            type="button"
            className="ws-chip"
            disabled={!isConnected}
            onClick={() => handleSendPreset('USER_ONLINE_EVENT')}
          >
            👤 Notificar Presencia
          </button>
          <button
            type="button"
            className="ws-chip ws-chip--clear"
            onClick={clearMessages}
            title="Limpiar registro de mensajes"
          >
            🗑️ Limpiar
          </button>
        </div>

        {/* Ventana de Mensajes */}
        <div className="ws-chat-pane">
          {messages.length === 0 ? (
            <div className="ws-chat-empty">
              <span>Esperando paquetes de datos por el canal WebSocket…</span>
            </div>
          ) : (
            <div className="ws-messages-list">
              {messages.map((m) => (
                <div key={m.id} className={`ws-msg-item ws-msg-item--${m.type}`}>
                  <div className="ws-msg-meta">
                    <span className="ws-msg-sender">{m.sender}</span>
                    <span className="ws-msg-time">{m.timestamp}</span>
                  </div>
                  <div className="ws-msg-body">{m.text}</div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>

        {/* Formulario de Entrada */}
        <form className="ws-input-form" onSubmit={handleSend}>
          <input
            type="text"
            className="ws-input-field"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={isConnected ? 'Escribe un mensaje o comando JSON…' : 'Conecta el WebSocket para transmitir…'}
            disabled={!isConnected}
            aria-label="Mensaje WebSocket"
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!isConnected || !inputVal.trim()}
          >
            Enviar 📤
          </button>
        </form>
      </div>
    </section>
  )
}

export default WebSocketLiveDemo
