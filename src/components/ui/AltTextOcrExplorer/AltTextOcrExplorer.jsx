/**
 * @fileoverview Componente AltTextOcrExplorer — Auditor y Generador de Textos Alternativos Semánticos (WCAG 1.1.1 AAA).
 *
 * Permite evaluar textos alternativos en tiempo real, identificar malas prácticas comunes en descripciones de imágenes
 * y generar sugerencias semánticas automáticas para imágenes y diagramas.
 *
 * @module components/ui/AltTextOcrExplorer
 */

import { useState } from 'react'
import { evaluateAltText, generateSuggestedAlt } from '../../../utils/altTextOcrEngine'
import './AltTextOcrExplorer.css'

export default function AltTextOcrExplorer() {
  const [altInput, setAltInput] = useState('Captura de pantalla mostrando arquitectura de microservicios')
  const [fileName, setFileName] = useState('architecture-overview.svg')
  const [context, setContext] = useState('Diagrama de componentes con Kubernetes y Kafka Broker')
  const [isDecorative, setIsDecorative] = useState(false)

  const evaluation = evaluateAltText(altInput, isDecorative)

  const handleGenerate = () => {
    const suggested = generateSuggestedAlt(fileName, context)
    setAltInput(suggested)
    setIsDecorative(false)
  }

  return (
    <div className="alt-text-card" role="region" aria-label="Auditor y Generador de Textos Alternativos WCAG AAA">
      <div className="alt-text-card__header">
        <div className="alt-text-card__badge">⚡ Mejora 117</div>
        <h3 className="alt-text-card__title">Auditor y Generador Semántico de Textos Alternativos (WCAG 1.1.1)</h3>
        <p className="alt-text-card__subtitle">
          Garantiza que cada elemento visual posea una alternativa textual accesible de calidad según WCAG 2.1 Criterio 1.1.1 (Contenido no textual), eliminando descripciones redundantes.
        </p>
      </div>

      {/* Editor y Generador Asistido */}
      <div className="alt-text-editor-grid">
        <div className="alt-text-input-column">
          <div className="alt-text-field">
            <label htmlFor="input-img-filename" className="alt-text-label">Nombre del archivo gráfico:</label>
            <input
              id="input-img-filename"
              type="text"
              className="alt-text-input font-mono"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>

          <div className="alt-text-field">
            <label htmlFor="input-img-context" className="alt-text-label">Contexto funcional de la imagen:</label>
            <input
              id="input-img-context"
              type="text"
              className="alt-text-input"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          <div className="alt-text-field">
            <label htmlFor="input-img-alt" className="alt-text-label">Texto Alternativo (<code className="font-mono">alt="..."</code>):</label>
            <textarea
              id="input-img-alt"
              rows={3}
              className="alt-text-textarea"
              value={altInput}
              onChange={(e) => setAltInput(e.target.value)}
              disabled={isDecorative}
            />
          </div>

          <div className="alt-text-options-row">
            <label className="alt-text-checkbox-label">
              <input
                type="checkbox"
                checked={isDecorative}
                onChange={(e) => setIsDecorative(e.target.checked)}
              />
              <span>Es imagen puramente decorativa (<code className="font-mono">alt=""</code> o <code className="font-mono">role="presentation"</code>)</span>
            </label>

            <button
              type="button"
              className="alt-text-btn alt-text-btn--suggest"
              onClick={handleGenerate}
            >
              ✨ Autogenerar Texto Alternativo
            </button>
          </div>
        </div>

        {/* Panel de Diagnóstico en Vivo */}
        <div className="alt-text-diagnostics-column">
          <div className="alt-text-score-box">
            <span className="alt-text-score-label">Puntaje de Calidad WCAG</span>
            <span className={`alt-text-score-value font-bold ${evaluation.score >= 80 ? 'text-success' : evaluation.score >= 50 ? 'text-warning' : 'text-danger'}`}>
              {evaluation.score} / 100
            </span>
            <span className={`alt-text-badge alt-text-badge--${evaluation.quality}`}>
              {evaluation.isDecorative ? 'Decorativa (Conforme)' : evaluation.quality.toUpperCase()}
            </span>
          </div>

          <div className="alt-text-feedback-box">
            <span className="alt-text-feedback-title">Diagnóstico de Accesibilidad:</span>
            {evaluation.issues.length === 0 ? (
              <p className="alt-text-success-msg">
                ✅ El texto alternativo cumple con todos los criterios de concisión, significado y formato de WCAG AAA.
              </p>
            ) : (
              <ul className="alt-text-issues-list">
                {evaluation.issues.map((issue, idx) => (
                  <li key={idx} className="alt-text-issue-item">
                    ⚠️ {issue}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
