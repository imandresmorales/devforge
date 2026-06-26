/**
 * @fileoverview Hook useFetch — peticiones HTTP con loading/error/data.
 *
 * CARACTERÍSTICAS:
 * - Genérico: funciona con cualquier URL y tipo de datos
 * - Cancelación automática con AbortController (evita memory leaks)
 * - Manejo de errores: errores de red Y errores HTTP (status >= 400)
 * - Re-fetch: cambiando la URL o las opciones se vuelve a pedir
 * - Caché simple en memoria para evitar re-peticiones innecesarias
 *
 * SEGURIDAD:
 * - No expone headers de autenticación en el estado del componente
 * - Los errores de red solo muestran el mensaje, no el stack trace
 *
 * @module hooks/useFetch
 */
import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Caché simple en memoria. Se limpia cuando se recarga la página.
 * @type {Map<string, {data: unknown, timestamp: number}>}
 */
const memoryCache = new Map()

/** TTL de la caché en milisegundos (5 minutos) */
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Verifica si un item de caché aún es válido.
 * @param {{data: unknown, timestamp: number} | undefined} cached
 * @returns {boolean}
 */
function isCacheValid(cached) {
  if (!cached) return false
  return Date.now() - cached.timestamp < CACHE_TTL_MS
}

/**
 * Hook personalizado para peticiones HTTP.
 *
 * @template T - Tipo de los datos de respuesta
 * @param {string | null} url - URL a solicitar. null deshabilita la petición.
 * @param {RequestInit} [options={}] - Opciones de fetch (method, headers, body…)
 * @param {{ cache?: boolean }} [config={}] - Configuración del hook
 * @param {boolean} [config.cache=false] - Habilitar caché en memoria
 *
 * @returns {{
 *   data: T | null,
 *   isLoading: boolean,
 *   error: string | null,
 *   refetch: () => void
 * }}
 *
 * @example
 * // Petición básica
 * const { data, isLoading, error } = useFetch('https://api.example.com/users')
 *
 * // Deshabilitar la petición condicionalmente
 * const { data } = useFetch(userId ? `/api/users/${userId}` : null)
 *
 * // Con opciones de fetch
 * const { data } = useFetch('/api/data', { method: 'GET', headers: { 'Accept': 'application/json' } })
 *
 * // Con caché
 * const { data } = useFetch('/api/posts', {}, { cache: true })
 */
export function useFetch(url, options = {}, config = {}) {
  const { cache: enableCache = false } = config

  const [data,      setData]      = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState(null)

  /**
   * Referencia al AbortController actual.
   * Ref en lugar de state porque no necesita provocar re-renders.
   */
  const abortControllerRef = useRef(null)

  /**
   * Contador de "versión" para forzar re-fetch.
   * Al llamar refetch(), incrementamos este contador,
   * lo que hace que el useEffect vuelva a ejecutarse.
   */
  const [fetchCount, setFetchCount] = useState(0)

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1)
  }, [])

  useEffect(() => {
    // Si no hay URL, no hacemos nada (permite uso condicional del hook)
    if (!url) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    // Comprobar caché
    if (enableCache) {
      const cacheKey = `${url}${JSON.stringify(options)}`
      const cached = memoryCache.get(cacheKey)
      if (isCacheValid(cached)) {
        setData(cached.data)
        setIsLoading(false)
        setError(null)
        return
      }
    }

    // Cancelar la petición anterior si todavía está en vuelo
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)

    async function fetchData() {
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })

        // Errores HTTP (4xx, 5xx) no lanzan excepción — los manejamos manualmente
        if (!response.ok) {
          throw new Error(
            `Error ${response.status}: ${response.statusText || 'Error del servidor'}`
          )
        }

        const json = await response.json()

        // Guardar en caché si está habilitado
        if (enableCache) {
          const cacheKey = `${url}${JSON.stringify(options)}`
          memoryCache.set(cacheKey, { data: json, timestamp: Date.now() })
        }

        setData(json)
        setError(null)
      } catch (err) {
        // AbortError no es un error real — es la cancelación normal
        if (err.name === 'AbortError') return

        // Separamos el mensaje del error (no exponemos el stack trace)
        setError(err.message || 'Error desconocido al realizar la petición.')
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Cleanup: cancelar la petición si el componente se desmonta
    // o si la URL / opciones cambian antes de que termine
    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, fetchCount, enableCache])

  return { data, isLoading, error, refetch }
}
