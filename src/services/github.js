/**
 * @fileoverview Servicio de GitHub REST API (v3).
 *
 * PATRÓN APLICADO:
 * - Funciones puras sin estado: fáciles de testear y reutilizar
 * - BASE_URL como constante: un único punto de cambio
 * - Rate limit awareness: parseamos los headers X-RateLimit-* y los retornamos
 *   para que la UI pueda informar al usuario si se acerca al límite
 * - Sin autenticación: la API pública de GitHub permite 60 req/hora sin token.
 *   Con VITE_GITHUB_TOKEN (si se define) mejora a 5000 req/hora.
 * - Errores tipados: diferenciamos entre rate limit, no encontrado y error genérico
 *
 * SEGURIDAD:
 * - El token GitHub NUNCA se hardcodea. Se lee de la variable de entorno VITE_GITHUB_TOKEN.
 * - VITE_ prefix en Vite: la variable es pública (no usar para tokens de alta sensibilidad).
 *   En producción real, usar un backend proxy para proteger el token.
 *
 * @module services/github
 */

/** Endpoint base de la GitHub REST API v3 */
const GITHUB_API = 'https://api.github.com'

/**
 * Construye los headers para la petición.
 * Si existe VITE_GITHUB_TOKEN en el entorno, lo incluye para aumentar el rate limit.
 * @returns {HeadersInit}
 */
function buildHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  }
  const token = import.meta.env.VITE_GITHUB_TOKEN
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/**
 * Parsea los headers de rate limit de la respuesta de GitHub.
 * @param {Response} response
 * @returns {{ limit: number, remaining: number, reset: Date }}
 */
function parseRateLimit(response) {
  return {
    limit:     parseInt(response.headers.get('X-RateLimit-Limit') || '60', 10),
    remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '60', 10),
    reset:     new Date(parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10) * 1000),
  }
}

/**
 * Wrapper fetch para la GitHub API con manejo de errores uniforme.
 * @param {string} path   - Path relativo al GITHUB_API (ej: '/repos/owner/repo')
 * @param {AbortSignal} [signal] - Señal de AbortController para cancelación
 * @returns {Promise<{ data: unknown, rateLimit: object }>}
 * @throws {{ message: string, status: number, isRateLimit: boolean }}
 */
async function githubFetch(path, signal) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: buildHeaders(),
    signal,
  })

  const rateLimit = parseRateLimit(response)

  if (!response.ok) {
    const isRateLimit = response.status === 403 || response.status === 429
    const body = await response.json().catch(() => ({}))
    throw Object.assign(
      new Error(
        isRateLimit
          ? `Rate limit de GitHub alcanzado. Se restablece a las ${rateLimit.reset.toLocaleTimeString()}.`
          : body.message || `Error ${response.status}: ${response.statusText}`
      ),
      { status: response.status, isRateLimit, rateLimit }
    )
  }

  const data = await response.json()
  return { data, rateLimit }
}

/* ─── Funciones del servicio ────────────────────────────────── */

/**
 * Obtiene información general de un repositorio.
 * Endpoint: GET /repos/{owner}/{repo}
 *
 * @param {string} owner  - Propietario del repositorio (ej: 'imandresmorales')
 * @param {string} repo   - Nombre del repositorio (ej: 'devforge')
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ data: GithubRepo, rateLimit: object }>}
 */
export async function fetchRepoInfo(owner, repo, signal) {
  return githubFetch(`/repos/${owner}/${repo}`, signal)
}

/**
 * Obtiene los últimos commits de un repositorio.
 * Endpoint: GET /repos/{owner}/{repo}/commits
 *
 * @param {string} owner
 * @param {string} repo
 * @param {number} [perPage=10] - Número de commits a traer (máx 100)
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ data: GithubCommit[], rateLimit: object }>}
 */
export async function fetchRepoCommits(owner, repo, perPage = 10, signal) {
  return githubFetch(
    `/repos/${owner}/${repo}/commits?per_page=${Math.min(perPage, 100)}`,
    signal
  )
}

/**
 * Obtiene los lenguajes de programación usados en el repositorio.
 * Endpoint: GET /repos/{owner}/{repo}/languages
 *
 * @param {string} owner
 * @param {string} repo
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ data: Record<string, number>, rateLimit: object }>}
 */
export async function fetchRepoLanguages(owner, repo, signal) {
  return githubFetch(`/repos/${owner}/${repo}/languages`, signal)
}
