/**
 * @fileoverview Componente UI para el Simulador de Pipeline CI/CD con SAST (Mejora 72).
 *
 * Muestra:
 * - Diagrama de etapas de Pipeline DevSecOps (Checkout -> SAST Scan -> Unit Tests -> SCA Audit -> Deploy).
 * - Selector de plantillas de código (Clean, Hardcoded Secret, XSS Vulnerability, Insecure Eval).
 * - Terminal interactiva con logs de compilación coloreados en tiempo real.
 * - Panel de hallazgos SAST con reglas CWE, número de línea y severidad.
 *
 * @module components/ui/CICDPipelineSimulator/CICDPipelineSimulator
 */
import { useState, useRef } from 'react'
import {
  CICDPipelineRunner,
  PIPELINE_STATUS,
  STAGE_NAMES,
} from '../../../utils/cicdPipeline'
import './CICDPipelineSimulator.css'

const PRESETS = {
  CLEAN: {
    label: '🟢 Código Seguro (Clean)',
    code: `import DOMPurify from 'dompurify'

export function renderUserBadge(username) {
  const safeName = DOMPurify.sanitize(username)
  return '<span class="user-badge">' + safeName + '</span>'
}`,
  },
  SECRET_LEAK: {
    label: '🔴 Fuga de API Key (CWE-798)',
    code: `export const config = {
  stripeSecretKey: "sk_live_992837482910384756281",
  endpoint: "https://api.devforge.app/v1"
}`,
  },
  EVAL_XSS: {
    label: '🔴 Inyección Eval & innerHTML (CWE-95/79)',
    code: `export function processPayload(rawInput) {
  const parsed = eval(rawInput)
  document.getElementById("output").innerHTML = "<b>" + rawInput + "</b>"
  return parsed
}`,
  },
}

export default function CICDPipelineSimulator() {
  const [selectedPreset, setSelectedPreset] = useState('CLEAN')
  const [code, setCode] = useState(PRESETS.CLEAN.code)
  const [isRunning, setIsRunning] = useState(false)
  const [pipelineResult, setPipelineResult] = useState(null)
  const [activeTab, setActiveTab] = useState('logs') // 'logs' | 'sast'
  const runnerRef = useRef(new CICDPipelineRunner({ failFast: true, minCoverage: 80 }))

  const handleSelectPreset = (key) => {
    setSelectedPreset(key)
    setCode(PRESETS[key].code)
    setPipelineResult(null)
  }

  const handleRunPipeline = async () => {
    setIsRunning(true)
    setPipelineResult(null)

    // Breve pausa para efecto visual de ejecución
    await new Promise((r) => setTimeout(r, 400))
    const res = await runnerRef.current.executePipeline(code, {
      branch: 'main',
      commitHash: 'commit_' + Math.random().toString(36).substr(2, 6),
    })

    setPipelineResult(res)
    setIsRunning(false)
  }

  const stages = pipelineResult?.stages || {
    checkout: { name: STAGE_NAMES.CHECKOUT, status: 'IDLE' },
    sast: { name: STAGE_NAMES.SAST_SCAN, status: 'IDLE', findings: [] },
    testing: { name: STAGE_NAMES.TESTING, status: 'IDLE' },
    sca: { name: STAGE_NAMES.SCA_AUDIT, status: 'IDLE' },
    deploy: { name: STAGE_NAMES.BUILD_DEPLOY, status: 'IDLE' },
  }

  return (
    <section className="cicd-simulator" aria-labelledby="cicd-title">
      <div className="cicd-simulator__header">
        <div>
          <span className="badge badge--brand">DevSecOps & Automatización CI/CD</span>
          <h2 id="cicd-title" className="cicd-simulator__title">
            Simulador de Pipeline CI/CD con SAST & Security Gates
          </h2>
          <p className="cicd-simulator__desc">
            Visualiza el ciclo de vida de integración continua con análisis estático de seguridad (SAST),
            puertas de calidad de código y política <strong>Break-the-Build</strong> ante vulnerabilidades críticas.
          </p>
        </div>

        <div className="cicd-actions">
          <button
            type="button"
            className="btn-primary cicd-run-btn"
            onClick={handleRunPipeline}
            disabled={isRunning}
          >
            {isRunning ? '⏳ Ejecutando Pipeline...' : '🚀 Disparar Pipeline (git push)'}
          </button>
        </div>
      </div>

      {/* ── Stepper de Etapas del Pipeline ── */}
      <div className="cicd-stepper">
        {Object.entries(stages).map(([key, stg], idx) => {
          const isPassed = stg.status === 'PASSED'
          const isFailed = stg.status === 'FAILED'
          const isSkipped = stg.status === 'SKIPPED'
          const isPending = stg.status === 'IDLE' || stg.status === 'PENDING'

          return (
            <div key={key} className={`cicd-step cicd-step--${stg.status.toLowerCase()}`}>
              <div className="cicd-step__badge">
                {isPassed && '✅'}
                {isFailed && '❌'}
                {isSkipped && '⏸️'}
                {isPending && `${idx + 1}`}
                {isRunning && stg.status === 'RUNNING' && '🔄'}
              </div>
              <div className="cicd-step__info">
                <span className="cicd-step__name">{stg.name}</span>
                <span className="cicd-step__status">{stg.status}</span>
              </div>
              {idx < Object.keys(stages).length - 1 && <div className="cicd-step__connector" />}
            </div>
          )
        })}
      </div>

      {/* ── Grid Principal de Código y Salida ── */}
      <div className="cicd-main-grid">
        {/* Editor de Código Fuente */}
        <div className="cicd-code-panel">
          <div className="cicd-panel-header">
            <span className="cicd-panel-title">📝 Código Fuente del Commit</span>
            <div className="cicd-presets-row">
              {Object.keys(PRESETS).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`btn-xs ${selectedPreset === key ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSelectPreset(key)}
                >
                  {PRESETS[key].label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="cicd-editor"
            rows={10}
            spellCheck={false}
          />
        </div>

        {/* Consola / Terminal de Pipeline */}
        <div className="cicd-output-panel">
          <div className="cicd-panel-header">
            <div className="cicd-tab-buttons">
              <button
                type="button"
                className={`cicd-tab-btn ${activeTab === 'logs' ? 'cicd-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                📟 Terminal Logs ({pipelineResult?.logs?.length || 0})
              </button>
              <button
                type="button"
                className={`cicd-tab-btn ${activeTab === 'sast' ? 'cicd-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('sast')}
              >
                🛡️ Hallazgos SAST ({stages.sast.findings?.length || 0})
              </button>
            </div>

            {pipelineResult && (
              <span className={`cicd-result-tag cicd-result-tag--${pipelineResult.status.toLowerCase()}`}>
                {pipelineResult.status === PIPELINE_STATUS.PASSED ? 'BUILD: SUCCESS' : 'BUILD: FAILED'}
              </span>
            )}
          </div>

          {activeTab === 'logs' && (
            <div className="cicd-terminal">
              {(!pipelineResult || pipelineResult.logs.length === 0) && (
                <div className="cicd-terminal-placeholder">
                  Presiona "Disparar Pipeline" para ver la salida de compilación en tiempo real.
                </div>
              )}
              {pipelineResult?.logs.map((item) => (
                <div key={item.id} className={`cicd-log-line cicd-log-line--${item.level.toLowerCase()}`}>
                  <span className="cicd-log-time">[{item.timestamp}]</span>
                  <span className="cicd-log-stage">[{item.stage}]</span>
                  <span className="cicd-log-msg">{item.msg}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sast' && (
            <div className="cicd-sast-view">
              {(!stages.sast.findings || stages.sast.findings.length === 0) ? (
                <div className="cicd-clean-sast">
                  ✨ No se detectaron vulnerabilidades SAST en este commit.
                </div>
              ) : (
                <div className="cicd-findings-list">
                  {stages.sast.findings.map((f, idx) => (
                    <div key={idx} className={`cicd-finding-card cicd-finding-card--${f.severity.toLowerCase()}`}>
                      <div className="cicd-finding-header">
                        <span className="cicd-finding-sev">{f.severity}</span>
                        <strong>{f.name}</strong>
                        <span className="cicd-finding-cwe">{f.cwe}</span>
                        <span className="cicd-finding-line">Línea {f.line}</span>
                      </div>
                      <p className="cicd-finding-msg">{f.message}</p>
                      <pre className="cicd-finding-code">{f.snippet}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
