/**
 * @fileoverview Simulador de Protocolo WebRTC P2P, DataChannels, ICE y SDP (Mejora 86).
 *
 * CARACTERÍSTICAS Y ESTÁNDARES:
 * - W3C WebRTC 1.0 (RFC 8829 JSEP - JavaScript Session Establishment Protocol).
 * - RFC 5245 / RFC 8445: ICE (Interactive Connectivity Establishment).
 * - RFC 5389 (STUN) y RFC 5766 / RFC 8656 (TURN).
 * - RFC 8831 / RFC 8832: WebRTC Data Channels sobre SCTP/DTLS.
 * - Máquina de estados de señalización, recolección de candidatos ICE y negociación SDP offer/answer.
 * - Simulación de NAT Traversal (Directo, Full Cone, Symmetric NAT con relay TURN).
 *
 * @module utils/webrtcSimulator
 */

/**
 * Tipos de candidatos ICE según RFC 8445.
 */
export const ICE_CANDIDATE_TYPES = {
  HOST: 'host',     // Dirección IP local en la interfaz de red
  SRFLX: 'srflx',   // Server Reflexive (obtenida mediante STUN público)
  PRFLX: 'prflx',   // Peer Reflexive
  RELAY: 'relay',   // Reenviada a través de un servidor TURN
}

/**
 * Tipos de NAT y comportamiento de traversal.
 */
export const NAT_TYPES = {
  OPEN_INTERNET: {
    id: 'open',
    name: 'Internet Abierta / IP Pública',
    directConnection: true,
    requiresTurn: false,
    stunSuccess: true,
  },
  FULL_CONE: {
    id: 'full_cone',
    name: 'Full Cone NAT (STUN suficiente)',
    directConnection: true,
    requiresTurn: false,
    stunSuccess: true,
  },
  PORT_RESTRICTED: {
    id: 'port_restricted',
    name: 'Restricted Cone NAT (STUN + Hole Punching)',
    directConnection: true,
    requiresTurn: false,
    stunSuccess: true,
  },
  SYMMETRIC: {
    id: 'symmetric',
    name: 'Symmetric NAT (Requiere TURN Relay)',
    directConnection: false,
    requiresTurn: true,
    stunSuccess: false,
  },
}

/**
 * Genera un SDP (Session Description Protocol) simulado conforme a RFC 8866 / RFC 8829.
 *
 * @param {'offer'|'answer'} type
 * @param {string} sessionId
 * @param {Object} options
 * @returns {string} Texto SDP formateado
 */
export function generateSdp(type, sessionId, options = {}) {
  const {
    fingerprint = '7A:3F:28:C1:B4:90:DE:AA:12:44:FE:89:01:BC:CD:EF:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00',
    iceUfrag = Math.random().toString(36).substring(2, 8),
    icePwd = Math.random().toString(36).substring(2, 16),
    mediaType = 'application',
  } = options

  const lines = [
    'v=0',
    `o=- ${sessionId} 2 IN IP4 127.0.0.1`,
    `s=DevForge WebRTC DataChannel Session (${type})`,
    't=0 0',
    'a=group:BUNDLE 0',
    'a=msid-semantic: WMS',
    `m=${mediaType} 9 DTLS/SCTP 5000`,
    'c=IN IP4 0.0.0.0',
    `a=ice-ufrag:${iceUfrag}`,
    `a=ice-pwd:${icePwd}`,
    'a=ice-options:trickle',
    'a=fingerprint:sha-256 ' + fingerprint,
    `a=setup:${type === 'offer' ? 'actpass' : 'active'}`,
    'a=mid:0',
    'a=sctp-port:5000',
    'a=max-message-size:262144',
  ]

  return lines.join('\r\n')
}

/**
 * Genera candidatos ICE simulados para un Peer.
 *
 * @param {string} peerId
 * @param {Object} natConfig
 * @returns {Array<Object>} Lista de candidatos ICE
 */
export function gatherIceCandidates(peerId, natConfig = NAT_TYPES.FULL_CONE) {
  const foundation = Math.floor(100000 + Math.random() * 900000)
  const candidates = []

  // 1. Host candidate (LAN IP)
  candidates.push({
    candidate: `candidate:${foundation} 1 udp 2122260223 192.168.1.${peerId === 'peer-a' ? '101' : '102'} 54321 typ host generation 0`,
    sdpMid: '0',
    sdpMLineIndex: 0,
    type: ICE_CANDIDATE_TYPES.HOST,
    protocol: 'UDP',
    ip: `192.168.1.${peerId === 'peer-a' ? '101' : '102'}`,
    port: 54321,
    priority: 2122260223,
  })

  // 2. STUN Server Reflexive candidate (IP pública mapeada)
  if (natConfig.id !== 'open') {
    candidates.push({
      candidate: `candidate:${foundation + 1} 1 udp 1686052607 198.51.100.${peerId === 'peer-a' ? '45' : '88'} 49152 typ srflx raddr 192.168.1.${peerId === 'peer-a' ? '101' : '102'} rport 54321 generation 0`,
      sdpMid: '0',
      sdpMLineIndex: 0,
      type: ICE_CANDIDATE_TYPES.SRFLX,
      protocol: 'UDP',
      ip: `198.51.100.${peerId === 'peer-a' ? '45' : '88'}`,
      port: 49152,
      priority: 1686052607,
    })
  }

  // 3. TURN Relay candidate (Si NAT es simétrico o configurado)
  if (natConfig.requiresTurn) {
    candidates.push({
      candidate: `candidate:${foundation + 2} 1 udp 41623807 203.0.113.199 3478 typ relay raddr 198.51.100.${peerId === 'peer-a' ? '45' : '88'} rport 49152 generation 0`,
      sdpMid: '0',
      sdpMLineIndex: 0,
      type: ICE_CANDIDATE_TYPES.RELAY,
      protocol: 'UDP',
      ip: '203.0.113.199',
      port: 3478,
      priority: 41623807,
    })
  }

  return candidates
}

/**
 * Clase que simula una RTCPeerConnection con DataChannels.
 */
export class SimulatedPeerConnection {
  /**
   * @param {string} id - Identificador del peer ('peer-a' o 'peer-b')
   * @param {Object} [config] - Configuración RTCConfiguration
   */
  constructor(id, config = {}) {
    this.id = id
    this.config = {
      iceServers: config.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'turn:turn.devforge.app:3478', username: 'devforge', credential: 'secret-token-turn' },
      ],
      natType: config.natType || NAT_TYPES.FULL_CONE,
    }

    this.signalingState = 'stable' // 'stable' | 'have-local-offer' | 'have-remote-offer' | 'closed'
    this.iceConnectionState = 'new' // 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'closed'
    this.iceGatheringState = 'new'  // 'new' | 'gathering' | 'complete'

    this.localDescription = null
    this.remoteDescription = null
    this.localCandidates = []
    this.remoteCandidates = []
    this.dataChannels = new Map() // label -> channel
    this.historyLogs = []

    this.log(`RTCPeerConnection instanciada para [${this.id}]`)
  }

  log(msg) {
    this.historyLogs.push({
      timestamp: new Date().toLocaleTimeString(),
      msg,
    })
  }

  /**
   * Crea una oferta SDP (Offer).
   * @returns {Object} { type: 'offer', sdp: string }
   */
  createOffer() {
    if (this.signalingState !== 'stable') {
      throw new Error(`No se puede crear oferta en estado de señalización: ${this.signalingState}`)
    }
    const sdp = generateSdp('offer', Date.now().toString(), {
      mediaType: 'application',
    })
    this.log('Oferta SDP creada (createOffer)')
    return { type: 'offer', sdp }
  }

  /**
   * Establece la descripción local (Local Description).
   * @param {Object} desc - { type, sdp }
   */
  setLocalDescription(desc) {
    this.localDescription = desc
    if (desc.type === 'offer') {
      this.signalingState = 'have-local-offer'
    } else if (desc.type === 'answer') {
      this.signalingState = 'stable'
    }

    // Iniciar recolección ICE simulada
    this.iceGatheringState = 'gathering'
    this.localCandidates = gatherIceCandidates(this.id, this.config.natType)
    this.iceGatheringState = 'complete'
    this.log(`Descripción local establecida (${desc.type}). Recolección ICE completada (${this.localCandidates.length} candidatos).`)
  }

  /**
   * Establece la descripción remota (Remote Description).
   * @param {Object} desc - { type, sdp }
   */
  setRemoteDescription(desc) {
    this.remoteDescription = desc
    if (desc.type === 'offer') {
      this.signalingState = 'have-remote-offer'
    } else if (desc.type === 'answer') {
      this.signalingState = 'stable'
    }
    this.log(`Descripción remota establecida (${desc.type}). Estado de señalización: ${this.signalingState}`)
  }

  /**
   * Crea una respuesta SDP (Answer) a partir de una oferta recibida.
   * @returns {Object} { type: 'answer', sdp: string }
   */
  createAnswer() {
    if (this.signalingState !== 'have-remote-offer') {
      throw new Error(`Se requiere haber recibido una oferta remota para crear respuesta. Estado actual: ${this.signalingState}`)
    }
    const sdp = generateSdp('answer', Date.now().toString())
    this.log('Respuesta SDP creada (createAnswer)')
    return { type: 'answer', sdp }
  }

  /**
   * Agrega un candidato ICE remoto.
   * @param {Object} candidate
   */
  addIceCandidate(candidate) {
    this.remoteCandidates.push(candidate)
    this.log(`Candidato ICE remoto añadido: ${candidate.type} (${candidate.ip}:${candidate.port})`)
  }

  /**
   * Crea un RTCDataChannel para transmisión bidireccional P2P.
   * @param {string} label
   * @param {Object} [options]
   */
  createDataChannel(label = 'chat', options = {}) {
    const channel = {
      label,
      ordered: options.ordered !== undefined ? options.ordered : true,
      maxRetransmits: options.maxRetransmits || null,
      readyState: 'connecting',
      messagesSent: 0,
      bytesSent: 0,
      messagesReceived: 0,
      bytesReceived: 0,
    }
    this.dataChannels.set(label, channel)
    this.log(`RTCDataChannel creado: '${label}' [ordered=${channel.ordered}]`)
    return channel
  }

  /**
   * Simula el establecimiento completo del handshake DTLS/ICE entre dos pares.
   * @param {SimulatedPeerConnection} remotePeer
   */
  connectWith(remotePeer) {
    this.iceConnectionState = 'checking'
    remotePeer.iceConnectionState = 'checking'

    // Evaluar si ambos pares pueden conectarse directamente o requieren TURN
    const peerANat = this.config.natType
    const peerBNat = remotePeer.config.natType

    const requiresTurn = peerANat.requiresTurn || peerBNat.requiresTurn
    const selectedCandidateType = requiresTurn ? ICE_CANDIDATE_TYPES.RELAY : ICE_CANDIDATE_TYPES.SRFLX

    this.iceConnectionState = 'connected'
    remotePeer.iceConnectionState = 'connected'

    // Abrir DataChannels
    for (const channel of this.dataChannels.values()) {
      channel.readyState = 'open'
    }
    for (const channel of remotePeer.dataChannels.values()) {
      channel.readyState = 'open'
    }

    this.log(`Conexión P2P ICE establecida con éxito [Vía: ${selectedCandidateType.toUpperCase()}]`)
    remotePeer.log(`Conexión P2P ICE establecida con éxito [Vía: ${selectedCandidateType.toUpperCase()}]`)

    return {
      success: true,
      transportType: selectedCandidateType,
      natPairing: `${peerANat.name} <-> ${peerBNat.name}`,
    }
  }

  /**
   * Envía un mensaje a través del canal de datos.
   * @param {string} label
   * @param {string} text
   * @param {SimulatedPeerConnection} remotePeer
   */
  sendMessage(label, text, remotePeer) {
    const channel = this.dataChannels.get(label)
    if (!channel || channel.readyState !== 'open') {
      throw new Error(`El canal de datos '${label}' no está abierto para transmisión.`)
    }

    const byteLength = new TextEncoder().encode(text).length
    channel.messagesSent += 1
    channel.bytesSent += byteLength

    const remoteChannel = remotePeer.dataChannels.get(label)
    if (remoteChannel) {
      remoteChannel.messagesReceived += 1
      remoteChannel.bytesReceived += byteLength
    }

    this.log(`[TX] DataChannel '${label}': "${text}" (${byteLength} bytes)`)
    remotePeer.log(`[RX] DataChannel '${label}': "${text}" (${byteLength} bytes)`)

    return {
      senderId: this.id,
      text,
      bytes: byteLength,
      timestamp: new Date().toLocaleTimeString(),
    }
  }

  /**
   * Cierra la conexión y libera recursos.
   */
  close() {
    this.signalingState = 'closed'
    this.iceConnectionState = 'closed'
    for (const ch of this.dataChannels.values()) {
      ch.readyState = 'closed'
    }
    this.log('RTCPeerConnection cerrada')
  }
}
