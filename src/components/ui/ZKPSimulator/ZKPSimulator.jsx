/**
 * @fileoverview Componente UI para el Simulador de Pruebas de Cero Conocimiento (ZKP) Schnorr (Mejora 65).
 *
 * Muestra:
 * - Demostración visual e interactiva de Prover (Peggy) y Verifier (Victor).
 * - Paso a paso del protocolo: Claves ➔ Compromiso ➔ Desafío ➔ Respuesta ➔ Verificación modular.
 * - Soporte para Heurística Fiat-Shamir (Non-Interactive ZKP).
 * - Botón interactivo de ataque / suplantación para evidenciar la solidez criptográfica (Soundness).
 *
 * @module components/ui/ZKPSimulator/ZKPSimulator
 */
import { useState } from 'react'
import { runCompleteZKPSimulation, DEFAULT_ZKP_PARAMS } from '../../../utils/zkpEngine'
import './ZKPSimulator.css'

export default function ZKPSimulator() {
  const [secretInput, setSecretInput] = useState('789456')
  const [useFiatShamir, setUseFiatShamir] = useState(false)
  const [simulationResult, setSimulationResult] = useState(() =>
    runCompleteZKPSimulation({ secret: 789456n, useFiatShamir: false, simulateAttacker: false })
  )
  const [isAttacking, setIsAttacking] = useState(false)

  const handleRunSimulation = (simulateAttacker = false) => {
    setIsAttacking(simulateAttacker)
    const secretNum = BigInt(secretInput.replace(/\D/g, '') || '12345')
    const res = runCompleteZKPSimulation({
      secret: secretNum,
      useFiatShamir,
      simulateAttacker,
    })
    setSimulationResult(res)
  }

  return (
    <section className="zkp-simulator" aria-labelledby="zkp-title">
      <div className="zkp-simulator__header">
        <div>
          <span className="badge badge--brand">Criptografía Avanzada</span>
          <h2 id="zkp-title" className="zkp-simulator__title">
            Simulador de Pruebas de Cero Conocimiento (ZKP & Protocolo Schnorr)
          </h2>
          <p className="zkp-simulator__desc">
            Demuestra la propiedad matemática de probar la posesión de un secreto (contraseña o clave privada)
            sin revelar jamás el secreto ni transmitir hashes. Base de zk-SNARKs, zk-STARKs y autenticación Zero-Knowledge.
          </p>
        </div>

        <div className="zkp-top-controls">
          <label className="zkp-toggle-label">
            <input
              type="checkbox"
              checked={useFiatShamir}
              onChange={(e) => setUseFiatShamir(e.target.checked)}
            />
            <span>Heurística Fiat-Shamir (NIZK No Interactivo)</span>
          </label>
        </div>
      </div>

      {/* ── Barra de Configuración de Secreto ── */}
      <div className="zkp-secret-bar">
        <div className="zkp-secret-input-wrapper">
          <label htmlFor="zkp-secret-input" className="zkp-field-label">
            Secreto del Prover (x) — <em>Solo conocido por Peggy</em>:
          </label>
          <input
            id="zkp-secret-input"
            type="number"
            className="input zkp-input"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder="Ej: 789456"
          />
        </div>

        <div className="zkp-buttons-row">
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleRunSimulation(false)}
          >
            🔐 Ejecutar Prueba ZKP Legítima
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => handleRunSimulation(true)}
          >
            🕵️ Simular Ataque (Secreto Falso)
          </button>
        </div>
      </div>

      {/* ── Tablero de Actores: Prover vs Verifier ── */}
      <div className="zkp-actors-grid">
        {/* Prover Card */}
        <div className={`zkp-actor-card zkp-actor-card--prover ${isAttacking ? 'zkp-actor-card--attacker' : ''}`}>
          <div className="zkp-actor-header">
            <div className="zkp-actor-avatar">{isAttacking ? '🦹' : '👩‍💻'}</div>
            <div>
              <h3 className="zkp-actor-name">{isAttacking ? 'Mallory (Atacante)' : 'Peggy (Prover)'}</h3>
              <span className="zkp-actor-role">Poseedor del secreto — Genera la prueba</span>
            </div>
          </div>

          <div className="zkp-values-list">
            <div className="zkp-value-row">
              <span className="zkp-val-name">Secreto privado (x):</span>
              <span className="zkp-val-data zkp-val-secret">{simulationResult.prover.secret}</span>
            </div>
            <div className="zkp-value-row">
              <span className="zkp-val-name">Clave pública compartida (y = g^x mod p):</span>
              <span className="zkp-val-data">{simulationResult.prover.publicKey}</span>
            </div>
            <div className="zkp-value-row">
              <span className="zkp-val-name">Nonce aleatorio efímero (v):</span>
              <span className="zkp-val-data">{simulationResult.prover.nonce}</span>
            </div>
            <div className="zkp-value-row">
              <span className="zkp-val-name">Compromiso enviado (V = g^v mod p):</span>
              <span className="zkp-val-data">{simulationResult.prover.commitment}</span>
            </div>
            <div className="zkp-value-row">
              <span className="zkp-val-name">Respuesta calculada (r = v - c·x mod q):</span>
              <span className="zkp-val-data zkp-val-highlight">{simulationResult.prover.response}</span>
            </div>
          </div>
        </div>

        {/* Verifier Card */}
        <div className="zkp-actor-card zkp-actor-card--verifier">
          <div className="zkp-actor-header">
            <div className="zkp-actor-avatar">👨‍⚖️</div>
            <div>
              <h3 className="zkp-actor-name">Victor (Verifier)</h3>
              <span className="zkp-actor-role">Verificador independiente — No conoce x</span>
            </div>
          </div>

          <div className="zkp-values-list">
            <div className="zkp-value-row">
              <span className="zkp-val-name">Desafío emitido (c):</span>
              <span className="zkp-val-data zkp-val-highlight">{simulationResult.verifier.challenge}</span>
            </div>
            <div className="zkp-value-row">
              <span className="zkp-val-name">Lado Izquierdo (g^r · y^c mod p):</span>
              <span className="zkp-val-data">{simulationResult.verifier.leftSide}</span>
            </div>
            <div className="zkp-value-row">
              <span className="zkp-val-name">Lado Derecho (Compromiso V):</span>
              <span className="zkp-val-data">{simulationResult.verifier.rightSide}</span>
            </div>
            <div className="zkp-value-row">
              <span className="zkp-val-name">Veredicto Criptográfico:</span>
              <span className={`zkp-verdict-badge zkp-verdict-badge--${simulationResult.verifier.isValid ? 'valid' : 'invalid'}`}>
                {simulationResult.verifier.isValid ? '✅ ACEPTADO (PROOF VALID)' : '❌ RECHAZADO (FRAUDULENT)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Traza Matemática del Algoritmo ── */}
      <div className="zkp-steps-panel">
        <h4 className="zkp-steps-title">
          📐 Pasos de Verificación Modular (Grupo $\mathbb&#123;Z&#125;*_p$, $p={DEFAULT_ZKP_PARAMS.p.toString()}$, $g={DEFAULT_ZKP_PARAMS.g.toString()}$)
        </h4>
        <div className="zkp-steps-grid">
          {simulationResult.verifier.steps.map((st, idx) => (
            <div key={idx} className="zkp-step-item">
              <span className="zkp-step-desc">{st.desc}</span>
              <code className="zkp-step-eq">{st.equation}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
