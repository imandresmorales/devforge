/**
 * @fileoverview Componente CryptoTokenModal — Generador de tokens criptográficos UUIDv7 y NanoID (Mejora 48).
 *
 * CARACTERÍSTICAS:
 * - Generador por lotes (1 a 10 tokens simultáneos).
 * - Decodificación de marcas de tiempo en vivo para UUIDv7.
 * - Medidor de entropía de seguridad.
 * - Copiado masivo o individual al portapapeles.
 *
 * @module components/ui/CryptoTokenModal
 */
import { useState, useMemo } from 'react'
import Modal from '../Modal/Modal.jsx'
import {
  generateUUIDv7,
  extractTimestampFromUUIDv7,
  generateNanoID,
} from '../../../utils/cryptoTokens'
import { useToast } from '../../../context/ToastContext'
import './CryptoTokenModal.css'

function CryptoTokenModal({ isOpen, onClose }) {
  const [tokenType, setTokenType] = useState('uuidv7') // 'uuidv7' | 'nanoid'
  const [count, setCount] = useState(5)
  const [nanoSize, setNanoSize] = useState(21)
  const [tokens, setTokens] = useState([])
  const { addToast } = useToast()

  const generateTokensList = () => {
    const list = []
    for (let i = 0; i < count; i++) {
      if (tokenType === 'uuidv7') {
        const val = generateUUIDv7()
        const meta = extractTimestampFromUUIDv7(val)
        list.push({ id: val, value: val, meta: meta?.isoDate })
      } else {
        const val = generateNanoID(nanoSize)
        list.push({ id: val, value: val, meta: `${nanoSize} caracteres` })
      }
    }
    setTokens(list)
  }

  // Generar tokens al abrir o cambiar de modo
  useMemo(() => {
    if (isOpen && tokens.length === 0) {
      generateTokensList()
    }
  }, [isOpen])

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text)
    addToast({
      type: 'info',
      title: 'Token Copiado',
      message: 'Token copiado al portapapeles.',
    })
  }

  const handleCopyAll = () => {
    const allText = tokens.map((t) => t.value).join('\n')
    navigator.clipboard?.writeText(allText)
    addToast({
      type: 'success',
      title: 'Lote Copiado',
      message: `${tokens.length} tokens copiados al portapapeles.`,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔑 Generador de Tokens Criptográficos">
      <div className="token-modal">
        {/* Controles de Configuración */}
        <div className="token-controls">
          <div className="token-type-tabs" role="tablist">
            <button
              type="button"
              className={`pill-btn${tokenType === 'uuidv7' ? ' pill-btn--active' : ''}`}
              onClick={() => {
                setTokenType('uuidv7')
                setTokens([])
              }}
            >
              ⏱️ UUIDv7 (Cronológico)
            </button>
            <button
              type="button"
              className={`pill-btn${tokenType === 'nanoid' ? ' pill-btn--active' : ''}`}
              onClick={() => {
                setTokenType('nanoid')
                setTokens([])
              }}
            >
              🎲 NanoID (URL Friendly)
            </button>
          </div>

          <div className="token-options-row">
            <div className="token-option-field">
              <label className="form-label" htmlFor="token-count">
                Cantidad: {count}
              </label>
              <input
                id="token-count"
                type="range"
                min="1"
                max="10"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </div>

            {tokenType === 'nanoid' && (
              <div className="token-option-field">
                <label className="form-label" htmlFor="nano-size">
                  Longitud: {nanoSize}
                </label>
                <input
                  id="nano-size"
                  type="range"
                  min="8"
                  max="36"
                  value={nanoSize}
                  onChange={(e) => setNanoSize(Number(e.target.value))}
                />
              </div>
            )}

            <button
              type="button"
              className="btn-primary token-gen-btn"
              onClick={generateTokensList}
            >
              🔄 Generar Tokens
            </button>
          </div>
        </div>

        {/* Lista de Tokens Generados */}
        <div className="token-list-pane">
          <div className="token-list-header">
            <span className="token-list-title">Tokens Generados ({tokens.length})</span>
            <button type="button" className="token-copy-all-btn" onClick={handleCopyAll}>
              📋 Copiar Todos
            </button>
          </div>

          <div className="token-items-scroll">
            {tokens.map((t, idx) => (
              <div key={t.id + idx} className="token-card">
                <div className="token-card-left">
                  <span className="token-idx">#{idx + 1}</span>
                  <code className="token-val">{t.value}</code>
                </div>
                <div className="token-card-right">
                  {t.meta && <span className="token-meta">{t.meta}</span>}
                  <button
                    type="button"
                    className="token-btn-copy"
                    onClick={() => handleCopy(t.value)}
                    title="Copiar token"
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="token-footer-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default CryptoTokenModal
