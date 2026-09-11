/**
 * @fileoverview Componente UI para el Explorador de Feature Flags y Despliegue Canary (Mejora 79).
 *
 * Muestra:
 * - Panel de Control de Feature Flags con Kill Switches y Sliders de Rollout Progresivo (0% a 100%).
 * - Simulador de Personas / Contextos de Usuario (Admin, Beta Tester, Free Tier, Enterprise).
 * - Evaluación en caliente con explicación del motivo (Targeting Rule Match, Canary Bucket, Kill Switch).
 * - Gráfico visual de distribución de tráfico A/B.
 *
 * @module components/ui/FeatureFlagsExplorer/FeatureFlagsExplorer
 */
import { useState, useRef } from 'react'
import { FeatureFlagManager } from '../../../utils/featureFlags'
import './FeatureFlagsExplorer.css'

const INITIAL_FLAGS = [
  {
    key: 'ai_assistant_v2',
    name: '🤖 AI Semantic Assistant v2',
    description: 'Generación de respuestas con modelos LLM y embeddings vectoriales.',
    enabled: true,
    rolloutPercentage: 25,
    rules: [
      { attribute: 'role', operator: 'equals', value: 'BETA_TESTER', variationValue: true },
      { attribute: 'plan', operator: 'equals', value: 'Enterprise', variationValue: true },
    ],
  },
  {
    key: 'one_click_checkout',
    name: '💳 Checkout Instantáneo (1-Click)',
    description: 'Flujo de compra ultrarrápido con Apple Pay y Google Pay.',
    enabled: true,
    rolloutPercentage: 50,
    rules: [
      { attribute: 'country', operator: 'in', value: ['ES', 'US'], variationValue: true },
    ],
  },
  {
    key: 'canary_graphql_api',
    name: '⚡ Nueva API GraphQL Subscriptions',
    description: 'Endpoints reactivos de streaming en tiempo real vía WebSockets.',
    enabled: false, // Kill switch activo
    rolloutPercentage: 10,
    rules: [],
  },
]

const PERSONAS = [
  { id: 'usr_beta', label: '🧪 Beta Tester (España)', context: { id: 'usr_beta', email: 'tester@devforge.app', role: 'BETA_TESTER', plan: 'Pro', country: 'ES' } },
  { id: 'usr_enterprise', label: '🏢 Enterprise Admin', context: { id: 'usr_enterprise', email: 'cto@megacorp.com', role: 'ADMIN', plan: 'Enterprise', country: 'US' } },
  { id: 'usr_free', label: '🧑 Usuario Free Tier', context: { id: 'usr_free_44', email: 'user44@gmail.com', role: 'USER', plan: 'Free', country: 'MX' } },
]

export default function FeatureFlagsExplorer() {
  const managerRef = useRef(null)
  if (!managerRef.current) {
    managerRef.current = new FeatureFlagManager()
    INITIAL_FLAGS.forEach((f) => managerRef.current.registerFlag(f))
  }

  const [selectedPersonaIdx, setSelectedPersonaIdx] = useState(0)
  const [, setTick] = useState(0)

  const activePersona = PERSONAS[selectedPersonaIdx]
  const flags = managerRef.current.getSnapshot()

  const handleToggle = (key) => {
    managerRef.current.toggleFlag(key)
    setTick((t) => t + 1)
  }

  const handleRolloutChange = (key, val) => {
    managerRef.current.setRolloutPercentage(key, Number(val))
    setTick((t) => t + 1)
  }

  return (
    <section className="feature-flags-explorer" aria-labelledby="ff-title">
      <div className="feature-flags-explorer__header">
        <div>
          <span className="badge badge--brand">DevOps & Control de Lanzamiento</span>
          <h2 id="ff-title" className="feature-flags-explorer__title">
            Motor de Feature Flags & Despliegue Progresivo Canary
          </h2>
          <p className="feature-flags-explorer__desc">
            Habilita o deshabilita funcionalidades en producción sin requerir despliegues de código (Zero-Downtime Releases).
            Controla el porcentaje de despliegue progresivo (*Canary Rollout*) y segmenta por atributos de usuario.
          </p>
        </div>

        {/* Selector de Contexto de Usuario */}
        <div className="ff-persona-selector">
          <span className="ff-persona-label">Simular Persona de Usuario:</span>
          <div className="ff-persona-buttons">
            {PERSONAS.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                className={`btn-xs ${selectedPersonaIdx === idx ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedPersonaIdx(idx)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Context Card de Usuario Activo ── */}
      <div className="ff-context-card">
        <span className="ff-meta-title">Contexto de Usuario Evaluado:</span>
        <div className="ff-context-tags">
          <span>ID: <code>{activePersona.context.id}</code></span>
          <span>Rol: <span className="badge badge--neutral">{activePersona.context.role}</span></span>
          <span>Plan: <span className="badge badge--brand">{activePersona.context.plan}</span></span>
          <span>País: <strong>{activePersona.context.country}</strong></span>
        </div>
      </div>

      {/* ── Grid de Feature Flags ── */}
      <div className="ff-flags-grid">
        {flags.map((flag) => {
          const evalResult = managerRef.current.evaluate(flag.key, activePersona.context)

          return (
            <div key={flag.key} className={`ff-flag-card ${evalResult.enabled ? 'ff-flag-card--active' : ''}`}>
              <div className="ff-flag-header">
                <div>
                  <h3 className="ff-flag-name">{flag.name}</h3>
                  <code className="ff-flag-key">{flag.key}</code>
                </div>
                <button
                  type="button"
                  className={`btn-xs ${flag.enabled ? 'btn-success' : 'btn-danger'}`}
                  onClick={() => handleToggle(flag.key)}
                >
                  {flag.enabled ? '🟢 Activa (ON)' : '🔴 Kill Switch (OFF)'}
                </button>
              </div>

              <p className="ff-flag-desc">{flag.description}</p>

              {/* Slider de Rollout Canary */}
              <div className="ff-rollout-control">
                <div className="ff-rollout-header">
                  <span className="ff-rollout-label">Despliegue Canary (Tráfico):</span>
                  <strong>{flag.rolloutPercentage}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={flag.rolloutPercentage}
                  onChange={(e) => handleRolloutChange(flag.key, e.target.value)}
                  disabled={!flag.enabled}
                  className="ff-slider"
                />
              </div>

              {/* Reglas de Segmentación */}
              {flag.rules.length > 0 && (
                <div className="ff-rules-box">
                  <span className="ff-meta-title">Reglas de Segmentación (Bypass):</span>
                  <ul className="ff-rules-list">
                    {flag.rules.map((r, i) => (
                      <li key={i}>
                        <code>{r.attribute} {r.operator} {JSON.stringify(r.value)}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resultado de Evaluación para la Persona Seleccionada */}
              <div className={`ff-evaluation-box ff-evaluation-box--${evalResult.enabled ? 'enabled' : 'disabled'}`}>
                <div className="ff-eval-header">
                  <span>Estado para este usuario:</span>
                  <span className="ff-eval-badge">
                    {evalResult.enabled ? '✨ HABILITADA' : '🚫 BLOQUEADA'}
                  </span>
                </div>
                <span className="ff-eval-reason">Motivo: {evalResult.reason}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
