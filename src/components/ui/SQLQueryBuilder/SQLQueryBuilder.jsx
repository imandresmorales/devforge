/**
 * @fileoverview Componente SQLQueryBuilder — Generador de consultas SQL parametrizadas y auditor anti-SQLi (Mejora 54).
 *
 * CARACTERÍSTICAS:
 * - Constructor visual para SELECT, INSERT, UPDATE y DELETE con soporte para Postgres ($1), MySQL (?) y MSSQL (@p1).
 * - Comparador visual lado a lado: Anti-patrón vulnerable vs. Prepared Statement seguro.
 * - Sandbox interactivo de detección de Inyección SQL con presets de ataques (OWASP Top 10 A03:2021).
 * - Generador de snippets de producción para Node.js (pg, mysql2, better-sqlite3, knex).
 *
 * @module components/ui/SQLQueryBuilder
 */
import { useState, useMemo } from 'react'
import {
  buildParameterizedQuery,
  detectSQLInjectionRisk,
  generateDriverSnippets,
  ALLOWED_OPERATORS,
} from '../../../utils/sqlBuilder'
import { useToast } from '../../../context/ToastContext'
import './SQLQueryBuilder.css'

const ATTACK_PRESETS = [
  {
    label: 'Tautología clásica',
    payload: "' OR '1'='1",
    type: 'Bypass de autenticación',
  },
  {
    label: 'Extracción UNION',
    payload: "' UNION SELECT username, password_hash FROM users --",
    type: 'Fuga de datos confidenciales',
  },
  {
    label: 'Consultas apiladas',
    payload: "admin'; DROP TABLE audit_logs; --",
    type: 'Destrucción de registros',
  },
  {
    label: 'A ciegas (Time-based)',
    payload: "'; SELECT pg_sleep(5); --",
    type: 'Extracción inferencial',
  },
  {
    label: 'Truncamiento de filtro',
    payload: "admin' --",
    type: 'Omisión de password',
  },
  {
    label: 'Valor Seguro',
    payload: 'alex.developer@devforge.io',
    type: 'Entrada legítima',
  },
]

function SQLQueryBuilder() {
  const { addToast } = useToast()

  // Estado del generador
  const [dialect, setDialect] = useState('postgres')
  const [opType, setOpType] = useState('SELECT')
  const [table, setTable] = useState('users')
  const [columnsInput, setColumnsInput] = useState('id, username, email, role')
  const [whereCol, setWhereCol] = useState('email')
  const [whereOp, setWhereOp] = useState('=')
  const [whereVal, setWhereVal] = useState('alex@devforge.io')
  const [insertJson, setInsertJson] = useState('{\n  "username": "alex_dev",\n  "email": "alex@devforge.io",\n  "role": "admin"\n}')
  const [limit, setLimit] = useState(25)

  // Estado del sandbox anti-SQLi
  const [sandboxInput, setSandboxInput] = useState("' OR '1'='1")
  const [activeTab, setActiveTab] = useState('builder') // 'builder' | 'sandbox'
  const [activeDriverTab, setActiveDriverTab] = useState('pg')

  // Construcción de la consulta segura
  const queryResult = useMemo(() => {
    try {
      const cols = columnsInput.split(',').map((c) => c.trim()).filter(Boolean)
      const where = whereVal
        ? [{ column: whereCol, operator: whereOp, value: whereVal }]
        : []

      let values = {}
      if (opType === 'INSERT' || opType === 'UPDATE') {
        try {
          values = JSON.parse(insertJson)
        } catch {
          values = { name: 'ejemplo' }
        }
      }

      return {
        success: true,
        data: buildParameterizedQuery({
          type: opType,
          table: table.trim() || 'users',
          columns: cols.length > 0 ? cols : ['*'],
          where,
          values,
          limit: opType === 'SELECT' ? Number(limit) : undefined,
          dialect,
        }),
      }
    } catch (err) {
      return {
        success: false,
        error: err.message,
      }
    }
  }, [opType, table, columnsInput, whereCol, whereOp, whereVal, insertJson, limit, dialect])

  // Auditoría en tiempo real del sandbox
  const sqliAudit = useMemo(() => {
    return detectSQLInjectionRisk(sandboxInput)
  }, [sandboxInput])

  // Snippets de drivers
  const driverSnippets = useMemo(() => {
    if (!queryResult.success) return null
    return generateDriverSnippets(queryResult.data.sql, queryResult.data.params, dialect)
  }, [queryResult, dialect])

  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text)
    addToast({
      type: 'success',
      title: 'Copiado al portapapeles',
      message: `${label} copiado exitosamente.`,
    })
  }

  return (
    <section className="sql-builder-section" aria-label="Generador de Consultas SQL Seguras y Anti-SQLi">
      {/* ── Encabezado ── */}
      <div className="sql-builder-header">
        <div>
          <div className="sql-badge-wrapper">
            <span className="badge badge--brand">🛡️ Seguridad OWASP A03:2021</span>
            <span className="badge badge--success">Prepared Statements</span>
          </div>
          <h2 className="sql-builder-title">
            Generador de Consultas SQL Parametrizadas & Detector Anti-SQLi
          </h2>
          <p className="sql-builder-subtitle">
            Evita vulnerabilidades de inyección SQL (CWE-89) aislando los datos de la sintaxis SQL mediante placeholders y analiza entradas maliciosas en tiempo real.
          </p>
        </div>

        {/* Pestañas de modo */}
        <div className="sql-mode-tabs" role="tablist">
          <button
            type="button"
            className={`sql-mode-tab ${activeTab === 'builder' ? 'sql-mode-tab--active' : ''}`}
            onClick={() => setActiveTab('builder')}
            role="tab"
            aria-selected={activeTab === 'builder'}
          >
            🧩 Constructor Seguro
          </button>
          <button
            type="button"
            className={`sql-mode-tab ${activeTab === 'sandbox' ? 'sql-mode-tab--active' : ''}`}
            onClick={() => setActiveTab('sandbox')}
            role="tab"
            aria-selected={activeTab === 'sandbox'}
          >
            🧪 Scanner Anti-SQLi
          </button>
        </div>
      </div>

      {activeTab === 'builder' && (
        <div className="sql-builder-body">
          {/* ── Barra de Controles ── */}
          <div className="sql-controls-card">
            <div className="sql-controls-grid">
              {/* Dialecto */}
              <div className="sql-control-group">
                <label htmlFor="sql-dialect" className="sql-label">Dialecto SQL:</label>
                <select
                  id="sql-dialect"
                  className="sql-select"
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value)}
                >
                  <option value="postgres">PostgreSQL ($1, $2)</option>
                  <option value="mysql">MySQL / MariaDB (?)</option>
                  <option value="mssql">SQL Server (@p1, @p2)</option>
                  <option value="sqlite">SQLite (?)</option>
                </select>
              </div>

              {/* Operación */}
              <div className="sql-control-group">
                <label htmlFor="sql-operation" className="sql-label">Operación:</label>
                <select
                  id="sql-operation"
                  className="sql-select"
                  value={opType}
                  onChange={(e) => setOpType(e.target.value)}
                >
                  <option value="SELECT">SELECT</option>
                  <option value="INSERT">INSERT</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              {/* Tabla */}
              <div className="sql-control-group">
                <label htmlFor="sql-table" className="sql-label">Tabla (Identificador):</label>
                <input
                  id="sql-table"
                  type="text"
                  className="sql-input"
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  placeholder="ej. users"
                />
              </div>

              {/* Columnas (SELECT) */}
              {opType === 'SELECT' && (
                <div className="sql-control-group">
                  <label htmlFor="sql-columns" className="sql-label">Columnas (separadas por coma):</label>
                  <input
                    id="sql-columns"
                    type="text"
                    className="sql-input"
                    value={columnsInput}
                    onChange={(e) => setColumnsInput(e.target.value)}
                    placeholder="id, username, email"
                  />
                </div>
              )}
            </div>

            {/* Cláusula WHERE */}
            <div className="sql-where-builder">
              <span className="sql-where-title">Filtro Condicional WHERE:</span>
              <div className="sql-where-row">
                <input
                  type="text"
                  className="sql-input sql-where-col"
                  placeholder="Columna (ej. email)"
                  value={whereCol}
                  onChange={(e) => setWhereCol(e.target.value)}
                />
                <select
                  className="sql-select sql-where-op"
                  value={whereOp}
                  onChange={(e) => setWhereOp(e.target.value)}
                >
                  {ALLOWED_OPERATORS.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="sql-input sql-where-val"
                  placeholder="Valor del parámetro (ej. admin@devforge.io)"
                  value={whereVal}
                  onChange={(e) => setWhereVal(e.target.value)}
                />
              </div>
            </div>

            {/* Valores JSON para INSERT / UPDATE */}
            {(opType === 'INSERT' || opType === 'UPDATE') && (
              <div className="sql-values-group">
                <label htmlFor="sql-values-json" className="sql-label">Valores del Registro (JSON):</label>
                <textarea
                  id="sql-values-json"
                  className="sql-textarea"
                  rows={4}
                  value={insertJson}
                  onChange={(e) => setInsertJson(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* ── Visualización Comparativa ── */}
          {queryResult.success ? (
            <div className="sql-comparison-grid">
              {/* Opción Insegura */}
              <div className="sql-code-card sql-code-card--danger">
                <div className="sql-card-header">
                  <div className="sql-card-tag sql-card-tag--danger">
                    <span>❌ Anti-Patrón Vulnerable (CWE-89)</span>
                  </div>
                  <button
                    type="button"
                    className="sql-btn-copy"
                    onClick={() => handleCopy(queryResult.data.insecureSql, 'Consulta insegura')}
                  >
                    Copiar
                  </button>
                </div>
                <pre className="sql-code-block sql-code-block--danger">
                  <code>{queryResult.data.insecureSql}</code>
                </pre>
                <p className="sql-card-footnote sql-card-footnote--danger">
                  ⚠️ <strong>Peligro:</strong> Concatenar texto permite que un atacante cierre las comillas y ejecute cláusulas adicionales sin control.
                </p>
              </div>

              {/* Opción Segura */}
              <div className="sql-code-card sql-code-card--secure">
                <div className="sql-card-header">
                  <div className="sql-card-tag sql-card-tag--secure">
                    <span>✅ Patrón Seguro (Prepared Statement)</span>
                  </div>
                  <button
                    type="button"
                    className="sql-btn-copy"
                    onClick={() => handleCopy(queryResult.data.sql, 'Consulta parametrizada')}
                  >
                    Copiar SQL
                  </button>
                </div>
                <pre className="sql-code-block sql-code-block--secure">
                  <code>{queryResult.data.sql}</code>
                </pre>

                {/* Parámetros Vinculados */}
                <div className="sql-params-box">
                  <span className="sql-params-title">Valores Vinculados (Separados de la Sintaxis):</span>
                  <pre className="sql-params-code">
                    <code>{JSON.stringify(queryResult.data.params, null, 2)}</code>
                  </pre>
                </div>

                <p className="sql-card-footnote sql-card-footnote--secure">
                  🛡️ <strong>Seguro:</strong> El motor de base de datos compila la consulta primero y trata los parámetros como literales puros, neutralizando cualquier inyección.
                </p>
              </div>
            </div>
          ) : (
            <div className="sql-error-alert" role="alert">
              ⚠️ Error en la construcción: {queryResult.error}
            </div>
          )}

          {/* ── Snippets de Node.js ── */}
          {driverSnippets && (
            <div className="sql-snippets-card">
              <div className="sql-snippets-header">
                <h3 className="sql-snippets-title">💻 Implementación en Servidor (Node.js)</h3>
                <div className="sql-driver-tabs">
                  {['pg', 'mysql2', 'betterSqlite', 'knex'].map((drv) => (
                    <button
                      key={drv}
                      type="button"
                      className={`sql-driver-tab ${activeDriverTab === drv ? 'sql-driver-tab--active' : ''}`}
                      onClick={() => setActiveDriverTab(drv)}
                    >
                      {drv === 'pg' ? 'Postgres (pg)' : drv === 'mysql2' ? 'MySQL (mysql2)' : drv === 'betterSqlite' ? 'SQLite3' : 'Knex Query Builder'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sql-snippet-content">
                <pre className="sql-code-block">
                  <code>{driverSnippets[activeDriverTab]}</code>
                </pre>
                <button
                  type="button"
                  className="btn-secondary sql-btn-copy-driver"
                  onClick={() => handleCopy(driverSnippets[activeDriverTab], `Código ${activeDriverTab}`)}
                >
                  📋 Copiar Snippet
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modo Sandbox Anti-SQLi ── */}
      {activeTab === 'sandbox' && (
        <div className="sql-sandbox-body">
          <div className="sql-sandbox-panel">
            <h3 className="sql-sandbox-panel-title">🧪 Banco de Pruebas de Inyección SQL</h3>
            <p className="sql-sandbox-panel-desc">
              Ingresa una cadena o selecciona un vector de ataque predefinido para auditar las firmas de inyección SQL y comprender cómo mitigarlo.
            </p>

            {/* Botones de presets */}
            <div className="sql-presets-grid">
              {ATTACK_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="sql-preset-btn"
                  onClick={() => setSandboxInput(preset.payload)}
                >
                  <span className="sql-preset-label">{preset.label}</span>
                  <span className="sql-preset-type">{preset.type}</span>
                </button>
              ))}
            </div>

            {/* Input de prueba */}
            <div className="sql-sandbox-input-group">
              <label htmlFor="sql-sandbox-input" className="sql-label">Entrada no confiable a auditar:</label>
              <textarea
                id="sql-sandbox-input"
                className="sql-textarea sql-sandbox-input"
                rows={3}
                value={sandboxInput}
                onChange={(e) => setSandboxInput(e.target.value)}
                placeholder="Ingresa texto o payload SQL..."
              />
            </div>

            {/* Resultado del escaneo */}
            <div className={`sql-risk-report sql-risk-report--${sqliAudit.riskLevel.toLowerCase()}`}>
              <div className="sql-risk-badge-row">
                <span className={`sql-risk-badge sql-risk-badge--${sqliAudit.riskLevel.toLowerCase()}`}>
                  {sqliAudit.riskLevel === 'CRITICAL' && '🚨 RIESGO CRÍTICO'}
                  {sqliAudit.riskLevel === 'HIGH' && '⚠️ RIESGO ALTO'}
                  {sqliAudit.riskLevel === 'MEDIUM' && '⚡ RIESGO MEDIO'}
                  {sqliAudit.riskLevel === 'SAFE' && '🛡️ ENTRADA SEGURA'}
                </span>
                <span className="sql-risk-score">Puntaje de Amenaza: {sqliAudit.score}/100</span>
              </div>

              {sqliAudit.matches.length > 0 ? (
                <div className="sql-matches-list">
                  <h4 className="sql-matches-title">Patrones y Firmas de Ataque Detectadas:</h4>
                  {sqliAudit.matches.map((m, idx) => (
                    <div key={idx} className="sql-match-item">
                      <div className="sql-match-name">
                        <span className="badge badge--warning">{m.severity}</span>
                        <strong>{m.name}</strong>
                      </div>
                      <p className="sql-match-desc">{m.description}</p>
                      <code className="sql-match-string">Fragmento coincidente: {m.match}</code>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sql-safe-msg">
                  No se detectaron firmas evidentes de inyección SQL. Recuerda que la única defensa definitiva es no concatenar variables en cadenas SQL.
                </p>
              )}

              <div className="sql-remediation-box">
                <strong>💡 Recomendación de Remediación OWASP:</strong>
                <p>{sqliAudit.remediation}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default SQLQueryBuilder
