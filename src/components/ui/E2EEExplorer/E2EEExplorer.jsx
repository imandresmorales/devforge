/**
 * @fileoverview Componente UI para el Motor de Cifrado Extremo a Extremo (E2EE Explorer) (Mejora 66).
 *
 * Muestra:
 * - Emisor (Alice) ➔ Canal Inseguro / Red Man-in-the-Middle ➔ Receptor (Bob).
 * - Cifrado híbrido en tiempo real con Web Crypto API (RSA-OAEP 2048 + AES-256-GCM).
 * - Inspector de paquetes cifrados (Wrapped AES Key, IV, Ciphertext, Auth Tag).
 * - Botón de ataque MitM para simular alteración de bits en tránsito y probar la integridad GCM.
 *
 * @module components/ui/E2EEExplorer/E2EEExplorer
 */
import { useState, useEffect } from 'react'
import {
  generateRSAKeyPair,
  encryptHybridE2EE,
  decryptHybridE2EE,
} from '../../../utils/e2eeEngine'
import './E2EEExplorer.css'

export default function E2EEExplorer() {
  const [bobKeys, setBobKeys] = useState(null)
  const [plaintextInput, setPlaintextInput] = useState(
    'Hola Bob, aquí tienes el token de acceso privado: dforge_sec_99482710'
  )
  const [encryptedPacket, setEncryptedPacket] = useState(null)
  const [decryptedResult, setDecryptedResult] = useState(null)
  const [isTampered, setIsTampered] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Generar par de claves de Bob al montar el componente
  useEffect(() => {
    async function initKeys() {
      setIsGenerating(true)
      try {
        const keys = await generateRSAKeyPair()
        setBobKeys(keys)
      } catch (err) {
        setErrorMessage(err.message)
      } finally {
        setIsGenerating(false)
      }
    }
    initKeys()
  }, [])

  const handleEncrypt = async () => {
    if (!bobKeys || !plaintextInput.trim()) return
    setErrorMessage(null)
    setIsTampered(false)
    setDecryptedResult(null)

    try {
      const packet = await encryptHybridE2EE(plaintextInput, bobKeys.publicKey)
      setEncryptedPacket(packet)
    } catch (err) {
      setErrorMessage(`Error al cifrar: ${err.message}`)
    }
  }

  const handleTamper = () => {
    if (!encryptedPacket) return
    setIsTampered(true)
    // Alterar 4 caracteres del ciphertext
    const ct = encryptedPacket.ciphertext
    const tamperedCt = ct.substring(0, Math.max(0, ct.length - 6)) + 'XXXX=='
    setEncryptedPacket({
      ...encryptedPacket,
      ciphertext: tamperedCt,
    })
    setDecryptedResult(null)
  }

  const handleDecrypt = async () => {
    if (!encryptedPacket || !bobKeys) return
    setErrorMessage(null)

    try {
      const result = await decryptHybridE2EE(encryptedPacket, bobKeys.privateKey)
      setDecryptedResult(result)
    } catch (err) {
      setDecryptedResult(null)
      setErrorMessage(err.message)
    }
  }

  return (
    <section className="e2ee-explorer" aria-labelledby="e2ee-title">
      <div className="e2ee-explorer__header">
        <div>
          <span className="badge badge--brand">Criptografía W3C Web Crypto</span>
          <h2 id="e2ee-title" className="e2ee-explorer__title">
            Cifrado Extremo a Extremo (E2EE con RSA-OAEP & AES-256-GCM)
          </h2>
          <p className="e2ee-explorer__desc">
            Visualiza la arquitectura de seguridad utilizada por Signal y WhatsApp.
            Capa asimétrica RSA-2048 para intercambio de clave de sesión + Capa simétrica AES-GCM con autenticación de integridad.
          </p>
        </div>
      </div>

      {isGenerating && (
        <div className="e2ee-banner e2ee-banner--info">
          ⚙️ Generando par de claves criptográficas RSA-OAEP de 2048 bits en el cliente...
        </div>
      )}

      {errorMessage && (
        <div className="e2ee-banner e2ee-banner--error">
          🚨 {errorMessage}
        </div>
      )}

      <div className="e2ee-workflow-grid">
        {/* ── 1. Alice (Sender) ── */}
        <div className="e2ee-card e2ee-card--sender">
          <div className="e2ee-card__header">
            <span className="e2ee-card__avatar">👩‍💻</span>
            <div>
              <h3 className="e2ee-card__name">Alice (Emisora)</h3>
              <span className="e2ee-card__caption">Cifra en local antes de enviar</span>
            </div>
          </div>

          <div className="e2ee-card__body">
            <label className="e2ee-field-label">Mensaje en Texto Plano:</label>
            <textarea
              className="textarea e2ee-textarea"
              rows={3}
              value={plaintextInput}
              onChange={(e) => setPlaintextInput(e.target.value)}
              placeholder="Escribe el mensaje confidencial..."
            />

            <button
              type="button"
              className="btn-primary e2ee-action-btn"
              onClick={handleEncrypt}
              disabled={isGenerating || !bobKeys}
            >
              🔒 Cifrar con Clave Pública de Bob
            </button>
          </div>
        </div>

        {/* ── 2. Insecure Network / Inspector de Tránsito ── */}
        <div className="e2ee-card e2ee-card--network">
          <div className="e2ee-card__header">
            <span className="e2ee-card__avatar">🌐</span>
            <div>
              <h3 className="e2ee-card__name">Canal Inseguro (Red / Servidores)</h3>
              <span className="e2ee-card__caption">
                {isTampered ? '⚠️ Paquete Manipulado por MitM' : 'Paquete Cifrado en Tránsito'}
              </span>
            </div>
          </div>

          <div className="e2ee-card__body">
            {!encryptedPacket ? (
              <p className="e2ee-empty-state">Pulsa "Cifrar" en Alice para generar el paquete E2EE.</p>
            ) : (
              <div className="e2ee-packet-inspector">
                <div className="e2ee-packet-row">
                  <span className="e2ee-packet-label">Clave AES envuelta (RSA-OAEP):</span>
                  <code className="e2ee-packet-code">{encryptedPacket.wrappedKey.substring(0, 40)}...</code>
                </div>
                <div className="e2ee-packet-row">
                  <span className="e2ee-packet-label">Vector de Inicialización (IV):</span>
                  <code className="e2ee-packet-code">{encryptedPacket.iv}</code>
                </div>
                <div className="e2ee-packet-row">
                  <span className="e2ee-packet-label">Payload Cifrado + Tag (AES-GCM):</span>
                  <code className={`e2ee-packet-code ${isTampered ? 'e2ee-packet-code--tampered' : ''}`}>
                    {encryptedPacket.ciphertext}
                  </code>
                </div>

                <div className="e2ee-network-actions">
                  <button
                    type="button"
                    className="btn-danger btn-xs"
                    onClick={handleTamper}
                    disabled={isTampered}
                  >
                    🕵️ Modificar Datos (Simular Ataque MitM)
                  </button>
                  <button
                    type="button"
                    className="btn-success btn-xs"
                    onClick={handleDecrypt}
                  >
                    📥 Entregar a Bob
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Bob (Recipient) ── */}
        <div className="e2ee-card e2ee-card--recipient">
          <div className="e2ee-card__header">
            <span className="e2ee-card__avatar">👨‍💻</span>
            <div>
              <h3 className="e2ee-card__name">Bob (Destinatario)</h3>
              <span className="e2ee-card__caption">Posee la clave privada RSA</span>
            </div>
          </div>

          <div className="e2ee-card__body">
            <div className="e2ee-bob-keys">
              <span className="e2ee-key-status">
                🔑 Clave Pública SPKI: <code>{bobKeys?.publicKeyBase64?.substring(0, 30)}...</code>
              </span>
            </div>

            <div className="e2ee-decrypted-box">
              <span className="e2ee-field-label">Resultado del Descifrado:</span>
              {decryptedResult ? (
                <div className="e2ee-decrypted-content">
                  <span className="badge badge--success">✅ Verificado con Tag GCM</span>
                  <p className="e2ee-decrypted-text">{decryptedResult.plaintext}</p>
                </div>
              ) : (
                <p className="e2ee-empty-state">
                  Esperando entrega y descifrado con la clave privada de Bob.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
