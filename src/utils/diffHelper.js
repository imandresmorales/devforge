/**
 * @fileoverview Motor de cálculo y formateo de diferencias de código (Diff Engine) con algoritmo LCS (Mejora 50).
 *
 * CARACTERÍSTICAS:
 * - Algoritmo de subsecuencia común más larga (LCS) línea por línea.
 * - Clasificación estricta de líneas: added (+), removed (-), unchanged ( ).
 * - Modos de renderizado Unified Diff y Side-by-Side.
 * - Estadísticas de agregaciones, eliminaciones y balance de cambios.
 *
 * @module utils/diffHelper
 */

/**
 * Plantillas predefinidas de diferencias de código.
 */
export const DIFF_PRESETS = [
  {
    id: 'auth_refactor',
    name: '🔐 Refactorización de Auth JWT',
    oldCode: `function handleLogin(email, password) {
  // Autenticación básica sin hash
  if (email === "admin@devforge.io" && password === "123456") {
    return { token: "basic_token_123" }
  }
  throw new Error("Credenciales inválidas")
}`,
    newCode: `async function handleLogin(email, password) {
  // Autenticación segura con Argon2 y JWT firmado con HMAC
  const user = await userRepository.findByEmail(sanitizeInput(email))
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    throw new SecurityError("Credenciales inválidas o cuenta bloqueada")
  }
  return generateAuthTokens(user.id, user.role)
}`,
  },
  {
    id: 'circuit_breaker',
    name: '🛡️ Circuit Breaker Integration',
    oldCode: `async function fetchUserData(userId) {
  const res = await fetch(\`https://api.internal/users/\${userId}\`)
  return res.json()
}`,
    newCode: `async function fetchUserData(userId) {
  return circuitBreaker.execute(
    async () => {
      const res = await fetch(\`https://api.internal/users/\${userId}\`)
      return res.json()
    },
    (err) => getCachedUserProfile(userId)
  )
}`,
  },
]

/**
 * Calcula la matriz LCS entre dos arreglos de líneas.
 * @param {string[]} linesA
 * @param {string[]} linesB
 * @returns {number[][]}
 */
function computeLCSMatrix(linesA, linesB) {
  const m = linesA.length
  const n = linesB.length
  const matrix = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (linesA[i] === linesB[j]) {
        matrix[i + 1][j + 1] = matrix[i][j] + 1
      } else {
        matrix[i + 1][j + 1] = Math.max(matrix[i + 1][j], matrix[i][j + 1])
      }
    }
  }

  return matrix
}

/**
 * Calcula las diferencias línea por línea entre dos fragmentos de texto.
 *
 * @param {string} oldText - Código o texto original
 * @param {string} newText - Código o texto modificado
 * @returns {{ diffLines: Array<{ type: 'added'|'removed'|'unchanged', oldLineNum: number|null, newLineNum: number|null, text: string }>, additions: number, deletions: number }}
 */
export function computeLineDiff(oldText = '', newText = '') {
  const linesA = oldText.split('\n')
  const linesB = newText.split('\n')

  const matrix = computeLCSMatrix(linesA, linesB)
  const diffLines = []

  let i = linesA.length
  let j = linesB.length
  let additions = 0
  let deletions = 0

  const backtrack = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      backtrack.push({
        type: 'unchanged',
        oldLineNum: i,
        newLineNum: j,
        text: linesA[i - 1],
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      backtrack.push({
        type: 'added',
        oldLineNum: null,
        newLineNum: j,
        text: linesB[j - 1],
      })
      additions++
      j--
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      backtrack.push({
        type: 'removed',
        oldLineNum: i,
        newLineNum: null,
        text: linesA[i - 1],
      })
      deletions++
      i--
    }
  }

  backtrack.reverse()

  return {
    diffLines: backtrack,
    additions,
    deletions,
  }
}
