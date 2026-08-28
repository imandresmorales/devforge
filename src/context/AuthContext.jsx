/**
 * @fileoverview AuthContext — sistema de autenticación con JWT simulado.
 *
 * PATRÓN APLICADO:
 * - Access token en memoria (variable de módulo, nunca en estado React ni localStorage)
 *   → Protege contra ataques XSS: un script malicioso no puede leer el token
 * - Refresh token en localStorage (persiste entre recargas, solo para re-emitir access token)
 * - Context + useReducer para estado predecible y trazable
 * - Separado de UserContext: AuthContext maneja credenciales, UserContext maneja datos de perfil
 *
 * SEGURIDAD:
 * - Los tokens NUNCA se almacenan en el estado de React
 * - El access token expira en 15 minutos (TTL configurable)
 * - Sanitización de email con regex antes de comparar
 * - Contraseña nunca se almacena, solo se valida en el momento
 *
 * NOTA EDUCATIVA:
 * En producción, el backend emite tokens JWT reales firmados con una clave secreta.
 * Aquí simulamos ese flujo en el frontend para demostrar los patrones correctos.
 *
 * @module context/AuthContext
 */
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { sanitizeInput } from '../utils/security'

/* ─── Constantes de configuración ──────────────────────────── */

/** TTL del access token en ms (15 minutos) */
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000

/** Clave del refresh token en localStorage */
const REFRESH_TOKEN_KEY = 'df_refresh_token'

/**
 * Access token en memoria (no en React state ni localStorage).
 * Variable de módulo: persiste durante la sesión del tab pero no es accesible
 * desde fuera del módulo por scripts maliciosos.
 * @type {{ token: string | null, expiresAt: number | null }}
 */
const inMemoryToken = { token: null, expiresAt: null }

/* ─── Helpers de token ──────────────────────────────────────── */

/**
 * Genera un JWT simulado en base64 con payload básico.
 * En producción: el backend genera un JWT firmado con RS256 o HS256.
 *
 * @param {{ id: string, email: string, role: string }} payload
 * @param {number} ttlMs - Tiempo de vida en ms
 * @returns {string} Token JWT simulado
 */
function generateSimulatedJWT(payload, ttlMs) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const claims = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + ttlMs) / 1000),
  }
  // Simulamos la estructura JWT: header.payload.signature (sin firma real)
  const encode = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '')
  return `${encode(header)}.${encode(claims)}.simulated_sig`
}

/**
 * Decodifica el payload de un JWT simulado.
 * @param {string} token
 * @returns {Record<string, unknown> | null}
 */
function decodeJWTPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(atob(parts[1]))
  } catch {
    return null
  }
}

/**
 * Verifica si el access token en memoria es válido (existe y no ha expirado).
 * @returns {boolean}
 */
function isAccessTokenValid() {
  if (!inMemoryToken.token || !inMemoryToken.expiresAt) return false
  return Date.now() < inMemoryToken.expiresAt
}

/**
 * Almacena el access token en la variable de módulo (en memoria).
 * @param {string} token
 */
function setAccessToken(token) {
  inMemoryToken.token = token
  inMemoryToken.expiresAt = Date.now() + ACCESS_TOKEN_TTL_MS
}

/** Limpia el access token de memoria */
function clearAccessToken() {
  inMemoryToken.token = null
  inMemoryToken.expiresAt = null
}

/* ─── Acciones del reducer ──────────────────────────────────── */

/** @enum {string} */
export const AUTH_ACTIONS = Object.freeze({
  LOGIN:       'AUTH/LOGIN',
  LOGOUT:      'AUTH/LOGOUT',
  SET_LOADING: 'AUTH/SET_LOADING',
  SET_ERROR:   'AUTH/SET_ERROR',
})

/* ─── Estado inicial ────────────────────────────────────────── */

/**
 * @typedef {Object} AuthState
 * @property {{ id: string, email: string, name: string, role: string } | null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {string | null} error
 */

/** @type {AuthState} */
const INITIAL_STATE = {
  user:            null,
  isAuthenticated: false,
  isLoading:       true,   // true inicial para restaurar sesión sin flash de login
  error:           null,
}

/* ─── Reducer puro ──────────────────────────────────────────── */

/**
 * @param {AuthState} state
 * @param {{ type: string, payload?: unknown }} action
 * @returns {AuthState}
 */
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN:
      return {
        ...state,
        user:            action.payload,
        isAuthenticated: true,
        isLoading:       false,
        error:           null,
      }
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...INITIAL_STATE,
        isLoading: false,
      }
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload }
    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false }
    default:
      if (import.meta.env.DEV) {
        console.warn(`[AuthContext] Acción desconocida: ${action.type}`)
      }
      return state
  }
}

/* ─── Context ───────────────────────────────────────────────── */

const AuthContext = createContext(null)

/* ─── Usuarios de demostración (simula BD) ──────────────────── */

/**
 * En producción, la BD del backend valida credenciales.
 * Aquí simulamos ese proceso en el frontend.
 *
 * NUNCA hardcodear contraseñas en producción. Esto es solo para demo.
 */
const DEMO_USERS = [
  {
    id:       'usr_001',
    email:    'andres@devforge.com',
    password: 'DevForge2026!',   // En prod: hash bcrypt almacenado en BD
    name:     'Andres Morales',
    role:     'admin',
  },
  {
    id:       'usr_002',
    email:    'demo@devforge.com',
    password: 'Demo1234!',
    name:     'Usuario Demo',
    role:     'user',
  },
]

/* ─── Provider ──────────────────────────────────────────────── */

/**
 * Proveedor del contexto de autenticación.
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, INITIAL_STATE)

  /**
   * Efecto de inicialización: intenta restaurar la sesión desde el refresh token.
   * Simula el comportamiento de un backend que valida el refresh token.
   */
  useEffect(() => {
    async function restoreSession() {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

      if (!storedRefreshToken) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        return
      }

      try {
        // Decodificar el refresh token para obtener los datos del usuario
        const payload = decodeJWTPayload(storedRefreshToken)
        if (!payload || !payload.id) throw new Error('Refresh token inválido')

        // En producción: POST /auth/refresh con el refresh token
        // Aquí simulamos la respuesta del backend
        const userData = DEMO_USERS.find((u) => u.id === payload.id)
        if (!userData) throw new Error('Usuario no encontrado')

        // Emitir nuevo access token en memoria
        const newAccessToken = generateSimulatedJWT(
          { id: userData.id, email: userData.email, role: userData.role },
          ACCESS_TOKEN_TTL_MS
        )
        setAccessToken(newAccessToken)

        dispatch({
          type:    AUTH_ACTIONS.LOGIN,
          payload: { id: userData.id, email: userData.email, name: userData.name, role: userData.role },
        })
      } catch {
        // Refresh token inválido o expirado: limpiar y mostrar login
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        clearAccessToken()
        dispatch({ type: AUTH_ACTIONS.LOGOUT })
      }
    }

    restoreSession()
  }, [])

  /**
   * Inicia sesión con email y contraseña.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>}
   * @throws Si las credenciales son inválidas
   */
  const login = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
    dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: null })

    try {
      // Sanitizar email (no la contraseña: sanitizar la contraseña modificaría caracteres especiales válidos)
      const cleanEmail = sanitizeInput(email).toLowerCase()

      // Simular latencia de red (100–300ms)
      await new Promise((r) => setTimeout(r, 600))

      // En producción: POST /auth/login { email, password }
      const user = DEMO_USERS.find(
        (u) => u.email === cleanEmail && u.password === password
      )

      if (!user) {
        // Mensaje genérico: no revelar si el email existe o no (seguridad)
        throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.')
      }

      // Generar tokens
      const accessToken = generateSimulatedJWT(
        { id: user.id, email: user.email, role: user.role },
        ACCESS_TOKEN_TTL_MS
      )
      const refreshToken = generateSimulatedJWT(
        { id: user.id },
        7 * 24 * 60 * 60 * 1000 // 7 días
      )

      // Access token → solo en memoria
      setAccessToken(accessToken)

      // Refresh token → localStorage (httpOnly cookie en producción real)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)

      dispatch({
        type:    AUTH_ACTIONS.LOGIN,
        payload: { id: user.id, email: user.email, name: user.name, role: user.role },
      })
    } catch (err) {
      clearAccessToken()
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: err.message })
      throw err
    }
  }, [])

  /**
   * Registra un nuevo usuario.
   * @param {{ name: string, email: string, password: string }} data
   * @returns {Promise<void>}
   */
  const register = useCallback(async ({ name, email, password }) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
    dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: null })

    try {
      const cleanEmail = sanitizeInput(email).toLowerCase()
      const cleanName  = sanitizeInput(name)

      await new Promise((r) => setTimeout(r, 800))

      // Verificar si el email ya existe
      const exists = DEMO_USERS.some((u) => u.email === cleanEmail)
      if (exists) {
        throw new Error('Este email ya está registrado. Intenta iniciar sesión.')
      }

      // En producción: POST /auth/register → backend hashea la contraseña con bcrypt
      const newUser = {
        id:    `usr_${Date.now()}`,
        email: cleanEmail,
        name:  cleanName,
        role:  'user',
      }

      const accessToken = generateSimulatedJWT(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        ACCESS_TOKEN_TTL_MS
      )
      const refreshToken = generateSimulatedJWT(
        { id: newUser.id },
        7 * 24 * 60 * 60 * 1000
      )

      setAccessToken(accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)

      dispatch({ type: AUTH_ACTIONS.LOGIN, payload: newUser })
    } catch (err) {
      clearAccessToken()
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: err.message })
      throw err
    }
  }, [])

  /**
   * Inicia sesión o registra al usuario mediante un proveedor OAuth 2.0 (Google / GitHub).
   * @param {{ id: string, name: string, email: string, provider: string, avatar?: string }} profile
   * @param {string} [customToken]
   */
  const loginWithOAuth = useCallback((profile, customToken) => {
    const accessToken = customToken || generateSimulatedJWT(
      { id: profile.id, email: profile.email, role: 'user', provider: profile.provider },
      ACCESS_TOKEN_TTL_MS
    )
    const refreshToken = generateSimulatedJWT(
      { id: profile.id },
      7 * 24 * 60 * 60 * 1000
    )

    setAccessToken(accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)

    const oauthUser = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar || null,
      provider: profile.provider,
      role: 'user',
      linkedAccounts: { [profile.provider]: true },
    }

    dispatch({ type: AUTH_ACTIONS.LOGIN, payload: oauthUser })
  }, [])

  /**
   * Cierra la sesión del usuario.
   * Limpia todos los tokens y el estado.
   */
  const logout = useCallback(() => {
    clearAccessToken()
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    dispatch({ type: AUTH_ACTIONS.LOGOUT })
  }, [])

  /**
   * Retorna el access token actual si es válido.
   * Usar en interceptores de requests autenticados.
   * @returns {string | null}
   */
  const getAccessToken = useCallback(() => {
    return isAccessTokenValid() ? inMemoryToken.token : null
  }, [])

  const value = {
    // Estado
    user:            state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading:       state.isLoading,
    error:           state.error,
    // Acciones
    login,
    register,
    loginWithOAuth,
    logout,
    getAccessToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/* ─── Hook de consumo ───────────────────────────────────────── */

/**
 * Hook para acceder al contexto de autenticación.
 * @throws {Error} Si se usa fuera del AuthProvider
 * @returns {{ user: object|null, isAuthenticated: boolean, isLoading: boolean, error: string|null, login: Function, register: Function, logout: Function, getAccessToken: Function }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error(
      '[useAuth] Debes usar este hook dentro de <AuthProvider>. ' +
      'Envuelve tu árbol de componentes con <AuthProvider> en main.jsx.'
    )
  }
  return ctx
}

export default AuthContext
