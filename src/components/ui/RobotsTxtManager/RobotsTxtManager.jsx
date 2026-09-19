/**
 * @fileoverview Componente RobotsTxtManager — Gestor y simulador de directivas robots.txt en vivo.
 *
 * Permite a los desarrolladores y administradores probar cómo responden los rastreadores
 * (Googlebot, Bingbot, GPTBot, etc.) ante diferentes rutas de la aplicación y descargar el archivo robots.txt.
 *
 * @module components/ui/RobotsTxtManager
 */

import { useState } from 'react'
import {
  generateRobotsTxt,
  testRobotsPath,
} from '../../../utils/robotsEngine'
import './RobotsTxtManager.css'

export default function RobotsTxtManager() {
  const [robotsText, setRobotsText] = useState(generateRobotsTxt)
  const [selectedBot, setSelectedBot] = useState('Googlebot')
  const [testPath, setTestPath] = useState('/dashboard')
  const [testResult, setTestResult] = useState(() => testRobotsPath(robotsText, 'Googlebot', '/dashboard'))
  const [feedback, setFeedback] = useState(null)

  const handleTestPath = (e) => {
    e.preventDefault()
    const res = testRobotsPath(robotsText, selectedBot, testPath)
    setTestResult(res)
  }

  const handleDownload = () => {
    const blob = new Blob([robotsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'robots.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setFeedback({ type: 'success', text: 'Archivo robots.txt descargado exitosamente.' })
  }

  return (
    <div className="robots-manager-card" role="region" aria-label="Gestor de Directivas Robots.txt">
      <div className="robots-manager-card__header">
        <div className="robots-manager-card__badge">⚡ Mejora 111</div>
        <h3 className="robots-manager-card__title">Gestor y Probador de Directivas Robots.txt (RFC 9309)</h3>
        <p className="robots-manager-card__subtitle">
          Controla el acceso de rastreadores y bots de IA, garantizando el aislamiento de rutas privadas y la indexación de páginas públicas.
        </p>
      </div>

      {feedback && (
        <div className={`robots-manager-feedback robots-manager-feedback--${feedback.type}`} role="status">
          {feedback.text}
        </div>
      )}

      {/* Probador de Rutas */}
      <form className="robots-manager-tester-box" onSubmit={handleTestPath}>
        <h4 className="robots-manager-section-title">🔍 Comprobar Acceso de Rastreadores por Ruta</h4>
        <div className="robots-manager-tester-row">
          <div className="robots-manager-group" style={{ flex: 1 }}>
            <label htmlFor="robots-bot-select">Rastreador (User-Agent):</label>
            <select
              id="robots-bot-select"
              className="robots-manager-select"
              value={selectedBot}
              onChange={(e) => setSelectedBot(e.target.value)}
            >
              <option value="Googlebot">Googlebot (Google)</option>
              <option value="Bingbot">Bingbot (Microsoft Bing)</option>
              <option value="GPTBot">GPTBot (OpenAI Web Crawler)</option>
              <option value="*">* (Todos los demás bots)</option>
            </select>
          </div>

          <div className="robots-manager-group" style={{ flex: 2 }}>
            <label htmlFor="robots-path-input">Ruta a Evaluar:</label>
            <input
              id="robots-path-input"
              type="text"
              className="robots-manager-input"
              value={testPath}
              onChange={(e) => setTestPath(e.target.value)}
              placeholder="/dashboard o /docs"
              required
            />
          </div>

          <button type="submit" className="robots-manager-btn robots-manager-btn--primary" style={{ alignSelf: 'flex-end' }}>
            ⚡ Evaluar
          </button>
        </div>

        {/* Resultado de la evaluación */}
        <div className={`robots-manager-result ${testResult.allowed ? 'robots-manager-result--allowed' : 'robots-manager-result--blocked'}`}>
          <span className="robots-manager-result__icon">{testResult.allowed ? '🟢' : '🔴'}</span>
          <div>
            <strong>{testResult.allowed ? 'ACCESO PERMITIDO (ALLOWED)' : 'ACCESO BLOQUEADO (DISALLOWED)'}</strong>
            <div className="robots-manager-result__rule">Regla coincidente: <code>{testResult.matchedRule}</code></div>
          </div>
        </div>
      </form>

      {/* Editor y Visor de Texto */}
      <div className="robots-manager-editor-section">
        <div className="robots-manager-editor-header">
          <span>Contenido del robots.txt</span>
          <button type="button" className="robots-manager-btn robots-manager-btn--download" onClick={handleDownload}>
            📥 Descargar robots.txt
          </button>
        </div>
        <textarea
          className="robots-manager-textarea"
          rows={10}
          value={robotsText}
          onChange={(e) => setRobotsText(e.target.value)}
        />
      </div>
    </div>
  )
}
