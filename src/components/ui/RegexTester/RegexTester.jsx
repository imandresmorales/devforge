/**
 * @fileoverview Componente RegexTester — Tester interactivo de expresiones regulares en vivo (Mejora 43).
 *
 * CARACTERÍSTICAS:
 * - Resaltado visual en tiempo real de coincidencias y captura de grupos.
 * - Conmutador de modificadores de expresión regular (g, i, m, s).
 * - Catálogo de patrones predefinidos (Email, UUID, IPv4, JWT, etc.).
 * - Protección defensiva contra ReDoS integrada.
 *
 * @module components/ui/RegexTester
 */
import { useState, useMemo } from 'react'
import { REGEX_PRESETS, testRegex } from '../../../utils/regexHelper'
import './RegexTester.css'

function RegexTester() {
  const [selectedPresetId, setSelectedPresetId] = useState(REGEX_PRESETS[0].id)
  const [pattern, setPattern] = useState(REGEX_PRESETS[0].pattern)
  const [flags, setFlags] = useState(REGEX_PRESETS[0].flags || 'g')
  const [sampleText, setSampleText] = useState(REGEX_PRESETS[0].sample)

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id)
    setPattern(preset.pattern)
    setFlags(preset.flags || '')
    setSampleText(preset.sample)
  }

  const toggleFlag = (flagChar) => {
    if (flags.includes(flagChar)) {
      setFlags(flags.replace(flagChar, ''))
    } else {
      setFlags(flags + flagChar)
    }
  }

  const result = useMemo(() => {
    return testRegex(pattern, flags, sampleText)
  }, [pattern, flags, sampleText])

  return (
    <section className="regex-tester-section" aria-label="Tester de expresiones regulares">
      <div className="regex-header">
        <div>
          <h2 className="regex-title">🔍 Regex Tester en Vivo (Anti-ReDoS)</h2>
          <p className="regex-subtitle">
            Valida, depura y prueba expresiones regulares en tiempo real con protección contra regresión catastrófica.
          </p>
        </div>

        <div className="regex-presets">
          {REGEX_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`preset-chip${selectedPresetId === p.id ? ' preset-chip--active' : ''}`}
              onClick={() => handleSelectPreset(p)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="regex-container">
        {/* Panel Superior: Entrada de Patrón y Flags */}
        <div className="regex-input-box">
          <div className="regex-pattern-row">
            <span className="regex-slash">/</span>
            <input
              type="text"
              className="regex-pattern-input"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Introduce tu patrón regex aquí…"
              aria-label="Patrón de expresión regular"
              spellCheck={false}
            />
            <span className="regex-slash">/</span>
            <span className="regex-flags-preview">{flags || '—'}</span>
          </div>

          {/* Selector de Flags */}
          <div className="regex-flags-bar">
            <span className="regex-flags-label">Modificadores (Flags):</span>
            {[
              { f: 'g', label: 'g (Global)' },
              { f: 'i', label: 'i (Case-insensitive)' },
              { f: 'm', label: 'm (Multiline)' },
              { f: 's', label: 's (DotAll)' },
            ].map(({ f, label }) => (
              <button
                key={f}
                type="button"
                className={`flag-chip${flags.includes(f) ? ' flag-chip--active' : ''}`}
                onClick={() => toggleFlag(f)}
              >
                {label}
              </button>
            ))}
          </div>

          {result.error && (
            <div className="regex-error-banner" role="alert">
              ⚠️ {result.error}
            </div>
          )}
        </div>

        {/* Panel Medio: Texto de Prueba */}
        <div className="regex-body-grid">
          <div className="regex-field">
            <label className="form-label" htmlFor="regex-sample">
              Texto de Prueba:
            </label>
            <textarea
              id="regex-sample"
              className="regex-textarea"
              rows={6}
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              placeholder="Escribe el texto sobre el cual probar la expresión regular…"
              spellCheck={false}
            />
          </div>

          {/* Panel Derecho: Coincidencias en Vivo */}
          <div className="regex-results-pane">
            <div className="regex-results-header">
              <span className="regex-results-title">Coincidencias Detectadas</span>
              <span className={`badge badge--${result.matches.length > 0 ? 'success' : 'neutral'}`}>
                {result.matches.length} {result.matches.length === 1 ? 'coincidencia' : 'coincidencias'}
              </span>
            </div>

            {result.matches.length === 0 ? (
              <div className="regex-results-empty">
                <span>🔎 Sin coincidencias con el patrón actual</span>
              </div>
            ) : (
              <div className="regex-matches-list">
                {result.matches.map((m, idx) => (
                  <div key={idx} className="regex-match-item">
                    <div className="regex-match-top">
                      <span className="regex-match-idx">#{idx + 1}</span>
                      <code className="regex-match-text">{m.text}</code>
                      <span className="regex-match-pos">pos: {m.index}..{m.index + m.length}</span>
                    </div>
                    {m.groups.length > 0 && (
                      <div className="regex-match-groups">
                        {m.groups.map((g, gIdx) => (
                          <span key={gIdx} className="regex-group-badge">
                            Grupo {gIdx + 1}: <code>{g || 'undefined'}</code>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default RegexTester
