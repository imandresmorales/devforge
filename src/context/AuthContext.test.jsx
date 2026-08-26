/**
 * @fileoverview Tests del AuthContext — flujo completo de autenticación.
 *
 * ESTRATEGIA DE TEST:
 * - wrapper de React Testing Library que envuelve con AuthProvider
 * - Tests del ciclo login → estado autenticado
 * - Tests del ciclo logout → estado inicial
 * - Test de que useAuth lanza un error descriptivo fuera del Provider
 * - Tests de validación de credenciales inválidas
 *
 * @module context/AuthContext.test
 */
import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

/** Wrapper que provee el AuthProvider a los hooks bajo test */
function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('AuthContext — sistema de autenticación JWT simulado', () => {

  it('estado inicial: usuario no autenticado después de montar (sin refresh token en localStorage)', async () => {
    // Nos aseguramos de que localStorage esté limpio
    localStorage.clear()

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Esperar a que termine la inicialización
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('login exitoso con credenciales válidas cambia el estado a autenticado', async () => {
    localStorage.clear()
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Esperar que termine la verificación de sesión inicial
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.login('andres@devforge.com', 'DevForge2026!')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).not.toBeNull()
    expect(result.current.user.email).toBe('andres@devforge.com')
    expect(result.current.user.name).toBe('Andres Morales')
    expect(result.current.error).toBeNull()
  })

  it('login con credenciales inválidas lanza error y mantiene isAuthenticated=false', async () => {
    localStorage.clear()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await expect(
        result.current.login('wrong@email.com', 'badpassword')
      ).rejects.toThrow()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    // El error debe ser genérico (no revelar si el email existe)
    expect(result.current.error).toContain('Credenciales incorrectas')
  })

  it('logout limpia el estado y elimina el refresh token de localStorage', async () => {
    localStorage.clear()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Primero logueamos
    await act(async () => {
      await result.current.login('demo@devforge.com', 'Demo1234!')
    })
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('df_refresh_token')).not.toBeNull()

    // Ahora hacemos logout
    act(() => { result.current.logout() })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('df_refresh_token')).toBeNull()
  })

  it('register con email nuevo crea la cuenta y autentica al usuario', async () => {
    localStorage.clear()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.register({
        name:     'Test User',
        email:    `test_${Date.now()}@devforge.com`,
        password: 'TestPassword1!',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.name).toBe('Test User')
  })

  it('register con email duplicado lanza error sin autenticar', async () => {
    localStorage.clear()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await expect(
        result.current.register({
          name:     'Duplicado',
          email:    'andres@devforge.com',  // email ya registrado
          password: 'Password1!',
        })
      ).rejects.toThrow()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toContain('ya está registrado')
  })

  it('useAuth fuera del AuthProvider lanza un Error descriptivo', () => {
    // Sin wrapper → el contexto es null
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('[useAuth]')
  })

  it('getAccessToken retorna null si el usuario no está autenticado', async () => {
    localStorage.clear()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.getAccessToken()).toBeNull()
  })

  it('getAccessToken retorna un string con el token tras el login', async () => {
    localStorage.clear()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.login('demo@devforge.com', 'Demo1234!')
    })

    const token = result.current.getAccessToken()
    expect(typeof token).toBe('string')
    // El token tiene estructura JWT: 3 partes separadas por .
    expect(token.split('.')).toHaveLength(3)
  })
})
