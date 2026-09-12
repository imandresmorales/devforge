/**
 * @fileoverview Componente TimingAttackAuditor — Laboratorio de Auditoría y Comparador Criptográfico en Tiempo Constante (Mejora 87).
 *
 * Demuestra de forma interactiva y estadística la mitigación de ataques por canal lateral
 * temporal (CWE-208: Observable Timing Discrepancy) sobre firmas HMAC, API keys y tokens.
 *
 * @module components/ui/TimingAttackAuditor
 */
import { useState, useMemo } from 'react'
import {
  vulnerableCompare,
  constantTimeCompare,
  runTimingAttackAudit,
} from '../../../utils/timingAttackComparator'
import './TimingAttackAuditor.css'

const DEFAULT_SECRET = 'SEC_KEY_8a92f4c'
const DEFAULT_CANDIDATE = 'SEC_KEY_8a92xxx'

const CODE_EXAMPLES = {
  js_constant: `// Comparador Criptográfico en Tiempo Constante (Vanilla JS / Web Crypto)
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  
  let mismatch = a.length ^ b.length;
  const maxLen = Math.max(a.length, b.length);
  
  for (let i = 0; i < maxLen; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= (charA ^ charB); // Acumulador XOR bit a bit sin early-exit
  }
  
  return mismatch === 0;
}`,
  nodejs: `// Node.js Crypto API nativo
import crypto from 'node:crypto';

export function verifyApiKey(clientKey, serverKey) {
  const bufA = Buffer.from(clientKey, 'utf8');
  const bufB = Buffer.from(serverKey, 'utf8');
  
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB); // O(N) Constant-Time
}`,
  python: `# Python hmac.compare_digest
import hmac

def verify_token(user_token: str, server_token: str) -> bool:
    # Mitiga CWE-208 internamente mediante C-level constant time compare
    return hmac.compare_digest(user_token, server_token)`,
  golang: `// Go crypto/subtle
package main
import "crypto/subtle"

func VerifySignature(sigA, sigB []byte) bool {
    // 1 si son idénticos, 0 si difieren en tiempo constante
    return subtle.ConstantTimeCompare(sigA, sigB) == 1
}`,
  rust: `// Rust subtle crate
use subtle::ConstantTimeEq;

pub fn verify_signature(a: &[u8], b: &[u8]) -> bool {
    a.ct_eq(b).into()
}`,
}

export default function TimingAttackAuditor() {
  const [secret, setSecret] = useState(DEFAULT_SECRET)
  const [candidate, setCandidate] = useState(DEFAULT_CANDIDATE)
  const [activeCodeTab, setActiveCodeTab] = useState('js_constant')

  const [benchmarkData, setBenchmarkData] = useState(() => runTimingAttackAudit(DEFAULT_SECRET, 60))
  const [isAuditing, setIsAuditing] = useState(false)

  // Evaluaciones en tiempo real
  const vulnResult = useMemo(() => vulnerableCompare(secret, candidate), [secret, candidate])
  const constResult = useMemo(() => constantTimeCompare(secret, candidate), [secret, candidate])

  const handleRunAudit = () => {
    setIsAuditing(true)
    setTimeout(() => {
      const data = runTimingAttackAudit(secret, 80)
      setBenchmarkData(data)
      setIsAuditing(false)
    }, 100)
  }

  // Dimensiones para gráfico SVG
  const chartWidth = 500
  const chartHeight = 160
  const padding = 30

  const maxNs = useMemo(() => {
    const all = [
      ...benchmarkData.vulnerableResults.map((r) => r.avgNs),
      ...benchmarkData.constantTimeResults.map((r) => r.avgNs),
    ]
    return Math.max(...all, 100) * 1.15
  }, [benchmarkData])

  const pointsCount = benchmarkData.vulnerableResults.length

  const getSvgCoordinates = (index, ns) => {
    const x = padding + (index / (pointsCount - 1 || 1)) * (chartWidth - padding * 2)
    const y = chartHeight - padding - (ns / maxNs) * (chartHeight - padding * 2)
    return `${x},${y}`
  }

  const vulnPolyline = benchmarkData.vulnerableResults
    .map((r, i) => getSvgCoordinates(i, r.avgNs))
    .join(' ')

  const constPolyline = benchmarkData.constantTimeResults
    .map((r, i) => getSvgCoordinates(i, r.avgNs))
    .join(' ')

  return (
    <section className="timing-auditor" aria-labelledby="timing-title">
      {/* ── Encabezado ── */}
      <div className="timing-auditor__header">
        <div className="timing-auditor__title-row">
          <h2 id="timing-title" className="timing-auditor__title">
            <span>⏱️</span> Motor de Auditoría y Comparador en Tiempo Constante
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span className="badge badge--brand">Mejora 87</span>
            <span className="badge badge--success">CWE-208 Mitigado</span>
            <span className="badge badge--neutral">Constant-Time O(N)</span>
            <span className="badge badge--warning">Side-Channel Auditor</span>
          </div>
        </div>
        <p className="timing-auditor__desc">
          Auditor de vulnerabilidades por <strong>Canal Lateral Temporal (Timing Attacks)</strong>.
          La comparación estándar de strings mediante <code>===</code> o <code>strcmp</code> aborta en el primer byte incorrecto,
          permitiendo a un atacante inferir contraseñas, hashes y firmas HMAC midiendo nanosegundos de respuesta.
          Aprende a implementar igualdad en tiempo constante mediante <strong>acumulación XOR sin early-exit</strong>.
        </p>
      </div>

      {/* ── Inputs del Evaluador ── */}
      <div className="timing-auditor__inputs-grid">
        <div className="timing-input-group">
          <label htmlFor="timing-secret">🔑 Secreto en Servidor (API Key / HMAC Secret):</label>
          <input
            id="timing-secret"
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Introduce la clave secreta..."
          />
        </div>

        <div className="timing-input-group">
          <label htmlFor="timing-candidate">🎯 Candidato Enviado por Atacante / Cliente:</label>
          <input
            id="timing-candidate"
            type="text"
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
            placeholder="Introduce la clave enviada..."
          />
        </div>
      </div>

      {/* ── Comparativa Lado a Lado ── */}
      <div className="timing-auditor__comparison-grid">
        {/* Inseguro: Early-Exit */}
        <article className="timing-card timing-card--vuln">
          <div className="timing-card__header">
            <div className="timing-card__title" style={{ color: '#ef4444' }}>
              <span>⚠️</span> Comparación Estándar (Early-Exit)
            </div>
            <span className={`badge ${vulnResult.equals ? 'badge--success' : 'badge--error'}`}>
              {vulnResult.equals ? '✅ Coincide' : '❌ Rechazado'}
            </span>
          </div>

          <div className="timing-card__stats">
            <div className="timing-card__stat-row">
              <span>Tiempo de Ejecución Simulado:</span>
              <span className="timing-card__stat-val" style={{ color: '#ef4444' }}>
                ~{Math.round(vulnResult.simulatedNs)} ns
              </span>
            </div>
            <div className="timing-card__stat-row">
              <span>Ciclos / Operaciones de CPU:</span>
              <span className="timing-card__stat-val">{vulnResult.opsCount} ops</span>
            </div>
            <div className="timing-card__stat-row">
              <span>Falla detectada en índice:</span>
              <span className="timing-card__stat-val">
                {vulnResult.mismatchIndex >= 0 ? `Byte #${vulnResult.mismatchIndex + 1}` : 'N/A (Coincide)'}
              </span>
            </div>
            <div className="timing-card__stat-row">
              <span>Fuga por Canal Lateral:</span>
              <span className="badge badge--error">ALTA (CWE-208)</span>
            </div>
          </div>
        </article>

        {/* Seguro: Constant-Time */}
        <article className="timing-card timing-card--secure">
          <div className="timing-card__header">
            <div className="timing-card__title" style={{ color: '#10b981' }}>
              <span>🛡️</span> Tiempo Constante (XOR Bitwise)
            </div>
            <span className={`badge ${constResult.equals ? 'badge--success' : 'badge--error'}`}>
              {constResult.equals ? '✅ Coincide' : '❌ Rechazado'}
            </span>
          </div>

          <div className="timing-card__stats">
            <div className="timing-card__stat-row">
              <span>Tiempo de Ejecución Simulado:</span>
              <span className="timing-card__stat-val" style={{ color: '#10b981' }}>
                ~{Math.round(constResult.simulatedNs)} ns
              </span>
            </div>
            <div className="timing-card__stat-row">
              <span>Ciclos / Operaciones de CPU:</span>
              <span className="timing-card__stat-val">{constResult.opsCount} ops (Constante)</span>
            </div>
            <div className="timing-card__stat-row">
              <span>Falla detectada en índice:</span>
              <span className="timing-card__stat-val">Oculto (Blind XOR)</span>
            </div>
            <div className="timing-card__stat-row">
              <span>Fuga por Canal Lateral:</span>
              <span className="badge badge--success">0% (Inmune)</span>
            </div>
          </div>
        </article>
      </div>

      {/* ── Simulador Estadístico de Ataque (Benchmark) ── */}
      <div className="timing-benchmark">
        <div className="timing-benchmark__header">
          <div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#fff' }}>
              📈 Simulación Estadística de Timing Attack (Análisis de Regresión)
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Mide los tiempos medios de respuesta a medida que el atacante adivina más bytes del prefijo correcto.
            </p>
          </div>

          <button
            type="button"
            className="timing-btn"
            onClick={handleRunAudit}
            disabled={isAuditing}
          >
            {isAuditing ? '⏳ Ejecutando Benchmark...' : '▶️ Ejecutar Simulación (1000 Peticiones)'}
          </button>
        </div>

        {/* Gráfico SVG de Dispersión Temporal */}
        <div className="timing-chart-box">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="timing-chart-svg">
            {/* Ejes y cuadrícula */}
            <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.2)" />
            <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.2)" />

            {/* Curva Vulnerable (Rojo con pendiente ascendente) */}
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              points={vulnPolyline}
            />

            {/* Curva Constant-Time (Verde plana) */}
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              points={constPolyline}
            />

            {/* Leyenda */}
            <circle cx={padding + 20} cy={padding + 5} r="4" fill="#ef4444" />
            <text x={padding + 30} y={padding + 8} fill="#ef4444" fontSize="10" fontFamily="sans-serif">
              Vulnerable (Early-Exit) — Fuga Lineal O(k)
            </text>

            <circle cx={padding + 260} cy={padding + 5} r="4" fill="#10b981" />
            <text x={padding + 270} y={padding + 8} fill="#10b981" fontSize="10" fontFamily="sans-serif">
              Tiempo Constante — Inmune O(N)
            </text>

            <text x={chartWidth / 2} y={chartHeight - 6} fill="rgba(255,255,255,0.6)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">
              Número de Caracteres Coincidentes del Prefijo (0 → {pointsCount - 1})
            </text>
          </svg>
        </div>

        {/* Métricas Estadísticas */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--text-xs)' }}>
          <div style={{ color: 'var(--color-text-secondary)' }}>
            Correlación de Pearson ($r$):{' '}
            <strong style={{ color: benchmarkData.isVulnerableLeakDetected ? '#ef4444' : '#10b981' }}>
              {benchmarkData.correlationCoefficient}
            </strong>
          </div>
          <div style={{ color: 'var(--color-text-secondary)' }}>
            Diagnóstico de Seguridad:{' '}
            <strong style={{ color: benchmarkData.isVulnerableLeakDetected ? '#ef4444' : '#10b981' }}>
              {benchmarkData.isVulnerableLeakDetected ? '🚨 VULNERABLE A TIMING EXPLOIT' : '🛡️ SEGURO Y MITIGADO'}
            </strong>
          </div>
        </div>
      </div>

      {/* ── Implementaciones Seguras Multi-Lenguaje ── */}
      <div className="timing-code-box">
        <div className="timing-code-box__tabs">
          <button
            type="button"
            className={`timing-code-box__tab ${activeCodeTab === 'js_constant' ? 'timing-code-box__tab--active' : ''}`}
            onClick={() => setActiveCodeTab('js_constant')}
          >
            JavaScript (XOR)
          </button>
          <button
            type="button"
            className={`timing-code-box__tab ${activeCodeTab === 'nodejs' ? 'timing-code-box__tab--active' : ''}`}
            onClick={() => setActiveCodeTab('nodejs')}
          >
            Node.js (crypto)
          </button>
          <button
            type="button"
            className={`timing-code-box__tab ${activeCodeTab === 'python' ? 'timing-code-box__tab--active' : ''}`}
            onClick={() => setActiveCodeTab('python')}
          >
            Python (hmac)
          </button>
          <button
            type="button"
            className={`timing-code-box__tab ${activeCodeTab === 'golang' ? 'timing-code-box__tab--active' : ''}`}
            onClick={() => setActiveCodeTab('golang')}
          >
            Go (subtle)
          </button>
          <button
            type="button"
            className={`timing-code-box__tab ${activeCodeTab === 'rust' ? 'timing-code-box__tab--active' : ''}`}
            onClick={() => setActiveCodeTab('rust')}
          >
            Rust (subtle)
          </button>
        </div>

        <pre className="timing-code-box__content">
          {CODE_EXAMPLES[activeCodeTab]}
        </pre>
      </div>
    </section>
  )
}
