/**
 * @fileoverview Motor de Simulación de Pipeline CI/CD y Pruebas de Seguridad Estática SAST (Mejora 72).
 *
 * CARACTERÍSTICAS:
 * - Ejecución secuencial de etapas del ciclo de vida DevSecOps:
 *     1. Lint & Sintaxis (Code Quality Gate).
 *     2. SAST Security Scan (Detección de Secrets, XSS, eval, SQLi, Criptografía débil).
 *     3. Automated Unit Testing & Coverage Gate (Umbral de cobertura configurable).
 *     4. SCA (Software Composition Analysis) para detección de CVEs en dependencias.
 *     5. Build & Deploy Artifact (Condicionado a la aprobación de todas las puertas de seguridad).
 * - Políticas de ruptura de compilación ("Break-the-Build") ante hallazgos críticos de seguridad.
 * - Generación de logs estructurados en tiempo real para visualización en terminal.
 *
 * @module utils/cicdPipeline
 */

export const PIPELINE_STATUS = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
}

export const STAGE_NAMES = {
  CHECKOUT: '1. Checkout & Linting',
  SAST_SCAN: '2. SAST Security Scan (DevSecOps)',
  TESTING: '3. Automated Unit Tests & Coverage',
  SCA_AUDIT: '4. Software Composition Analysis (SCA)',
  BUILD_DEPLOY: '5. Build & Production Deploy',
}

/**
 * Reglas de análisis estático SAST basadas en patrones OWASP/CWE.
 */
export const SAST_RULES = [
  {
    id: 'SEC-001',
    name: 'Hardcoded Secret / API Key Leak',
    severity: 'CRITICAL',
    regex: /(api[_-]?key|secret|password|bearer|auth[_-]?token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i,
    cwe: 'CWE-798',
    message: 'Credencial, clave de API o token privado expuesto en el código fuente en texto plano.',
  },
  {
    id: 'SEC-002',
    name: 'Insecure Dynamic Code Execution (eval)',
    severity: 'CRITICAL',
    regex: /\beval\s*\(|new\s+Function\s*\(/i,
    cwe: 'CWE-95',
    message: 'Uso de eval() o new Function() permite ejecución arbitraria de código (Remote Code Execution).',
  },
  {
    id: 'SEC-003',
    name: 'Raw DOM innerHTML XSS Vulnerability',
    severity: 'HIGH',
    regex: /\.innerHTML\s*=\s*[^"'\n]*(\+|`|\$)/i,
    cwe: 'CWE-79',
    message: 'Asignación no sanitizada a innerHTML vulnerable a Cross-Site Scripting (XSS).',
  },
  {
    id: 'SEC-004',
    name: 'Weak Cryptographic Algorithm',
    severity: 'HIGH',
    regex: /createHash\s*\(\s*['"](md5|sha1)['"]\s*\)/i,
    cwe: 'CWE-328',
    message: 'Algoritmo de hash criptográficamente roto (MD5/SHA1). Use SHA-256 o Argon2id.',
  },
  {
    id: 'SEC-005',
    name: 'SQL String Concatenation (SQLi Risk)',
    severity: 'CRITICAL',
    regex: /(SELECT|INSERT|UPDATE|DELETE)\s+.*\+\s*[a-zA-Z0-9_$]+/i,
    cwe: 'CWE-89',
    message: 'Concatenación directa de strings en consultas SQL. Utilice queries parametrizadas.',
  },
]

/**
 * Ejecuta el análisis SAST sobre un bloque de código fuente.
 * @param {string} sourceCode
 * @returns {Array<Object>} Lista de vulnerabilidades detectadas
 */
export function runSastScan(sourceCode = '') {
  const findings = []
  const lines = sourceCode.split('\n')

  lines.forEach((line, lineIndex) => {
    SAST_RULES.forEach((rule) => {
      if (rule.regex.test(line)) {
        findings.push({
          ruleId: rule.id,
          name: rule.name,
          severity: rule.severity,
          cwe: rule.cwe,
          line: lineIndex + 1,
          snippet: line.trim(),
          message: rule.message,
        })
      }
    })
  })

  return findings
}

/**
 * Clase ejecutora de la Pipeline CI/CD.
 */
export class CICDPipelineRunner {
  constructor(options = {}) {
    this.failFast = options.failFast ?? true
    this.minCoverage = options.minCoverage || 80
  }

  /**
   * Ejecuta el pipeline completo de forma asíncrona simulada.
   *
   * @param {string} sourceCode - Código a evaluar
   * @param {Object} [meta] - Metadatos del commit / branch
   * @returns {Promise<Object>} Resultado global y detalles por etapa
   */
  async executePipeline(sourceCode, meta = {}) {
    const logs = []
    const log = (stage, level, msg) => {
      logs.push({
        id: Math.random().toString(36).substr(2, 6),
        timestamp: new Date().toISOString().substring(11, 19),
        stage,
        level,
        msg,
      })
    }

    const stages = {
      checkout: { name: STAGE_NAMES.CHECKOUT, status: 'RUNNING', durationMs: 0 },
      sast: { name: STAGE_NAMES.SAST_SCAN, status: 'PENDING', durationMs: 0, findings: [] },
      testing: { name: STAGE_NAMES.TESTING, status: 'PENDING', durationMs: 0, coverage: 0 },
      sca: { name: STAGE_NAMES.SCA_AUDIT, status: 'PENDING', durationMs: 0, cveCount: 0 },
      deploy: { name: STAGE_NAMES.BUILD_DEPLOY, status: 'PENDING', durationMs: 0 },
    }

    const branch = meta.branch || 'main'
    const commitHash = meta.commitHash || 'a1b2c3d'

    log('INIT', 'INFO', `Iniciando Pipeline CI/CD en branch '${branch}' @ ${commitHash}`)

    // ── Etapa 1: Checkout & Linting ──
    const t1 = Date.now()
    log(STAGE_NAMES.CHECKOUT, 'INFO', 'Verificando sintaxis JavaScript y reglas de estilo...')
    if (!sourceCode.trim()) {
      stages.checkout.status = 'FAILED'
      stages.checkout.durationMs = Date.now() - t1
      log(STAGE_NAMES.CHECKOUT, 'ERROR', 'Fallo de compilación: Código fuente vacío o no válido.')
      return { status: PIPELINE_STATUS.FAILED, stages, logs, durationMs: Date.now() - t1 }
    }
    stages.checkout.status = 'PASSED'
    stages.checkout.durationMs = Date.now() - t1
    log(STAGE_NAMES.CHECKOUT, 'SUCCESS', 'Linting aprobado sin advertencias.')

    // ── Etapa 2: SAST Security Scan ──
    const t2 = Date.now()
    stages.sast.status = 'RUNNING'
    log(STAGE_NAMES.SAST_SCAN, 'INFO', 'Ejecutando motor SAST contra reglas OWASP / CWE...')

    const sastFindings = runSastScan(sourceCode)
    stages.sast.findings = sastFindings
    stages.sast.durationMs = Date.now() - t2

    const hasCriticalSast = sastFindings.some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')

    if (hasCriticalSast) {
      stages.sast.status = 'FAILED'
      sastFindings.forEach((f) => {
        log(STAGE_NAMES.SAST_SCAN, 'ERROR', `[${f.severity}] L${f.line}: ${f.name} (${f.cwe}) - ${f.snippet}`)
      })
      log(STAGE_NAMES.SAST_SCAN, 'ERROR', 'Puerta de seguridad DevSecOps BLOQUEADA: Se encontraron vulnerabilidades críticas.')

      if (this.failFast) {
        stages.testing.status = 'SKIPPED'
        stages.sca.status = 'SKIPPED'
        stages.deploy.status = 'SKIPPED'
        return { status: PIPELINE_STATUS.FAILED, stages, logs, durationMs: Date.now() - t1 }
      }
    } else {
      stages.sast.status = 'PASSED'
      log(STAGE_NAMES.SAST_SCAN, 'SUCCESS', 'SAST Clean: 0 vulnerabilidades detectadas en código estático.')
    }

    // ── Etapa 3: Testing & Coverage ──
    const t3 = Date.now()
    stages.testing.status = 'RUNNING'
    log(STAGE_NAMES.TESTING, 'INFO', 'Ejecutando suite de pruebas unitarias...')
    const calculatedCoverage = Math.min(100, Math.max(65, 95 - (sourceCode.length % 20)))
    stages.testing.coverage = calculatedCoverage
    stages.testing.durationMs = Date.now() - t3

    if (calculatedCoverage < this.minCoverage) {
      stages.testing.status = 'FAILED'
      log(STAGE_NAMES.TESTING, 'ERROR', `Cobertura insuficiente: ${calculatedCoverage}% (Mínimo requerido: ${this.minCoverage}%)`)
      if (this.failFast) {
        stages.sca.status = 'SKIPPED'
        stages.deploy.status = 'SKIPPED'
        return { status: PIPELINE_STATUS.FAILED, stages, logs, durationMs: Date.now() - t1 }
      }
    } else {
      stages.testing.status = 'PASSED'
      log(STAGE_NAMES.TESTING, 'SUCCESS', `Tests unitarios OK (Cobertura alcanzada: ${calculatedCoverage}%)`)
    }

    // ── Etapa 4: SCA Audit ──
    const t4 = Date.now()
    stages.sca.status = 'RUNNING'
    log(STAGE_NAMES.SCA_AUDIT, 'INFO', 'Verificando árbol de dependencias npm contra la base de datos de CVEs...')
    stages.sca.status = 'PASSED'
    stages.sca.durationMs = Date.now() - t4
    log(STAGE_NAMES.SCA_AUDIT, 'SUCCESS', 'SCA Audit: 0 paquetes vulnerables encontrados en lockfile.')

    // ── Etapa 5: Build & Production Deploy ──
    const t5 = Date.now()
    stages.deploy.status = 'RUNNING'
    log(STAGE_NAMES.BUILD_DEPLOY, 'INFO', 'Generando artefacto optimizado con Vite Rollup...')
    stages.deploy.status = 'PASSED'
    stages.deploy.durationMs = Date.now() - t5
    log(STAGE_NAMES.BUILD_DEPLOY, 'SUCCESS', '🚀 Despliegue completado exitosamente en ambiente de producción.')

    const totalDuration = Date.now() - t1
    return {
      status: PIPELINE_STATUS.PASSED,
      stages,
      logs,
      durationMs: totalDuration,
    }
  }
}
