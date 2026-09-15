/**
 * @fileoverview Componente HomomorphicCryptoExplorer — Simulador de Criptografía Homomórfica.
 *
 * MEJORA 95: Esquema de Criptografía Homomórfica de Paillier (Confidential Computing).
 * Demuestra cómputo matemático directo sobre textos cifrados sin descifrar los datos sensibles.
 * Incluye caso de uso de Nómina Confidencial y Operaciones Homomórficas en Vivo.
 *
 * @module components/ui/HomomorphicCryptoExplorer
 */
import { useState, useMemo } from 'react'
import {
  generatePaillierKeys,
  encryptPaillier,
  decryptPaillier,
  homomorphicAdd,
  homomorphicMultiplyScalar,
  computeConfidentialPayroll
} from '../../../utils/homomorphicCrypto.js'
import './HomomorphicCryptoExplorer.css'

export default function HomomorphicCryptoExplorer() {
  const [keys] = useState(() => generatePaillierKeys())
  const [valA, setValA] = useState(1250)
  const [valB, setValB] = useState(3750)
  const [scalarK, setScalarK] = useState(3)

  // Nómina confidencial
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Elena García (Lead Dev)', salary: 4200, bonus: 800 },
    { id: 2, name: 'Carlos Mendoza (SecOps)', salary: 4600, bonus: 900 },
    { id: 3, name: 'Sofía Reyes (Cloud Architect)', salary: 5100, bonus: 1100 }
  ])
  const [isTotalDecrypted, setIsTotalDecrypted] = useState(false)

  // Cómputo homomórfico interactivo
  const encA = useMemo(() => encryptPaillier(valA, keys.publicKey, 13n), [valA, keys])
  const encB = useMemo(() => encryptPaillier(valB, keys.publicKey, 29n), [valB, keys])
  const encSum = useMemo(() => homomorphicAdd(encA, encB, keys.publicKey), [encA, encB, keys])
  const encScalarMult = useMemo(() => homomorphicMultiplyScalar(encA, scalarK, keys.publicKey), [encA, scalarK, keys])

  const decryptedSum = useMemo(() => decryptPaillier(encSum, keys.privateKey, keys.publicKey), [encSum, keys])
  const decryptedScalar = useMemo(() => decryptPaillier(encScalarMult, keys.privateKey, keys.publicKey), [encScalarMult, keys])

  // Nómina
  const payrollResult = useMemo(() => computeConfidentialPayroll(employees, keys.publicKey), [employees, keys])
  const decryptedPayrollTotal = useMemo(() => {
    return decryptPaillier(payrollResult.totalPayrollCiphertext, keys.privateKey, keys.publicKey)
  }, [payrollResult, keys])

  return (
    <section className="he-explorer" aria-labelledby="he-title">
      <div className="he-header">
        <div className="he-header__badge">
          <span>MEJORA 95</span>
          <span className="he-badge-tag">Criptografía Avanzada & Privacidad de Datos</span>
        </div>
        <h2 id="he-title" className="he-header__title">
          Motor de Criptografía Homomórfica (Paillier Scheme & Confidential Computing)
        </h2>
        <p className="he-header__desc">
          Computación confidencial en la nube. Permite sumar y multiplicar valores numéricos <strong>directamente sobre criptogramas cifrados ($c_1 \cdot c_2 \equiv m_1 + m_2$)</strong> sin que el servidor jamás conozca ni descifre los datos en texto plano.
        </p>
      </div>

      {/* Claves Criptográficas Activas */}
      <div className="he-keys-card">
        <div className="he-keys-header">
          <span className="he-keys-icon">🔑</span>
          <h4>Par de Claves Paillier Activas (Generadas en Tiempo de Ejecución)</h4>
        </div>
        <div className="he-keys-grid">
          <div>
            <span className="he-key-tag">Clave Pública (Servidor / Cloud)</span>
            <div className="he-key-code">
              <div><code>Módulo n: {keys.publicKey.n}</code></div>
              <div><code>Espacio Cifrado n²: {keys.publicKey.n2.slice(0, 16)}...</code></div>
              <div><code>Generador g = n + 1: {keys.publicKey.g}</code></div>
            </div>
          </div>
          <div>
            <span className="he-key-tag he-key-tag--private">Clave Privada (Solo Cliente / Titular)</span>
            <div className="he-key-code">
              <div><code>λ = lcm(p-1, q-1): {keys.privateKey.lambda}</code></div>
              <div><code>Inversa Modular μ: {keys.privateKey.mu}</code></div>
              <div><code>Primos p, q: {keys.privateKey.p}, {keys.privateKey.q}</code></div>
            </div>
          </div>
        </div>
      </div>

      {/* Demostración Interactiva de Suma y Escalamiento Homomórfico */}
      <div className="he-demo-grid">
        <div className="he-calc-card">
          <h3 className="he-section-title">1. Suma Homomórfica ($Enc(A) \cdot Enc(B) \pmod{'{n^2}'}$)</h3>
          <div className="he-inputs-row">
            <div>
              <label className="he-label">Valor A (Plano):</label>
              <input
                type="number"
                className="he-input"
                value={valA}
                onChange={(e) => setValA(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div>
              <label className="he-label">Valor B (Plano):</label>
              <input
                type="number"
                className="he-input"
                value={valB}
                onChange={(e) => setValB(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="he-cipher-box">
            <div className="he-cipher-item">
              <span>Enc(A) Cifrado:</span>
              <code>{encA.slice(0, 24)}...</code>
            </div>
            <div className="he-cipher-item">
              <span>Enc(B) Cifrado:</span>
              <code>{encB.slice(0, 24)}...</code>
            </div>
            <div className="he-cipher-item he-cipher-item--result">
              <span>Cifrado Suma en Servidor Cloud:</span>
              <code>{encSum.slice(0, 24)}...</code>
            </div>
          </div>

          <div className="he-result-badge">
            <span>🔓 Descifrado por el Cliente:</span>
            <strong>{decryptedSum}</strong>
            <span className="he-math-check">({valA} + {valB} = {valA + valB}) ✓</span>
          </div>
        </div>

        <div className="he-calc-card">
          <h3 className="he-section-title">2. Multiplicación Escalar ($Enc(A)^k \pmod{'{n^2}'}$)</h3>
          <div className="he-inputs-row">
            <div>
              <label className="he-label">Valor Base A:</label>
              <input
                type="number"
                className="he-input"
                value={valA}
                disabled
              />
            </div>
            <div>
              <label className="he-label">Multiplicador Escalar k:</label>
              <input
                type="number"
                className="he-input"
                value={scalarK}
                min={1}
                max={100}
                onChange={(e) => setScalarK(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="he-cipher-box">
            <div className="he-cipher-item">
              <span>Enc(A) Cifrado:</span>
              <code>{encA.slice(0, 24)}...</code>
            </div>
            <div className="he-cipher-item he-cipher-item--result">
              <span>Enc(A)^{scalarK} Cifrado en Cloud:</span>
              <code>{encScalarMult.slice(0, 24)}...</code>
            </div>
          </div>

          <div className="he-result-badge">
            <span>🔓 Descifrado por el Cliente:</span>
            <strong>{decryptedScalar}</strong>
            <span className="he-math-check">({valA} × {scalarK} = {valA * scalarK}) ✓</span>
          </div>
        </div>
      </div>

      {/* Caso de Uso Real: Nómina Confidencial */}
      <div className="he-payroll-panel">
        <div className="he-payroll-header">
          <div>
            <h3 className="he-section-title">💼 Caso de Uso: Nómina Empresarial Privada y Confidencial</h3>
            <p className="he-payroll-subtitle">
              Los empleados envían sus salarios cifrados. El servidor cloud calcula la nómina total sin tener acceso a ningún sueldo individual.
            </p>
          </div>
          <button
            className="he-btn-toggle"
            onClick={() => setIsTotalDecrypted(prev => !prev)}
          >
            {isTotalDecrypted ? '🔒 Ocultar Descifrado' : '👁️ Descifrar Nómina Total (CEO)'}
          </button>
        </div>

        <div className="he-table-container">
          <table className="he-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Salario Cifrado (Cloud)</th>
                <th>Bono Cifrado (Cloud)</th>
                <th>Total Compensación Cifrado</th>
              </tr>
            </thead>
            <tbody>
              {payrollResult.encryptedRecords.map((rec, i) => (
                <tr key={i}>
                  <td><strong>{rec.name}</strong></td>
                  <td><code>{rec.salaryCiphertext.slice(0, 18)}...</code></td>
                  <td><code>{rec.bonusCiphertext.slice(0, 18)}...</code></td>
                  <td><code className="he-code-highlight">{rec.totalCiphertext.slice(0, 18)}...</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="he-payroll-summary">
          <div className="he-summary-cipher">
            <span>Total Nómina Cifrada Agregada en Servidor:</span>
            <code>{payrollResult.totalPayrollCiphertext.slice(0, 32)}...</code>
          </div>
          <div className={`he-summary-plain ${isTotalDecrypted ? 'visible' : ''}`}>
            <span>Total Nómina Descifrada:</span>
            <strong>{isTotalDecrypted ? `$${decryptedPayrollTotal.toLocaleString()} USD` : '••••••••••••'}</strong>
          </div>
        </div>
      </div>
    </section>
  )
}
