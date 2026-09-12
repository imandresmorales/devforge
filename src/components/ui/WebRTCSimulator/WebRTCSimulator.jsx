/**
 * @fileoverview Componente WebRTCSimulator — Laboratorio Interactivo de Protocolo P2P WebRTC, DataChannels, ICE y SDP (Mejora 86).
 *
 * Muestra el ciclo completo de negociación JSEP (RFC 8829), recolección de candidatos ICE
 * (RFC 8445), resolución STUN/TURN según la topología NAT, y transmisión de datos bidireccional
 * mediante RTCDataChannel sobre DTLS/SCTP.
 *
 * @module components/ui/WebRTCSimulator
 */
import { useState, useRef, useEffect } from 'react'
import {
  SimulatedPeerConnection,
  NAT_TYPES,
  ICE_CANDIDATE_TYPES,
} from '../../../utils/webrtcSimulator'
import './WebRTCSimulator.css'

export default function WebRTCSimulator() {
  const [natA, setNatA] = useState('FULL_CONE')
  const [natB, setNatB] = useState('SYMMETRIC')

  const [step, setStep] = useState(0) // 0: Idle, 1: Offer Created, 2: Remote Offer & Answer, 3: Answer Set, 4: Connected
  const [activeTab, setActiveTab] = useState('sdpOffer') // 'sdpOffer' | 'sdpAnswer' | 'iceCandidates' | 'arch'

  const [messages, setMessages] = useState([
    { sender: 'System', text: 'Presiona "1. Crear Oferta (Alice)" para iniciar la negociación P2P.', time: '00:00:00' },
  ])
  const [inputMsg, setInputMsg] = useState('')
  const [activeSender, setActiveSender] = useState('peer-a')

  const [stats, setStats] = useState({
    latencyMs: 18,
    bytesSent: 0,
    bytesReceived: 0,
    transport: 'NONE',
    dataChannelState: 'closed',
  })

  // Instancias de los pares
  const pcARef = useRef(null)
  const pcBRef = useRef(null)
  const sdpOfferRef = useRef('')
  const sdpAnswerRef = useRef('')
  const messagesEndRef = useRef(null)

  // Inicializar pares
  useEffect(() => {
    resetSimulation()
  }, [natA, natB])

  const resetSimulation = () => {
    pcARef.current = new SimulatedPeerConnection('peer-a', { natType: NAT_TYPES[natA] })
    pcBRef.current = new SimulatedPeerConnection('peer-b', { natType: NAT_TYPES[natB] })
    sdpOfferRef.current = ''
    sdpAnswerRef.current = ''
    setStep(0)
    setStats({
      latencyMs: 18,
      bytesSent: 0,
      bytesReceived: 0,
      transport: 'NONE',
      dataChannelState: 'closed',
    })
    setMessages([
      { sender: 'System', text: `Sesión WebRTC reiniciada. Topología: Alice [${NAT_TYPES[natA].name}] ↔ Bob [${NAT_TYPES[natB].name}].`, time: new Date().toLocaleTimeString() },
    ])
  }

  // Paso 1: Alice crea DataChannel y Offer
  const handleCreateOffer = () => {
    const pcA = pcARef.current
    pcA.createDataChannel('telemetry', { ordered: true })
    const offer = pcA.createOffer()
    pcA.setLocalDescription(offer)
    sdpOfferRef.current = offer.sdp
    setStep(1)
    setActiveTab('sdpOffer')
    setMessages((prev) => [
      ...prev,
      { sender: 'Alice (Peer A)', text: 'Oferta SDP generada con parámetros DTLS/SCTP. Recolección ICE iniciada vía STUN.', time: new Date().toLocaleTimeString() },
    ])
  }

  // Paso 2: Bob recibe la oferta de Alice y crea su respuesta
  const handleReceiveOfferAndAnswer = () => {
    const pcB = pcBRef.current
    pcB.createDataChannel('telemetry', { ordered: true })
    pcB.setRemoteDescription({ type: 'offer', sdp: sdpOfferRef.current })
    const answer = pcB.createAnswer()
    pcB.setLocalDescription(answer)
    sdpAnswerRef.current = answer.sdp
    setStep(2)
    setActiveTab('sdpAnswer')
    setMessages((prev) => [
      ...prev,
      { sender: 'Bob (Peer B)', text: 'Oferta remota recibida. Generada Respuesta SDP (Answer) y candidatos ICE propios.', time: new Date().toLocaleTimeString() },
    ])
  }

  // Paso 3: Alice recibe la respuesta de Bob
  const handleSetRemoteAnswer = () => {
    const pcA = pcARef.current
    pcA.setRemoteDescription({ type: 'answer', sdp: sdpAnswerRef.current })
    setStep(3)
    setMessages((prev) => [
      ...prev,
      { sender: 'Alice (Peer A)', text: 'Respuesta remota procesada. Estado de señalización: STABLE. Iniciando Trickle ICE y comprobaciones de conectividad.', time: new Date().toLocaleTimeString() },
    ])
  }

  // Paso 4: Establecer conexión P2P e iniciar DataChannel
  const handleEstablishConnection = () => {
    const pcA = pcARef.current
    const pcB = pcBRef.current

    // Intercambio de candidatos ICE
    pcA.localCandidates.forEach((c) => pcB.addIceCandidate(c))
    pcB.localCandidates.forEach((c) => pcA.addIceCandidate(c))

    const res = pcA.connectWith(pcB)
    const isRelay = res.transportType === ICE_CANDIDATE_TYPES.RELAY
    const latency = isRelay ? 45 : 12

    setStats({
      latencyMs: latency,
      bytesSent: 0,
      bytesReceived: 0,
      transport: res.transportType.toUpperCase(),
      dataChannelState: 'open',
    })
    setStep(4)
    setActiveTab('iceCandidates')

    setMessages((prev) => [
      ...prev,
      {
        sender: 'WebRTC Core',
        text: `Handshake DTLS/SCTP completado con éxito. Enlace P2P ACTIVO [Vía: ${res.transportType.toUpperCase()}]. DataChannel "telemetry" ABIERTO (RTT: ${latency}ms).`,
        time: new Date().toLocaleTimeString(),
      },
    ])
  }

  // Enviar mensaje por DataChannel
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputMsg.trim() || step !== 4) return

    const pcSender = activeSender === 'peer-a' ? pcARef.current : pcBRef.current
    const pcReceiver = activeSender === 'peer-a' ? pcBRef.current : pcARef.current
    const senderName = activeSender === 'peer-a' ? 'Alice' : 'Bob'

    try {
      const msgResult = pcSender.sendMessage('telemetry', inputMsg, pcReceiver)
      setStats((prev) => ({
        ...prev,
        bytesSent: prev.bytesSent + msgResult.bytes,
        bytesReceived: prev.bytesReceived + msgResult.bytes,
      }))
      setMessages((prev) => [
        ...prev,
        { sender: senderName, text: inputMsg, time: msgResult.timestamp, bytes: msgResult.bytes },
      ])
      setInputMsg('')
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'Error', text: err.message, time: new Date().toLocaleTimeString() },
      ])
    }
  }

  return (
    <section className="webrtc-sim" aria-labelledby="webrtc-title">
      {/* ── Encabezado ── */}
      <div className="webrtc-sim__header">
        <div className="webrtc-sim__title-row">
          <h2 id="webrtc-title" className="webrtc-sim__title">
            <span>🌐</span> Simulador de Protocolo P2P WebRTC & DataChannels
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span className="badge badge--brand">Mejora 86</span>
            <span className="badge badge--success">W3C WebRTC 1.0</span>
            <span className="badge badge--neutral">RFC 8829 JSEP</span>
            <span className="badge badge--warning">DTLS / SCTP</span>
          </div>
        </div>
        <p className="webrtc-sim__desc">
          Laboratorio interactivo de comunicación Peer-to-Peer en tiempo real. Experimenta el flujo
          de señalización <strong>SDP Offer / Answer</strong>, recolección de candidatos <strong>ICE</strong>,
          traversal de NAT con <strong>STUN / TURN</strong> y canal de datos de baja latencia con <strong>RTCDataChannel</strong>.
        </p>
      </div>

      {/* ── Grid de Pares (Alice vs Bob) ── */}
      <div className="webrtc-sim__peers-grid">
        {/* Peer A: Alice */}
        <article className="webrtc-peer-card">
          <div className="webrtc-peer-card__header">
            <div className="webrtc-peer-card__title">
              <span>👩‍💻</span> Peer A (Alice / Local)
            </div>
            <div className="webrtc-peer-card__badges">
              <span className={`badge ${step >= 1 ? 'badge--brand' : 'badge--neutral'}`}>
                Signaling: {pcARef.current?.signalingState || 'stable'}
              </span>
              <span className={`badge ${step === 4 ? 'badge--success' : 'badge--neutral'}`}>
                ICE: {pcARef.current?.iceConnectionState || 'new'}
              </span>
            </div>
          </div>

          <div className="webrtc-peer-card__stat-row">
            <span>Topología NAT / Red:</span>
            <select
              value={natA}
              onChange={(e) => setNatA(e.target.value)}
              disabled={step > 0}
              style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', fontSize: '0.75rem', padding: '2px 6px' }}
            >
              <option value="OPEN_INTERNET">IP Pública Directa</option>
              <option value="FULL_CONE">Full Cone NAT (STUN)</option>
              <option value="PORT_RESTRICTED">Restricted NAT</option>
              <option value="SYMMETRIC">Symmetric NAT (TURN Relay)</option>
            </select>
          </div>

          <div className="webrtc-peer-card__stat-row">
            <span>IP Local / STUN:</span>
            <span className="webrtc-peer-card__stat-val">192.168.1.101 (srflx: 198.51.100.45)</span>
          </div>

          <div className="webrtc-peer-card__stat-row">
            <span>Candidatos ICE Recolectados:</span>
            <span className="webrtc-peer-card__stat-val">{pcARef.current?.localCandidates.length || 0}</span>
          </div>
        </article>

        {/* Peer B: Bob */}
        <article className="webrtc-peer-card">
          <div className="webrtc-peer-card__header">
            <div className="webrtc-peer-card__title">
              <span>👨‍💻</span> Peer B (Bob / Remote)
            </div>
            <div className="webrtc-peer-card__badges">
              <span className={`badge ${step >= 2 ? 'badge--brand' : 'badge--neutral'}`}>
                Signaling: {pcBRef.current?.signalingState || 'stable'}
              </span>
              <span className={`badge ${step === 4 ? 'badge--success' : 'badge--neutral'}`}>
                ICE: {pcBRef.current?.iceConnectionState || 'new'}
              </span>
            </div>
          </div>

          <div className="webrtc-peer-card__stat-row">
            <span>Topología NAT / Red:</span>
            <select
              value={natB}
              onChange={(e) => setNatB(e.target.value)}
              disabled={step > 0}
              style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', fontSize: '0.75rem', padding: '2px 6px' }}
            >
              <option value="OPEN_INTERNET">IP Pública Directa</option>
              <option value="FULL_CONE">Full Cone NAT (STUN)</option>
              <option value="PORT_RESTRICTED">Restricted NAT</option>
              <option value="SYMMETRIC">Symmetric NAT (TURN Relay)</option>
            </select>
          </div>

          <div className="webrtc-peer-card__stat-row">
            <span>IP Local / STUN:</span>
            <span className="webrtc-peer-card__stat-val">192.168.1.102 (srflx: 198.51.100.88)</span>
          </div>

          <div className="webrtc-peer-card__stat-row">
            <span>Candidatos ICE Recolectados:</span>
            <span className="webrtc-peer-card__stat-val">{pcBRef.current?.localCandidates.length || 0}</span>
          </div>
        </article>
      </div>

      {/* ── Flujo de Señalización (Stepper Controls) ── */}
      <div className="webrtc-sim__controls">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            PASOS DE LA NEGOCIACIÓN JSEP (OFFER / ANSWER & ICE):
          </span>
          <button
            type="button"
            className="webrtc-btn webrtc-btn--secondary"
            onClick={resetSimulation}
            style={{ fontSize: '0.72rem' }}
          >
            🔄 Reiniciar Negociación
          </button>
        </div>

        <div className="webrtc-sim__steps-track">
          <button
            type="button"
            className={`webrtc-btn ${step === 0 ? 'webrtc-btn--primary' : 'webrtc-btn--secondary'}`}
            onClick={handleCreateOffer}
            disabled={step !== 0}
          >
            1. Crear Oferta SDP (Alice)
          </button>

          <button
            type="button"
            className={`webrtc-btn ${step === 1 ? 'webrtc-btn--primary' : 'webrtc-btn--secondary'}`}
            onClick={handleReceiveOfferAndAnswer}
            disabled={step !== 1}
          >
            2. Recibir Oferta y Crear Answer (Bob)
          </button>

          <button
            type="button"
            className={`webrtc-btn ${step === 2 ? 'webrtc-btn--primary' : 'webrtc-btn--secondary'}`}
            onClick={handleSetRemoteAnswer}
            disabled={step !== 2}
          >
            3. Aplicar Remote Answer (Alice)
          </button>

          <button
            type="button"
            className={`webrtc-btn ${step === 3 ? 'webrtc-btn--primary' : 'webrtc-btn--secondary'}`}
            onClick={handleEstablishConnection}
            disabled={step !== 3}
          >
            4. Intercambiar ICE & Abrir DataChannel 🚀
          </button>
        </div>
      </div>

      {/* ── Consola P2P DataChannel en Vivo ── */}
      <div className="webrtc-datachannel-box">
        <div className="webrtc-datachannel__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#fff' }}>
              📡 Canal de Datos P2P (RTCDataChannel)
            </span>
            <span className={`badge ${stats.dataChannelState === 'open' ? 'badge--success' : 'badge--neutral'}`}>
              {stats.dataChannelState === 'open' ? '● OPEN' : '○ CLOSED'}
            </span>
            {stats.transport !== 'NONE' && (
              <span className="badge badge--brand">
                Transporte: {stats.transport}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            <span>RTT: <strong>{stats.latencyMs}ms</strong></span>
            <span>Bytes TX: <strong>{stats.bytesSent} B</strong></span>
            <span>Bytes RX: <strong>{stats.bytesReceived} B</strong></span>
          </div>
        </div>

        {/* Historial de Mensajes / Log de Señalización */}
        <div className="webrtc-datachannel__messages" aria-live="polite">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`webrtc-msg-item ${
                m.sender.includes('Alice') ? 'webrtc-msg-item--a' : m.sender.includes('Bob') ? 'webrtc-msg-item--b' : ''
              }`}
            >
              <span style={{ opacity: 0.6 }}>[{m.time}]</span>
              <strong>{m.sender}:</strong>
              <span>{m.text}</span>
              {m.bytes && <span style={{ opacity: 0.5 }}>({m.bytes} B)</span>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de Mensajes */}
        <form onSubmit={handleSendMessage} className="webrtc-datachannel__input-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Remitente:</label>
            <select
              value={activeSender}
              onChange={(e) => setActiveSender(e.target.value)}
              disabled={step !== 4}
              style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', fontSize: '0.75rem', padding: '4px 6px' }}
            >
              <option value="peer-a">Alice (Peer A)</option>
              <option value="peer-b">Bob (Peer B)</option>
            </select>
          </div>

          <input
            type="text"
            className="webrtc-datachannel__input"
            placeholder={step === 4 ? 'Escribe un payload o mensaje para transmitir por P2P DataChannel...' : 'Debes completar los 4 pasos para abrir el canal de datos...'}
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            disabled={step !== 4}
          />

          <button
            type="submit"
            className="webrtc-btn webrtc-btn--primary"
            disabled={step !== 4 || !inputMsg.trim()}
          >
            Enviar P2P ⚡
          </button>
        </form>
      </div>

      {/* ── Inspector de SDP e ICE ── */}
      <div className="webrtc-inspector">
        <div className="webrtc-inspector__tabs">
          <button
            type="button"
            className={`webrtc-inspector__tab ${activeTab === 'sdpOffer' ? 'webrtc-inspector__tab--active' : ''}`}
            onClick={() => setActiveTab('sdpOffer')}
          >
            📄 SDP Offer (Alice)
          </button>
          <button
            type="button"
            className={`webrtc-inspector__tab ${activeTab === 'sdpAnswer' ? 'webrtc-inspector__tab--active' : ''}`}
            onClick={() => setActiveTab('sdpAnswer')}
          >
            📄 SDP Answer (Bob)
          </button>
          <button
            type="button"
            className={`webrtc-inspector__tab ${activeTab === 'iceCandidates' ? 'webrtc-inspector__tab--active' : ''}`}
            onClick={() => setActiveTab('iceCandidates')}
          >
            🧊 Candidatos ICE ({pcARef.current?.localCandidates.length || 0})
          </button>
          <button
            type="button"
            className={`webrtc-inspector__tab ${activeTab === 'arch' ? 'webrtc-inspector__tab--active' : ''}`}
            onClick={() => setActiveTab('arch')}
          >
            🛡️ Arquitectura & Seguridad WebRTC
          </button>
        </div>

        <pre className="webrtc-inspector__content">
          {activeTab === 'sdpOffer' && (sdpOfferRef.current || 'La oferta SDP aún no ha sido generada. Haz clic en el Paso 1.')}
          {activeTab === 'sdpAnswer' && (sdpAnswerRef.current || 'La respuesta SDP aún no ha sido generada. Completa el Paso 2.')}
          {activeTab === 'iceCandidates' && (
            JSON.stringify(
              {
                peerA_candidates: pcARef.current?.localCandidates || [],
                peerB_candidates: pcBRef.current?.localCandidates || [],
                activePairing: stats.transport !== 'NONE' ? `Transporte Seleccionado: ${stats.transport}` : 'Pendiente de negociación',
              },
              null,
              2
            )
          )}
          {activeTab === 'arch' && (
`[ESPECIFICACIONES Y SEGURIDAD WEBRTC]:
1. Protocolo JSEP (RFC 8829): Desacopla la máquina de estados de señalización de la transmisión de medios.
2. DTLS 1.3 (RFC 8831): Todo el tráfico DataChannel y Media está cifrado de extremo a extremo obligatoriamente con PFS (Perfect Forward Secrecy).
3. SCTP Multiplexing (RFC 8832): Soporta canales ordenados y desordenados, retransmisiones configurables y control de congestión.
4. NAT Traversal (RFC 8445 ICE / RFC 5389 STUN / RFC 8656 TURN):
   - STUN: Descubre IP pública reflexiva (srflx) para UDP Hole Punching directo.
   - TURN: Actúa como servidor Relay seguro cuando ambos pares se encuentran detrás de Symmetric NATs impenetrables.`
          )}
        </pre>
      </div>
    </section>
  )
}
