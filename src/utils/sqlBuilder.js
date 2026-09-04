/**
 * @fileoverview Motor de construcción de consultas SQL parametrizadas y detector de inyecciones SQL (Mejora 54).
 *
 * CARACTERÍSTICAS:
 * - Generador de sentencias preparadas (Prepared Statements) para SELECT, INSERT, UPDATE y DELETE.
 * - Soporte de múltiples dialectos con sus respectivos placeholders:
 *     - PostgreSQL: Posicionales ($1, $2, $3...)
 *     - MySQL / MariaDB / SQLite: Anónimos (?, ?)
 *     - SQL Server (MSSQL): Nombrados (@p1, @p2...)
 * - Sanitización estricta y lista blanca de identificadores (tablas y columnas) para evitar inyección de segundo orden.
 * - Scanner heurístico de firmas de Inyección SQL (OWASP A03:2021, CWE-89):
 *     - Tautologías booleanas (' OR '1'='1)
 *     - Ataques basados en UNION (UNION SELECT)
 *     - Consultas apiladas (Stacked Queries: ; DROP TABLE)
 *     - Ataques a ciegas por tiempo (Time-based Blind: pg_sleep, SLEEP, WAITFOR DELAY)
 *     - Metadatos de catálogo (information_schema, sys.tables, sqlite_master)
 * - Generación de snippets de código seguros para Node.js (pg, mysql2, better-sqlite3, knex).
 *
 * @module utils/sqlBuilder
 */

/**
 * Expresión regular estricta para identificadores SQL seguros.
 * Admite letras, números y guiones bajos; debe comenzar con letra o guion bajo.
 */
export const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Operadores SQL permitidos en cláusulas WHERE.
 */
export const ALLOWED_OPERATORS = ['=', '!=', '<>', '>', '<', '>=', '<=', 'LIKE', 'ILIKE', 'IS NULL', 'IS NOT NULL', 'IN']

/**
 * Valida y formatea un identificador (tabla o columna) de forma segura según el dialecto.
 * Previene la inyección de identificadores dinámicos no controlados.
 *
 * @param {string} identifier - Nombre del identificador.
 * @param {('postgres'|'mysql'|'mssql'|'sqlite')} [dialect='postgres'] - Dialecto SQL.
 * @returns {string} Identificador delimitado y validado.
 * @throws {Error} Si el identificador contiene caracteres no permitidos.
 */
export function sanitizeIdentifier(identifier, dialect = 'postgres') {
  if (typeof identifier !== 'string' || !identifier.trim()) {
    throw new Error('El identificador SQL no puede estar vacío.')
  }

  const clean = identifier.trim()
  if (!IDENTIFIER_REGEX.test(clean)) {
    throw new Error(`Identificador SQL potencialmente inseguro: "${identifier}". Solo se permiten caracteres alfanuméricos y guion bajo.`)
  }

  switch (dialect) {
    case 'mysql':
      return `\`${clean}\``
    case 'mssql':
      return `[${clean}]`
    case 'postgres':
    case 'sqlite':
    default:
      return `"${clean}"`
  }
}

/**
 * Retorna la representación del placeholder según el dialecto y el índice (1-based).
 *
 * @param {number} index - Índice del parámetro (1, 2, 3...).
 * @param {('postgres'|'mysql'|'mssql'|'sqlite')} [dialect='postgres'] - Dialecto SQL.
 * @returns {string} Placeholder format.
 */
export function getPlaceholder(index, dialect = 'postgres') {
  switch (dialect) {
    case 'postgres':
      return `$${index}`
    case 'mssql':
      return `@p${index}`
    case 'mysql':
    case 'sqlite':
    default:
      return '?'
  }
}

/**
 * Construye una consulta SQL parametrizada garantizando la separación entre código y datos.
 *
 * @param {Object} options - Parámetros de la consulta.
 * @param {('SELECT'|'INSERT'|'UPDATE'|'DELETE')} [options.type='SELECT'] - Tipo de operación.
 * @param {string} options.table - Nombre de la tabla objetivo.
 * @param {string[]|string} [options.columns=['*']] - Columnas a seleccionar o retornar.
 * @param {Array<{ column: string, operator: string, value: any }>} [options.where=[]] - Condiciones WHERE.
 * @param {Object} [options.values={}] - Valores para INSERT o UPDATE.
 * @param {number} [options.limit] - Límite de resultados.
 * @param {number} [options.offset] - Desplazamiento.
 * @param {Array<{ column: string, direction?: 'ASC'|'DESC' }>} [options.orderBy=[]] - Ordenación.
 * @param {('postgres'|'mysql'|'mssql'|'sqlite')} [options.dialect='postgres'] - Dialecto SQL.
 * @returns {{ sql: string, params: Array<any>, dialect: string, insecureSql: string }}
 */
export function buildParameterizedQuery(options = {}) {
  const {
    type = 'SELECT',
    table,
    columns = ['*'],
    where = [],
    values = {},
    limit,
    offset,
    orderBy = [],
    dialect = 'postgres',
  } = options

  if (!table) {
    throw new Error('Debe especificarse el nombre de la tabla.')
  }

  const safeTable = sanitizeIdentifier(table, dialect)
  const params = []
  let paramIndex = 1

  // Generador de placeholders con actualización de índice y acumulador de parámetros
  const addParam = (val) => {
    params.push(val)
    const ph = getPlaceholder(paramIndex, dialect)
    paramIndex++
    return ph
  }

  let sql = ''
  let insecureSql = ''

  // ── Construcción de cláusula WHERE ──
  const buildWhereClause = () => {
    if (!Array.isArray(where) || where.length === 0) return { wherePart: '', insecureWherePart: '' }

    const conditions = []
    const insecureConditions = []

    where.forEach((cond) => {
      if (!cond || !cond.column) return
      const safeCol = sanitizeIdentifier(cond.column, dialect)
      const op = cond.operator && ALLOWED_OPERATORS.includes(cond.operator.toUpperCase())
        ? cond.operator.toUpperCase()
        : '='

      if (op === 'IS NULL' || op === 'IS NOT NULL') {
        conditions.push(`${safeCol} ${op}`)
        insecureConditions.push(`${cond.column} ${op}`)
      } else if (op === 'IN' && Array.isArray(cond.value)) {
        if (cond.value.length === 0) {
          conditions.push('1 = 0')
          insecureConditions.push('1 = 0')
        } else {
          const phs = cond.value.map((v) => addParam(v)).join(', ')
          conditions.push(`${safeCol} IN (${phs})`)
          insecureConditions.push(`${cond.column} IN (${cond.value.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')})`)
        }
      } else {
        const ph = addParam(cond.value)
        conditions.push(`${safeCol} ${op} ${ph}`)
        const formattedVal = typeof cond.value === 'string' ? `'${cond.value}'` : String(cond.value)
        insecureConditions.push(`${cond.column} ${op} ${formattedVal}`)
      }
    })

    if (conditions.length === 0) return { wherePart: '', insecureWherePart: '' }

    return {
      wherePart: ` WHERE ${conditions.join(' AND ')}`,
      insecureWherePart: ` WHERE ${insecureConditions.join(' AND ')}`,
    }
  }

  // ── Operación SELECT ──
  if (type === 'SELECT') {
    let safeCols = '*'
    let insecureCols = '*'
    if (Array.isArray(columns) && columns.length > 0 && columns[0] !== '*') {
      safeCols = columns.map((c) => sanitizeIdentifier(c, dialect)).join(', ')
      insecureCols = columns.join(', ')
    }

    const { wherePart, insecureWherePart } = buildWhereClause()
    let orderPart = ''
    let insecureOrder = ''

    if (Array.isArray(orderBy) && orderBy.length > 0) {
      const orderClauses = orderBy.map((o) => {
        const col = sanitizeIdentifier(o.column, dialect)
        const dir = o.direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
        return `${col} ${dir}`
      })
      orderPart = ` ORDER BY ${orderClauses.join(', ')}`
      insecureOrder = ` ORDER BY ${orderBy.map(o => `${o.column} ${o.direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`).join(', ')}`
    }

    let limitPart = ''
    if (typeof limit === 'number' && limit > 0) {
      limitPart += ` LIMIT ${Number(limit)}`
    }
    if (typeof offset === 'number' && offset > 0) {
      limitPart += ` OFFSET ${Number(offset)}`
    }

    sql = `SELECT ${safeCols} FROM ${safeTable}${wherePart}${orderPart}${limitPart};`
    insecureSql = `SELECT ${insecureCols} FROM ${table}${insecureWherePart}${insecureOrder}${limitPart};`
  }

  // ── Operación INSERT ──
  else if (type === 'INSERT') {
    const keys = Object.keys(values)
    if (keys.length === 0) {
      throw new Error('Debe proporcionar al menos una columna y valor para la operación INSERT.')
    }

    const safeCols = keys.map((k) => sanitizeIdentifier(k, dialect)).join(', ')
    const placeholders = keys.map((k) => addParam(values[k])).join(', ')
    const insecureVals = keys.map((k) => typeof values[k] === 'string' ? `'${values[k]}'` : values[k]).join(', ')

    sql = `INSERT INTO ${safeTable} (${safeCols}) VALUES (${placeholders});`
    insecureSql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${insecureVals});`
  }

  // ── Operación UPDATE ──
  else if (type === 'UPDATE') {
    const keys = Object.keys(values)
    if (keys.length === 0) {
      throw new Error('Debe proporcionar al menos una columna y valor para la operación UPDATE.')
    }

    const setClauses = keys.map((k) => {
      const safeCol = sanitizeIdentifier(k, dialect)
      const ph = addParam(values[k])
      return `${safeCol} = ${ph}`
    }).join(', ')

    const insecureSets = keys.map((k) => {
      const v = typeof values[k] === 'string' ? `'${values[k]}'` : values[k]
      return `${k} = ${v}`
    }).join(', ')

    const { wherePart, insecureWherePart } = buildWhereClause()

    sql = `UPDATE ${safeTable} SET ${setClauses}${wherePart};`
    insecureSql = `UPDATE ${table} SET ${insecureSets}${insecureWherePart};`
  }

  // ── Operación DELETE ──
  else if (type === 'DELETE') {
    const { wherePart, insecureWherePart } = buildWhereClause()

    sql = `DELETE FROM ${safeTable}${wherePart};`
    insecureSql = `DELETE FROM ${table}${insecureWherePart};`
  }

  return {
    sql,
    params,
    dialect,
    insecureSql,
  }
}

/**
 * Lista de firmas de ataque de inyección SQL para el scanner estático.
 */
export const SQLI_SIGNATURES = [
  {
    pattern: /('\s*(or|and)\s*('?[0-9a-z]+'?)\s*=\s*('?\3'?)|1=1|true\s*=\s*true)/i,
    name: 'Tautología Booleana (Bypass de Autenticación)',
    severity: 'CRITICAL',
    description: 'Fuerza una condición siempre verdadera para omitir validaciones o volcar registros confidenciales.',
    example: "' OR '1'='1",
  },
  {
    pattern: /\bunion(\s+all)?\s+select\b/i,
    name: 'Ataque Basado en UNION (UNION-based SQLi)',
    severity: 'CRITICAL',
    description: 'Permite unir los resultados de la consulta legítima con consultas a tablas del sistema o contraseñas.',
    example: "' UNION SELECT username, password_hash FROM users --",
  },
  {
    pattern: /;\s*(drop|alter|truncate|delete|insert|update|create|exec|shutdown)\b/i,
    name: 'Consultas Apiladas (Stacked Queries)',
    severity: 'CRITICAL',
    description: 'Finaliza la consulta principal mediante punto y coma y ejecuta un comando destructivo adicional.',
    example: "'; DROP TABLE audit_logs; --",
  },
  {
    pattern: /\b(waitfor\s+delay|pg_sleep\s*\(|sleep\s*\(|benchmark\s*\()/i,
    name: 'Inyección a Ciegas por Tiempo (Time-based Blind SQLi)',
    severity: 'HIGH',
    description: 'Inyecta retardos temporales para inferir datos caracter por caracter midiendo el tiempo de respuesta del servidor.',
    example: "'; WAITFOR DELAY '0:0:5'--",
  },
  {
    pattern: /\b(information_schema|sqlite_master|sys\.tables|pg_catalog)\b/i,
    name: 'Extracción de Metadatos de Esquema (Schema Enumeration)',
    severity: 'HIGH',
    description: 'Explora los metadatos internos del motor para mapear la base de datos completa.',
    example: "' UNION SELECT table_name, column_name FROM information_schema.columns --",
  },
  {
    pattern: /(--|\/\*|\*\/|#)/,
    name: 'Comentarios de Truncamiento SQL',
    severity: 'MEDIUM',
    description: 'Trunca el resto de la consulta SQL legítima (como filtros de tenant o cláusulas de borrado lógico).',
    example: "admin' --",
  },
]

/**
 * Analiza una cadena de entrada no confiable en busca de patrones característicos de Inyección SQL.
 *
 * @param {string} rawInput - Texto ingresado por el usuario o consulta sin parametrizar.
 * @returns {{
 *   isVulnerable: boolean,
 *   riskLevel: 'CRITICAL'|'HIGH'|'MEDIUM'|'SAFE',
 *   score: number,
 *   matches: Array<{ name: string, severity: string, description: string, match: string }>,
 *   remediation: string
 * }}
 */
export function detectSQLInjectionRisk(rawInput) {
  if (typeof rawInput !== 'string' || !rawInput.trim()) {
    return {
      isVulnerable: false,
      riskLevel: 'SAFE',
      score: 0,
      matches: [],
      remediation: 'Entrada vacía. Utilice siempre consultas parametrizadas con placeholders.',
    }
  }

  const matches = []

  SQLI_SIGNATURES.forEach((sig) => {
    const found = rawInput.match(sig.pattern)
    if (found) {
      matches.push({
        name: sig.name,
        severity: sig.severity,
        description: sig.description,
        match: found[0],
      })
    }
  })

  if (matches.length === 0) {
    return {
      isVulnerable: false,
      riskLevel: 'SAFE',
      score: 0,
      matches: [],
      remediation: 'No se detectaron firmas evidentes de inyección SQL. No obstante, mantenga el uso mandatorio de Prepared Statements.',
    }
  }

  const hasCritical = matches.some((m) => m.severity === 'CRITICAL')
  const hasHigh = matches.some((m) => m.severity === 'HIGH')

  const riskLevel = hasCritical ? 'CRITICAL' : hasHigh ? 'HIGH' : 'MEDIUM'
  const score = hasCritical ? 95 : hasHigh ? 75 : 45

  return {
    isVulnerable: true,
    riskLevel,
    score,
    matches,
    remediation: 'CRÍTICO: Nunca concatene entradas de usuario en sentencias SQL. Separe la estructura SQL de los datos utilizando placeholders ($1, ?, @p1) o un ORM/Query Builder seguro (Prisma, Knex, Kysely).',
  }
}

/**
 * Genera snippets de código listos para producción para ejecutar la consulta de forma segura en Node.js.
 *
 * @param {string} sql - Sentencia SQL parametrizada.
 * @param {Array<any>} params - Parámetros vinculados.
 * @param {string} dialect - Dialecto SQL.
 * @returns {{ pg: string, mysql2: string, knex: string, betterSqlite: string }}
 */
export function generateDriverSnippets(sql, params, dialect = 'postgres') {
  const jsonParams = JSON.stringify(params)

  const pg = `// Driver: pg (node-postgres)
import { Pool } from 'pg'
const pool = new Pool()

const text = ${JSON.stringify(sql)}
const values = ${jsonParams}

const { rows } = await pool.query(text, values)`

  const mysql2 = `// Driver: mysql2 / promise
import mysql from 'mysql2/promise'
const connection = await mysql.createConnection({ /* config */ })

const sql = ${JSON.stringify(sql)}
const params = ${jsonParams}

const [rows] = await connection.execute(sql, params)`

  const betterSqlite = `// Driver: better-sqlite3
import Database from 'better-sqlite3'
const db = new Database('app.db')

const stmt = db.prepare(${JSON.stringify(sql)})
const rows = stmt.all(...${jsonParams})`

  const knex = `// Query Builder: Knex.js Raw
import knex from 'knex'
const db = knex({ client: '${dialect}' })

const results = await db.raw(
  ${JSON.stringify(sql)},
  ${jsonParams}
)`

  return {
    pg,
    mysql2,
    betterSqlite,
    knex,
  }
}
