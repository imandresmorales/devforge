/**
 * @fileoverview Motor de Auditoría y Detección de Inyección SQL de Segundo Orden (Mejora 92).
 *
 * SEGURIDAD DE LA INFORMACIÓN & MITIGACIÓN OWASP:
 * - Mitigación estricta de CWE-89: SQL Injection (Second-Order / Stored SQLi).
 * - En la inyección de segundo orden, el payload malicioso se almacena primero en la base de datos de forma pasiva
 *   y solo se ejecuta cuando otro proceso o consulta posterior concatena ese valor de forma insegura.
 * - Motor de consultas parametrizadas (Prepared Statements con placeholders $1, $2) y separación estricta de código y datos.
 *
 * @module utils/secondOrderSqliAuditor
 */

/**
 * Simulación de base de datos relacional en memoria con usuarios y registros.
 */
export class SimulatedDatabase {
  constructor() {
    this.users = [
      { id: 1, username: 'admin', email: 'admin@devforge.app', role: 'SUPERADMIN', balance: 50000 },
      { id: 2, username: 'john_dev', email: 'john@devforge.app', role: 'DEVELOPER', balance: 1200 },
      { id: 3, username: 'alice_sec', email: 'alice@devforge.app', role: 'AUDITOR', balance: 3400 },
    ]
    this.auditLogs = []
  }

  /**
   * Registra un usuario (Paso 1 del ataque: Almacenamiento del Payload).
   * @param {string} username
   * @param {string} email
   * @param {string} [role='USER']
   */
  insertUser(username, email, role = 'USER') {
    const newUser = {
      id: this.users.length + 1,
      username,
      email,
      role,
      balance: 100,
    }
    this.users.push(newUser)
    return newUser
  }

  /**
   * Ejecuta una consulta vulnerable que concatena datos previamente almacenados (Paso 2: Disparo del Exploit).
   *
   * @param {string} storedUsername
   * @returns {{ rawSql: string, isCompromised: boolean, affectedRows: Array<Object>, message: string }}
   */
  executeVulnerableProfileAudit(storedUsername) {
    // VULNERABILIDAD: Concatenación directa de string almacenado en consulta posterior
    const rawSql = `SELECT id, username, email, role, balance FROM users WHERE username = '${storedUsername}'`

    // Detección de payloads de inyección SQL clásicos y de segundo orden
    const isInjectionPayload = /'|\b(OR|AND|UNION|SELECT|UPDATE|DELETE|DROP|--|#|\/\*)\b/i.test(storedUsername)

    if (isInjectionPayload) {
      // Simular comportamiento de inyección: retorno de todos los usuarios o datos privilegiados
      if (storedUsername.includes("' OR '1'='1") || storedUsername.includes("' OR 1=1") || storedUsername.includes("admin'--")) {
        return {
          rawSql,
          isCompromised: true,
          affectedRows: [...this.users], // Fuga total de la tabla
          message: '🚨 ¡INYECCIÓN SQL DE SEGUNDO ORDEN EXITOSA! La consulta se desbordó y expuso toda la base de datos.',
        }
      }
      if (storedUsername.includes("UPDATE users SET role='SUPERADMIN'")) {
        return {
          rawSql,
          isCompromised: true,
          affectedRows: this.users.map((u) => ({ ...u, role: 'SUPERADMIN' })),
          message: '🚨 ¡ESCALADA DE PRIVILEGIOS! Se ejecutó comando SQL secundario arbitrario.',
        }
      }
    }

    const matched = this.users.filter((u) => u.username === storedUsername)
    return {
      rawSql,
      isCompromised: false,
      affectedRows: matched,
      message: matched.length > 0 ? 'Consulta ejecutada normalmente.' : 'Usuario no encontrado.',
    }
  }

  /**
   * Ejecuta la misma consulta mediante Sentencias Preparadas (Prepared Statements) parametrizadas.
   *
   * @param {string} storedUsername
   * @returns {{ preparedSql: string, params: Array<any>, isCompromised: boolean, affectedRows: Array<Object>, message: string }}
   */
  executeParameterizedProfileAudit(storedUsername) {
    // SEGURO: Código SQL inmutable separado de los parámetros de usuario ($1)
    const preparedSql = 'SELECT id, username, email, role, balance FROM users WHERE username = $1'
    const params = [storedUsername]

    // El motor de base de datos trata el storedUsername estrictamente como un valor literal
    const matched = this.users.filter((u) => u.username === storedUsername)

    return {
      preparedSql,
      params,
      isCompromised: false,
      affectedRows: matched,
      message: '🛡️ PROTEGIDO: Prepared Statement ejecutado en tiempo de compilación SQL. El payload fue tratado como texto plano.',
    }
  }
}

/**
 * Payloads preconfigurados de prueba para inyección SQL de segundo orden.
 */
export const SECOND_ORDER_SQLI_PAYLOADS = [
  {
    id: 'payload-bypass',
    name: "admin'-- (Authentication Bypass)",
    payload: "admin'--",
    description: 'Comenta el resto de la condición WHERE al reutilizar el nombre de usuario.',
  },
  {
    id: 'payload-or-true',
    name: "' OR '1'='1 (Data Exfiltration)",
    payload: "' OR '1'='1",
    description: 'Fuerza la condición booleana a VERDADERO, retornando todos los registros.',
  },
  {
    id: 'payload-priv-esc',
    name: "attacker'; UPDATE users SET role='SUPERADMIN'--",
    payload: "attacker'; UPDATE users SET role='SUPERADMIN'--",
    description: 'Inyección multiconsulta (Stacked Queries) para alterar roles y privilegios.',
  },
]
