/**
 * @fileoverview Tests unitarios para el Simulador de WebRTC P2P y DataChannels (Mejora 86).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  SimulatedPeerConnection,
  generateSdp,
  gatherIceCandidates,
  NAT_TYPES,
  ICE_CANDIDATE_TYPES,
} from './webrtcSimulator'

describe('WebRTC Simulator & DataChannels Engine (webrtcSimulator.js)', () => {
  describe('Generación de SDP y Formato RFC 8866 / RFC 8829', () => {
    it('debe generar una oferta SDP válida con directivas DTLS/SCTP', () => {
      const sdp = generateSdp('offer', 'session-1234')
      expect(sdp).toContain('v=0')
      expect(sdp).toContain('m=application 9 DTLS/SCTP 5000')
      expect(sdp).toContain('a=setup:actpass')
      expect(sdp).toContain('a=fingerprint:sha-256')
      expect(sdp).toContain('a=ice-options:trickle')
    })

    it('debe generar una respuesta SDP con setup active', () => {
      const sdp = generateSdp('answer', 'session-1234')
      expect(sdp).toContain('a=setup:active')
    })
  })

  describe('Recolección de Candidatos ICE y NAT Traversal', () => {
    it('debe recolectar candidatos host y srflx en redes con Full Cone NAT', () => {
      const candidates = gatherIceCandidates('peer-a', NAT_TYPES.FULL_CONE)
      const types = candidates.map((c) => c.type)

      expect(types).toContain(ICE_CANDIDATE_TYPES.HOST)
      expect(types).toContain(ICE_CANDIDATE_TYPES.SRFLX)
      expect(types).not.toContain(ICE_CANDIDATE_TYPES.RELAY)
    })

    it('debe incluir candidato relay TURN cuando la red es Symmetric NAT', () => {
      const candidates = gatherIceCandidates('peer-b', NAT_TYPES.SYMMETRIC)
      const types = candidates.map((c) => c.type)

      expect(types).toContain(ICE_CANDIDATE_TYPES.RELAY)
    })
  })

  describe('Flujo Completo de Negociación JSEP Offer / Answer y DataChannel', () => {
    let peerA
    let peerB

    beforeEach(() => {
      peerA = new SimulatedPeerConnection('peer-a', { natType: NAT_TYPES.FULL_CONE })
      peerB = new SimulatedPeerConnection('peer-b', { natType: NAT_TYPES.FULL_CONE })
    })

    it('debe completar la máquina de estados de señalización sin errores', () => {
      // 1. Peer A crea DataChannel y Offer
      const dcA = peerA.createDataChannel('chat', { ordered: true })
      expect(dcA.readyState).toBe('connecting')

      const offer = peerA.createOffer()
      peerA.setLocalDescription(offer)
      expect(peerA.signalingState).toBe('have-local-offer')

      // 2. Peer B recibe Offer y crea Answer
      peerB.setRemoteDescription(offer)
      expect(peerB.signalingState).toBe('have-remote-offer')

      const answer = peerB.createAnswer()
      peerB.setLocalDescription(answer)
      expect(peerB.signalingState).toBe('stable')

      // 3. Peer A recibe Answer
      peerA.setRemoteDescription(answer)
      expect(peerA.signalingState).toBe('stable')

      // 4. Conexión establecida
      const connectionRes = peerA.connectWith(peerB)
      expect(connectionRes.success).toBe(true)
      expect(peerA.iceConnectionState).toBe('connected')
      expect(peerB.iceConnectionState).toBe('connected')
      expect(dcA.readyState).toBe('open')
    })

    it('debe transmitir mensajes en tiempo real a través del DataChannel abierto', () => {
      peerA.createDataChannel('telemetry')
      peerB.createDataChannel('telemetry')

      const offer = peerA.createOffer()
      peerA.setLocalDescription(offer)
      peerB.setRemoteDescription(offer)
      const answer = peerB.createAnswer()
      peerB.setLocalDescription(answer)
      peerA.setRemoteDescription(answer)

      peerA.connectWith(peerB)

      const payload = 'Ping P2P WebRTC Latency: 12ms'
      const msg = peerA.sendMessage('telemetry', payload, peerB)

      expect(msg.senderId).toBe('peer-a')
      expect(msg.bytes).toBe(payload.length)

      const dcA = peerA.dataChannels.get('telemetry')
      const dcB = peerB.dataChannels.get('telemetry')
      expect(dcA.messagesSent).toBe(1)
      expect(dcB.messagesReceived).toBe(1)
    })

    it('debe fallar el envío si el DataChannel no está en estado abierto', () => {
      peerA.createDataChannel('unopened-channel')
      expect(() => {
        peerA.sendMessage('unopened-channel', 'Test payload', peerB)
      }).toThrow(/no está abierto/)
    })
  })
})
