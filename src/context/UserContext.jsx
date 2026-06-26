/**
 * @fileoverview UserContext — estado global de usuario con Context API.
 *
 * PATRÓN APLICADO:
 * - Context + useReducer (no useState) para lógica de estado predecible
 * - Reducer puro: solo transforma estado, sin efectos secundarios
 * - Acciones tipadas como constantes (evita typos en strings)
 * - Hook personalizado useUser() que lanza error si se usa fuera del Provider
 * - Datos de sesión simulados (en Mejora 36 se reemplaza con Google OAuth real)
 *
 * SEGURIDAD:
 * - El token nunca se almacena en el estado de React (solo en localStorage/cookie)
 * - La sesión simulada no contiene datos reales de usuario
 *
 * @module context/UserContext
 */
import { createContext, useContext, useReducer, useCallback } from 'react'

/* ─── Tipos de acción ───────────────────────────────────────── */

/** @enum {string} Acciones disponibles del reducer */
export const USER_ACTIONS = Object.freeze({
  LOGIN:         'USER/LOGIN',
  LOGOUT:        'USER/LOGOUT',
  UPDATE_PROFILE:'USER/UPDATE_PROFILE',
  SET_LOADING:   'USER/SET_LOADING',
})

/* ─── Estado inicial ────────────────────────────────────────── */

/**
 * @typedef {Object} UserState
 * @property {Object|null} user       - Datos del usuario autenticado
 * @property {boolean}     isLoggedIn - true si hay sesión activa
 * @property {boolean}     isLoading  - true durante operaciones async
 */

/** @type {UserState} */
const INITIAL_STATE = {
  user:       null,
  isLoggedIn: false,
  isLoading:  false,
}

/* ─── Reducer puro ──────────────────────────────────────────── */

/**
 * Reducer del estado de usuario.
 * Puro: dado el mismo estado y acción, siempre devuelve el mismo resultado.
 *
 * @param {UserState} state
 * @param {{ type: string, payload?: unknown }} action
 * @returns {UserState}
 */
function userReducer(state, action) {
  switch (action.type) {
    case USER_ACTIONS.LOGIN:
      return {
        ...state,
        user:       action.payload,
        isLoggedIn: true,
        isLoading:  false,
      }

    case USER_ACTIONS.LOGOUT:
      return {
        ...INITIAL_STATE,
      }

    case USER_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: state.user
          ? { ...state.user, ...action.payload }
          : null,
      }

    case USER_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      }

    default:
      // En desarrollo: alerta sobre acciones desconocidas
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[UserContext] Acción desconocida: ${action.type}`)
      }
      return state
  }
}

/* ─── Context ───────────────────────────────────────────────── */

const UserContext = createContext(null)

/* ─── Provider ──────────────────────────────────────────────── */

/**
 * Datos de usuario simulados para demostración.
 * En la Mejora 36 (Google OAuth), se reemplaza con datos reales.
 */
const MOCK_USER = {
  id:        'usr_demo_001',
  name:      'Andres Morales',
  email:     'moralesandres@outlook.com',
  avatar:    null, // URL de avatar (Google OAuth lo proveerá)
  role:      'admin',
  plan:      'free', // 'free' | 'pro' | 'enterprise'
  createdAt: new Date('2025-06-25').toISOString(),
}

/**
 * Provider del contexto de usuario.
 * Envuelve los componentes que necesitan acceder al estado de sesión.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, INITIAL_STATE)

  /**
   * Simula el login de usuario.
   * En Mejora 36: será reemplazado por NextAuth signIn().
   */
  const login = useCallback(async () => {
    dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true })
    try {
      // Simulamos latencia de red
      await new Promise((r) => setTimeout(r, 800))
      dispatch({ type: USER_ACTIONS.LOGIN, payload: MOCK_USER })
    } catch (error) {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false })
      console.error('[UserContext] Error durante el login:', error)
    }
  }, [])

  /**
   * Cierra la sesión del usuario.
   */
  const logout = useCallback(() => {
    dispatch({ type: USER_ACTIONS.LOGOUT })
  }, [])

  /**
   * Actualiza campos del perfil del usuario.
   * @param {Partial<typeof MOCK_USER>} updates
   */
  const updateProfile = useCallback((updates) => {
    dispatch({ type: USER_ACTIONS.UPDATE_PROFILE, payload: updates })
  }, [])

  const value = {
    // Estado
    user:       state.user,
    isLoggedIn: state.isLoggedIn,
    isLoading:  state.isLoading,
    // Acciones
    login,
    logout,
    updateProfile,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

/* ─── Hook de consumo ───────────────────────────────────────── */

/**
 * Hook para consumir el contexto de usuario.
 * Lanza un error descriptivo si se usa fuera del UserProvider.
 *
 * @returns {{
 *   user: typeof MOCK_USER | null,
 *   isLoggedIn: boolean,
 *   isLoading: boolean,
 *   login: () => Promise<void>,
 *   logout: () => void,
 *   updateProfile: (updates: object) => void,
 * }}
 *
 * @throws {Error} Si se usa fuera del UserProvider
 *
 * @example
 * const { user, isLoggedIn, login, logout } = useUser()
 */
export function useUser() {
  const context = useContext(UserContext)
  if (context === null) {
    throw new Error(
      '[useUser] Debes usar este hook dentro de <UserProvider>. ' +
      'Envuelve tu árbol de componentes con <UserProvider> en App.jsx.'
    )
  }
  return context
}

export default UserContext
