/**
 * @fileoverview Componente DaltonismContrastManager — Gestor de Contraste Dinámico y Simulación de Daltonismo WCAG AAA.
 *
 * Permite cambiar los filtros de accesibilidad en vivo (Deuteranopía, Protanopía, Tritanopía, Acromatopsia, Alto Contraste)
 * y calcular ratios de contraste en tiempo real entre cualquier par de colores con indicador de conformidad WCAG.
 *
 * @module components/ui/DaltonismContrastManager
 */

import { useState } from 'react'
import {
  DALTONISM_MODES,
  applyVisionMode,
  calculateContrastRatio,
  evaluateWcagCompliance,
} from '../../../utils/contrastDaltonismEngine'
import './DaltonismContrastManager.css'

export default function DaltonismContrastManager() {
  const [selectedMode, setSelectedMode] = useState('normal')
  const [fgColor, setFgColor] = useState('#38bdf8')
  const [bgColor, setBgColor] = useState('#0f172a')

  const contrastRatio = calculateContrastRatio(fgColor, bgColor)
  const compliance = evaluateWcagCompliance(contrastRatio)

  const handleModeChange = (modeId) => {
    setSelectedMode(modeId)
    applyVisionMode(modeId)
  }

  return (
    <div className="daltonism-card" role="region" aria-label="Gestor de Contraste y Daltonismo WCAG AAA">
      <div className="daltonism-card__header">
        <div className="daltonism-card__badge">⚡ Mejora 114</div>
        <h3 className="daltonism-card__title">Gestor de Contraste Dinámico y Simulación de Daltonismo</h3>
        <p className="daltonism-card__subtitle">
          Adapta la interfaz para usuarios con deficiencias en la percepción del color (Deuteranopía, Protanopía, Tritanopía) y evalúa el ratio de contraste WCAG 2.1/2.2 Nivel AAA en tiempo real.
        </p>
      </div>

      {/* Selector de Filtros de Visión */}
      <div className="daltonism-mode-selector-section">
        <span className="daltonism-section-label">Modos de Asistencia Visual en Vivo:</span>
        <div className="daltonism-modes-grid">
          {DALTONISM_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`daltonism-mode-btn ${selectedMode === mode.id ? 'daltonism-mode-btn--active' : ''}`}
              onClick={() => handleModeChange(mode.id)}
            >
              <span className="daltonism-mode-btn__name">{mode.name}</span>
              <small className="daltonism-mode-btn__desc">{mode.description}</small>
            </button>
          ))}
        </div>
      </div>

      {/* Calculador de Contraste WCAG en Vivo */}
      <div className="daltonism-contrast-calculator">
        <h4 className="daltonism-calc-heading">🔍 Calculadora de Contraste WCAG AAA en Tiempo Real</h4>
        
        <div className="daltonism-calc-controls">
          <div className="daltonism-color-input-group">
            <label htmlFor="input-fg-color">Color de Texto (Primer Plano):</label>
            <div className="daltonism-color-picker-row">
              <input
                id="input-fg-color"
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="daltonism-color-picker"
              />
              <input
                type="text"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="daltonism-hex-input font-mono"
              />
            </div>
          </div>

          <div className="daltonism-color-input-group">
            <label htmlFor="input-bg-color">Color de Fondo:</label>
            <div className="daltonism-color-picker-row">
              <input
                id="input-bg-color"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="daltonism-color-picker"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="daltonism-hex-input font-mono"
              />
            </div>
          </div>
        </div>

        {/* Previsualización en Vivo */}
        <div
          className="daltonism-live-preview"
          style={{ backgroundColor: bgColor, color: fgColor }}
        >
          <span className="daltonism-preview-text">
            DevForge Architecture — Texto de prueba con renderizado y contraste activo.
          </span>
        </div>

        {/* Resultados de Cumplimiento */}
        <div className="daltonism-score-row">
          <div className="daltonism-score-pill">
            <span className="daltonism-score-label">Ratio de Contraste:</span>
            <span className="daltonism-score-value font-mono">{contrastRatio}:1</span>
          </div>

          <div className={`daltonism-score-pill daltonism-score-pill--${compliance.level === 'AAA' ? 'aaa' : compliance.level.startsWith('AA') ? 'aa' : 'fail'}`}>
            <span className="daltonism-score-label">Nivel de Conformidad:</span>
            <span className="daltonism-score-value">
              {compliance.level === 'AAA' ? '🏆 WCAG AAA' : compliance.level === 'AA' ? '✅ WCAG AA' : compliance.level === 'AA Large' ? '🟡 WCAG AA (Solo Grande)' : '🔴 Insuficiente'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
