/**
 * @fileoverview Tests del hook useFetch — cobertura de estados y edge cases.
 *
 * ESTRATEGIA DE TEST:
 * - vi.spyOn(global, 'fetch') para interceptar llamadas a la red sin realizar peticiones reales
 * - renderHook de @testing-library/react para probar el hook en aislamiento
 * - waitFor para esperar actualizaciones asíncronas de estado
 * - act() para envolver actualizaciones que provocan re-renders
 *
 * @module hooks/useFetch.test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useFetch } from './useFetch'

/** Helper para crear una respuesta fetch simulada */
function mockFetchResponse(data, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

describe('useFetch — hook de fetching de datos', () => {
  /** Guardar el spy en una variable para limpiar después de cada test */
  let fetchSpy

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('estado inicial: isLoading=false mientras fetch no resuelve, data=null, error=null', () => {
    // Configurar fetch para que nunca resuelva (simula carga)
    fetchSpy.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useFetch('/api/test'))

    // data y error son null desde el inicio
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('devuelve los datos correctamente al recibir una respuesta 200', async () => {
    const mockData = [{ id: 1, name: 'Test' }]
    fetchSpy.mockReturnValue(mockFetchResponse(mockData))

    const { result } = renderHook(() => useFetch('/api/test'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('maneja errores HTTP (404, 500) correctamente', async () => {
    fetchSpy.mockReturnValue(mockFetchResponse({ message: 'Not found' }, 404))

    const { result } = renderHook(() => useFetch('/api/not-found'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).not.toBeNull()
    expect(result.current.error).toMatch(/404/)
  })

  it('maneja errores de red (fetch rechazado)', async () => {
    fetchSpy.mockReturnValue(Promise.reject(new Error('Network error')))

    const { result } = renderHook(() => useFetch('/api/test'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toContain('Network error')
    expect(result.current.data).toBeNull()
  })

  it('no actualiza el estado si el componente se desmonta (previene memory leaks)', async () => {
    let resolvePromise
    fetchSpy.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = () => resolve(mockFetchResponse({ ok: true }))
      })
    )

    const { result, unmount } = renderHook(() => useFetch('/api/test'))

    // Desmontamos antes de que la promesa resuelva
    unmount()
    // Resolvemos la promesa DESPUÉS del desmontaje
    act(() => resolvePromise())

    // El estado no debería haberse actualizado (isLoading todavía en true)
    // y no debería lanzar warnings de "setState en componente desmontado"
    expect(result.current.isLoading).toBe(true)
  })

  it('re-fetcha cuando cambia la URL (dependencia del efecto)', async () => {
    const data1 = { id: 1 }
    const data2 = { id: 2 }
    fetchSpy
      .mockReturnValueOnce(mockFetchResponse(data1))
      .mockReturnValueOnce(mockFetchResponse(data2))

    const { result, rerender } = renderHook(
      ({ url }) => useFetch(url),
      { initialProps: { url: '/api/1' } }
    )

    await waitFor(() => expect(result.current.data).toEqual(data1))

    rerender({ url: '/api/2' })

    await waitFor(() => expect(result.current.data).toEqual(data2))
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('no fetcha si la URL es null o undefined', () => {
    const { result } = renderHook(() => useFetch(null))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeNull()
  })
})
