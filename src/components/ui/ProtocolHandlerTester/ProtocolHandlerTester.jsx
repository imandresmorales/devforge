/**
 * @fileoverview Componente ProtocolHandlerTester — Probador de Protocol Handlers (web+devforge://) y PWA Manifest.
 *
 * Permite emular y verificar la resolución de URIs personalizadas de protocolo,
 * validar el esquema del manifiesto PWA bajo estándares W3C y previsualizar los App Shortcuts disponibles.
 *
 * @module components/ui/ProtocolHandlerTester
 */

import { useState } from 'react'
import {
  parseProtocolUri,
  validateManifest,
  DEVFORGE_PROTOCOL,
} from '../../../utils/pwaManifestEngine'
import './ProtocolHandlerTester.css'

const SAMPLE_MANIFEST = {
  name: 'DevForge — Plataforma para Desarrolladores',
  short_name: 'DevForge',
  start_url: '/',
  display: 'standalone',
  icons: [
    { src: '/icons/icon-192.svg', sizes: '192x192' },
    { src: '/icons/icon-512.svg', sizes: '512x512' },
  ],
  shortcuts: [
    { name: 'Docs', url: '/docs' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Pricing', url: '/pricing' },
    { name: 'Profile', url: '/profile' },
  ],
  protocol_handlers: [{ protocol: 'web+devforge', url: '/docs?uri=%s' }],
  file_handlers: [{ action: '/docs', accept: { 'text/json': ['.json'] } }],
  share_target: { action: '/contact', method: 'GET' },
  display_override: ['window-controls-overlay', 'standalone'],
}

export default function ProtocolHandlerTester() {
  const [testUri, setTestUri] = useState('web+devforge://docs?topic=pwa-manifest&section=shortcuts')
  const [parseResult, setParseResult] = useState(() => parseProtocolUri('web+devforge://docs?topic=pwa-manifest&section=shortcuts'))
  const [manifestReport] = useState(() => validateManifest(SAMPLE_MANIFEST))

  const handleTestUri = (e) => {
    e.preventDefault()
    setParseResult(parseProtocolUri(testUri))
  }

  const handlePreset = (uri) => {
    setTestUri(uri)
    setParseResult(parseProtocolUri(uri))
  }

  return (
    <div className="protocol-tester-card" role="region" aria-label="Probador de Protocol Handlers y Manifest PWA">
      <div className="protocol-tester-card__header">
        <div className="protocol-tester-card__badge">⚡ Mejora 105</div>
        <h3 className="protocol-tester-card__title">Probador de Protocol Handlers & Manifest PWA Avanzado</h3>
        <p className="protocol-tester-card__subtitle">
          Verifica el enrutamiento de enlaces profundos <code>web+devforge://</code>, accesos rápidos (Shortcuts) y conformidad W3C PWA.
        </p>
      </div>

      {/* Auditoría del Manifest */}
      <div className="protocol-tester-manifest-audit">
        <div className="protocol-tester-manifest-audit__header">
          <span>Puntuación de Cumplimiento W3C Manifest:</span>
          <span className="protocol-tester-manifest-audit__score">{manifestReport.score} / 100</span>
        </div>
        <div className="protocol-tester-features-list">
          {manifestReport.features.map((feat, i) => (
            <span key={i} className="protocol-tester-feature-tag">✅ {feat}</span>
          ))}
        </div>
      </div>

      {/* Probador interactivo de URI */}
      <form className="protocol-tester-form" onSubmit={handleTestUri}>
        <label htmlFor="protocol-uri-input">URI de Protocolo Personalizado:</label>
        <div className="protocol-tester-form__row">
          <input
            id="protocol-uri-input"
            type="text"
            className="protocol-tester-input"
            value={testUri}
            onChange={(e) => setTestUri(e.target.value)}
            placeholder={`${DEVFORGE_PROTOCOL}://docs?topic=...`}
            required
          />
          <button type="submit" className="protocol-tester-btn protocol-tester-btn--primary">
            🔍 Validar y Enrutar
          </button>
        </div>
      </form>

      {/* Atajos Rápidos de Prueba */}
      <div className="protocol-tester-presets">
        <span className="protocol-tester-presets__label">Ejemplos Rápidos:</span>
        <button
          type="button"
          className="protocol-tester-preset-btn"
          onClick={() => handlePreset('web+devforge://dashboard?view=stats')}
        >
          Ir a Dashboard
        </button>
        <button
          type="button"
          className="protocol-tester-preset-btn"
          onClick={() => handlePreset('web+devforge://pricing?tier=pro')}
        >
          Ver Planes Pro
        </button>
        <button
          type="button"
          className="protocol-tester-preset-btn"
          onClick={() => handlePreset('web+devforge://profile?tab=security')}
        >
          Seguridad de Perfil
        </button>
      </div>

      {/* Resultado del Enrutamiento */}
      <div className={`protocol-tester-result ${parseResult.valid ? 'protocol-tester-result--valid' : 'protocol-tester-result--invalid'}`}>
        <div className="protocol-tester-result__header">
          <strong>Estado de Resolución:</strong>
          <span>{parseResult.valid ? '🟢 Enlace Válido y Seguro' : '🔴 Rechazado por Seguridad o Sintaxis'}</span>
        </div>

        {parseResult.valid ? (
          <div className="protocol-tester-result__details">
            <p><strong>Destino Interno Sanitizado:</strong> <code>{parseResult.targetPath}</code></p>
            <p><strong>Parámetros Sanitizados:</strong></p>
            <pre className="protocol-tester-code">
              {JSON.stringify(parseResult.searchParams, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="protocol-tester-result__error">
            {parseResult.error}
          </div>
        )}
      </div>
    </div>
  )
}
