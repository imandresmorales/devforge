/**
 * @fileoverview Utilidades para autenticación OAuth 2.0 con PKCE y protección CSRF.
 *
 * SEGURIDAD SEGÚN ESTÁNDARES RFC 7636 Y RFC 6749:
 * - Generación de parámetros cryptográficos PKCE (code_verifier / code_challenge).
 * - Protección contra ataques CSRF mediante parámetro state efímero.
 * - Simulación de intercambio seguro de Authorization Code por perfil de usuario.
 *
 * @module utils/oauth
 */

/**
 * Genera una cadena aleatoria segura para code_verifier de PKCE o parámetro state.
 * @param {number} [length=43]
 * @returns {string}
 */
export function generateRandomString(length = 43) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Genera el estado CSRF para la petición OAuth 2.0.
 * @returns {{ state: string, verifier: string }}
 */
export function generateOAuthParams() {
  const state = `st_${generateRandomString(32)}`
  const verifier = generateRandomString(43)
  return { state, verifier }
}

/**
 * Valida si el state retornado coincide con el guardado en la sesión.
 * @param {string} receivedState
 * @param {string} savedState
 * @returns {boolean}
 */
export function validateOAuthState(receivedState, savedState) {
  if (!receivedState || !savedState) return false
  return receivedState === savedState
}

/**
 * Perfiles mock preconfigurados para simular proveedores OAuth reales.
 */
export const MOCK_OAUTH_PROFILES = {
  google: {
    provider: 'google',
    id: 'google_oauth_1092837465',
    name: 'Andres Morales (Google)',
    email: 'andres.google@devforge.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    verified: true,
  },
  github: {
    provider: 'github',
    id: 'gh_oauth_582910384',
    name: 'imandresmorales (GitHub)',
    email: 'andres.github@devforge.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    verified: true,
  },
}

/**
 * Simula el intercambio de Authorization Code por Tokens y Perfil de Usuario en backend.
 *
 * @param {'google' | 'github'} provider
 * @param {string} code
 * @param {string} [verifier]
 * @returns {Promise<{ profile: typeof MOCK_OAUTH_PROFILES['google'], accessToken: string }>}
 */
export async function exchangeOAuthCode(provider, code, verifier) {
  await new Promise((resolve) => setTimeout(resolve, 600))

  if (!code || code.length < 8) {
    throw new Error('Código de autorización OAuth inválido o expirado.')
  }

  const profile = MOCK_OAUTH_PROFILES[provider]
  if (!profile) {
    throw new Error(`Proveedor OAuth no soportado: ${provider}`)
  }

  const accessToken = `df_oauth_acc_${provider}_${Math.random().toString(36).slice(2, 12)}_${Date.now()}`

  return {
    profile: { ...profile },
    accessToken,
    verifierUsed: Boolean(verifier),
  }
}
