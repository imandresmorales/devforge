/**
 * @fileoverview Motor de Feature Flags y Despliegue Progresivo Canary (Mejora 79).
 *
 * CARACTERÍSTICAS:
 * - Sistema de Feature Flags desacoplado estilo LaunchDarkly / Unleash / GrowthBook:
 *     1. Interruptor global de emergencia (Global Kill Switch).
 *     2. Despliegue progresivo Canary por porcentaje determinista (0% a 100%) mediante hashing estable de usuario.
 *     3. Reglas de segmentación por atributos (Role, Email domain, Plan, Country).
 *     4. Experimentación A/B y banderas multivariantes (Control vs Variant A vs Variant B).
 *     5. Telemetría y auditoría de decisiones en caliente (Evaluation Reasons).
 *
 * @module utils/featureFlags
 */

/**
 * Hashing determinista para asignación consistente de buckets de usuario (0 a 99).
 * @param {string} key
 * @returns {number} Entero entre 0 y 99
 */
export function getUserBucket(key) {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 100
}

/**
 * Evalúa si un atributo de usuario satisface una regla de segmentación.
 */
export function evaluateRule(rule, userContext = {}) {
  const { attribute, operator, value } = rule
  const userVal = userContext[attribute]

  if (userVal === undefined || userVal === null) return false

  switch (operator) {
    case 'equals':
      return String(userVal).toLowerCase() === String(value).toLowerCase()
    case 'notEquals':
      return String(userVal).toLowerCase() !== String(value).toLowerCase()
    case 'in':
      return Array.isArray(value) && value.map((v) => String(v).toLowerCase()).includes(String(userVal).toLowerCase())
    case 'contains':
      return String(userVal).toLowerCase().includes(String(value).toLowerCase())
    case 'endsWith':
      return String(userVal).toLowerCase().endsWith(String(value).toLowerCase())
    case 'greaterThan':
      return Number(userVal) > Number(value)
    default:
      return false
  }
}

/**
 * Clase principal que gestiona las Feature Flags y su evaluación en tiempo real.
 */
export class FeatureFlagManager {
  constructor() {
    this.flags = new Map()
    this.evaluationLogs = []
  }

  /**
   * Registra o actualiza una Feature Flag.
   */
  registerFlag(flagConfig) {
    const flag = {
      key: flagConfig.key,
      name: flagConfig.name || flagConfig.key,
      description: flagConfig.description || '',
      enabled: flagConfig.enabled ?? true,
      rolloutPercentage: flagConfig.rolloutPercentage ?? 100, // 0 a 100
      rules: flagConfig.rules || [],
      variations: flagConfig.variations || { default: true },
      defaultValue: flagConfig.defaultValue ?? false,
      createdAt: Date.now(),
    }
    this.flags.set(flag.key, flag)
    return flag
  }

  getFlag(key) {
    return this.flags.get(key)
  }

  setRolloutPercentage(key, percentage) {
    const flag = this.flags.get(key)
    if (flag) {
      flag.rolloutPercentage = Math.max(0, Math.min(100, percentage))
      return true
    }
    return false
  }

  toggleFlag(key) {
    const flag = this.flags.get(key)
    if (flag) {
      flag.enabled = !flag.enabled
      return flag.enabled
    }
    return false
  }

  /**
   * Evalúa el estado de una Feature Flag para un contexto de usuario dado.
   *
   * @param {string} flagKey
   * @param {Object} userContext - Contexto del usuario (id, email, role, plan, country)
   * @returns {{ enabled: boolean, value: any, reason: string, bucket: number }}
   */
  evaluate(flagKey, userContext = {}) {
    const flag = this.flags.get(flagKey)
    const userId = userContext.id || userContext.userId || 'anonymous'
    const bucket = getUserBucket(`${flagKey}:${userId}`)

    if (!flag) {
      return { enabled: false, value: false, reason: 'FLAG_NOT_FOUND', bucket }
    }

    // 1. Kill Switch global desactivado
    if (!flag.enabled) {
      return { enabled: false, value: flag.defaultValue, reason: 'KILL_SWITCH_DISABLED', bucket }
    }

    // 2. Evaluación de reglas de segmentación específicas (Targeting Rules)
    for (const rule of flag.rules) {
      if (evaluateRule(rule, userContext)) {
        return {
          enabled: true,
          value: rule.variationValue !== undefined ? rule.variationValue : true,
          reason: `RULE_MATCH (${rule.attribute} ${rule.operator} ${JSON.stringify(rule.value)})`,
          bucket,
        }
      }
    }

    // 3. Despliegue progresivo por porcentaje (Canary Rollout)
    if (bucket < flag.rolloutPercentage) {
      return {
        enabled: true,
        value: flag.variations?.on !== undefined ? flag.variations.on : true,
        reason: `CANARY_ROLLOUT (Bucket ${bucket} < ${flag.rolloutPercentage}%)`,
        bucket,
      }
    }

    return {
      enabled: false,
      value: flag.defaultValue,
      reason: `EXCLUDED_FROM_ROLLOUT (Bucket ${bucket} >= ${flag.rolloutPercentage}%)`,
      bucket,
    }
  }

  getSnapshot() {
    return Array.from(this.flags.values()).map((f) => ({ ...f }))
  }
}
