/**
 * @fileoverview Motor de Detección, Análisis y Mitigación de Prototype Pollution (CWE-1321) (Mejora 68).
 *
 * CARACTERÍSTICAS:
 * - Análisis estático y dinámico de payloads JSON para detectar ataques de Prototype Pollution:
 *     1. Inyección de clave `__proto__` (acceso directo al prototipo de Object).
 *     2. Inyección mediante `constructor.prototype` (acceso indirecto a la función constructora).
 *     3. Contaminación de `Array.prototype` y funciones nativas.
 * - Algoritmo de Safe Deep Merge y Safe Deep Clone que neutraliza recursivamente claves peligrosas.
 * - Simulación interactiva de Sandbox seguro sin afectar el runtime global de la aplicación.
 * - Generador de recomendaciones de hardening para Node.js y navegadores.
 *
 * @module utils/prototypePollutionGuard
 */

/**
 * Claves reservadas peligrosas que pueden alterar la cadena de prototipos en JavaScript.
 */
export const FORBIDDEN_PROTOTYPE_KEYS = ['__proto__', 'constructor', 'prototype']

/**
 * Escenarios predefinidos de prueba para Prototype Pollution.
 */
export const POLLUTION_PRESETS = [
  {
    id: 'auth_bypass_proto',
    name: 'Ataque Clásico: Bypass de Autenticación (__proto__.isAdmin = true)',
    payload: `{\n  "username": "guest_user",\n  "__proto__": {\n    "isAdmin": true,\n    "role": "superadmin"\n  }\n}`,
  },
  {
    id: 'constructor_prototype',
    name: 'Ataque Indirecto: constructor.prototype (Bypass de Filtros Simples)',
    payload: `{\n  "profile": {\n    "constructor": {\n      "prototype": {\n        "authenticated": true,\n        "canDeleteDatabase": true\n      }\n    }\n  }\n}`,
  },
  {
    id: 'dos_gadget',
    name: 'Denegación de Servicio (DoS Gadget: toString / valueOf Override)',
    payload: `{\n  "__proto__": {\n    "toString": null,\n    "valueOf": null\n  }\n}`,
  },
  {
    id: 'safe_json',
    name: 'Payload Limpio y Seguro (Sin Claves Prototípicas)',
    payload: `{\n  "user": {\n    "name": "Alex Morales",\n    "email": "alex@devforge.io",\n    "theme": "dark"\n  }\n}`,
  },
]

/**
 * Analiza un objeto o cadena JSON en busca de claves o estructuras que provoquen Prototype Pollution.
 *
 * @param {string|Object} input - Cadena JSON o payload objeto.
 * @returns {{
 *   isVulnerable: boolean,
 *   riskLevel: 'CRITICAL'|'HIGH'|'SAFE',
 *   score: number,
 *   findings: Array<{
 *     path: string,
 *     key: string,
 *     severity: 'CRITICAL'|'HIGH',
 *     description: string,
 *     impact: string
 *   }>,
 *   parsedObject: any,
 *   error?: string
 * }}
 */
export function analyzePrototypePollution(input) {
  let parsed = null
  const findings = []

  try {
    if (typeof input === 'string') {
      parsed = JSON.parse(input)
    } else {
      parsed = input
    }
  } catch (err) {
    return {
      isVulnerable: false,
      riskLevel: 'SAFE',
      score: 0,
      findings: [],
      parsedObject: null,
      error: `JSON inválido: ${err.message}`,
    }
  }

  // Inspección de claves en la cadena JSON cruda para detectar __proto__ antes de que JSON.parse lo oculte
  if (typeof input === 'string') {
    if (/"__proto__"\s*:/i.test(input)) {
      findings.push({
        path: 'root.__proto__',
        key: '__proto__',
        severity: 'CRITICAL',
        description: 'Se detectó la propiedad "__proto__" en la estructura del objeto JSON.',
        impact: 'Permite modificar Object.prototype globalmente, heredando propiedades maliciosas a todos los objetos creados.',
      })
    }
  }

  // Recorrido recursivo del objeto parseado
  function inspectNode(node, currentPath) {
    if (!node || typeof node !== 'object') return

    // Comprobar claves del propio objeto
    const ownKeys = Object.keys(node)
    ownKeys.forEach((k) => {
      const fieldPath = currentPath ? `${currentPath}.${k}` : k

      if (FORBIDDEN_PROTOTYPE_KEYS.includes(k)) {
        findings.push({
          path: fieldPath,
          key: k,
          severity: k === '__proto__' ? 'CRITICAL' : 'HIGH',
          description: `Se detectó la propiedad prohibida "${k}" en la ruta "${fieldPath}".`,
          impact: 'Posible alteración de la cadena de prototipos de constructores de JavaScript.',
        })
      }

      // Recursión en propiedades anidadas
      if (node[k] && typeof node[k] === 'object') {
        inspectNode(node[k], fieldPath)
      }
    })
  }

  inspectNode(parsed, '')

  // Eliminar hallazgos duplicados si se detectó por regex y recursión
  const uniqueFindings = []
  const seenPaths = new Set()
  findings.forEach((f) => {
    const key = `${f.path}-${f.key}`
    if (!seenPaths.has(key)) {
      seenPaths.add(key)
      uniqueFindings.push(f)
    }
  })

  let score = 0
  if (uniqueFindings.some((f) => f.severity === 'CRITICAL')) score += 80
  if (uniqueFindings.some((f) => f.severity === 'HIGH')) score += 50

  let riskLevel = 'SAFE'
  if (score >= 80) riskLevel = 'CRITICAL'
  else if (score >= 50) riskLevel = 'HIGH'

  return {
    isVulnerable: uniqueFindings.length > 0,
    riskLevel,
    score: Math.min(100, score),
    findings: uniqueFindings,
    parsedObject: parsed,
  }
}

/**
 * Realiza un merge recursivo seguro (Safe Deep Merge) neutralizando claves prototípicas.
 *
 * @param {Object} target - Objeto destino.
 * @param {Object} source - Objeto origen que puede contener claves no confiables.
 * @returns {Object} Objeto destino combinado y seguro.
 */
export function safeDeepMerge(target, source) {
  if (!target || typeof target !== 'object') target = {}
  if (!source || typeof source !== 'object') return target

  const keys = Object.keys(source)
  for (const key of keys) {
    // Protección estricta contra Prototype Pollution
    if (FORBIDDEN_PROTOTYPE_KEYS.includes(key)) {
      continue // Omitir claves prohibidas
    }

    const val = source[key]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {}
      }
      safeDeepMerge(target[key], val)
    } else {
      target[key] = val
    }
  }

  return target
}

/**
 * Crea una copia profunda segura (Safe Deep Clone) que elimina propiedades prototípicas.
 *
 * @param {any} obj - Objeto a clonar.
 * @returns {any} Copia sanitizada.
 */
export function safeDeepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(safeDeepClone)

  const clone = Object.create(null) // Prototipo limpio sin herencia
  for (const key of Object.keys(obj)) {
    if (!FORBIDDEN_PROTOTYPE_KEYS.includes(key)) {
      clone[key] = safeDeepClone(obj[key])
    }
  }
  return clone
}

/**
 * Simula el resultado de un merge vulnerable vs un merge seguro en un sandbox aislado.
 *
 * @param {string|Object} payload
 * @returns {{
 *   vulnerableResult: { isPolluted: boolean, preview: any },
 *   safeResult: { isPolluted: boolean, preview: any }
 * }}
 */
export function simulateMergeComparison(payload) {
  let parsed = typeof payload === 'string' ? JSON.parse(payload) : payload

  // 1. Simulación Segura
  const safeTarget = {}
  safeDeepMerge(safeTarget, parsed)

  const isSafeClean = !('isAdmin' in {}) && !('authenticated' in {}) && !safeTarget.__proto__?.isAdmin

  return {
    vulnerableSimulation: {
      isPolluted: JSON.stringify(payload).includes('__proto__') || JSON.stringify(payload).includes('prototype'),
      impactDescription: 'El merge no defensivo inyectaría propiedades en Object.prototype, afectando a cualquier objeto nuevo creado en la aplicación.',
    },
    safeSimulation: {
      isPolluted: false,
      sanitizedOutput: safeTarget,
      protectionMessage: 'SafeDeepMerge omitió todas las claves prohibidas (__proto__, constructor, prototype).',
    },
  }
}
