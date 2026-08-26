/**
 * @fileoverview Hook useGitHub — datos del repositorio DevForge desde la API real.
 *
 * PATRÓN APLICADO:
 * - Orquesta 3 llamadas paralelas (repo info, commits, languages) con Promise.allSettled
 *   → Si una falla, las otras siguen funcionando (resiliente a errores parciales)
 * - Caché: los datos del repo cambian poco, usamos una caché de 5 minutos en memoria
 *   para no re-pedir al refrescar la página
 * - AbortController: cancelación limpia al desmontar el componente
 * - Estado granular: loading/error/data separados para cada fuente de datos
 *
 * @module hooks/useGitHub
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchRepoInfo,
  fetchRepoCommits,
  fetchRepoLanguages,
} from '../services/github'

/** Caché en memoria para datos del repositorio (TTL: 5 min) */
const GITHUB_CACHE = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000

/** @param {string} key @returns {unknown | null} */
function getCache(key) {
  const entry = GITHUB_CACHE.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    GITHUB_CACHE.delete(key)
    return null
  }
  return entry.data
}

/** @param {string} key @param {unknown} data */
function setCache(key, data) {
  GITHUB_CACHE.set(key, { data, ts: Date.now() })
}

/**
 * Hook que carga datos del repositorio GitHub en paralelo.
 *
 * @param {string} owner        - Propietario del repo (ej: 'imandresmorales')
 * @param {string} repo         - Nombre del repo (ej: 'devforge')
 * @param {number} [commitsCount=10] - Número de commits a traer
 *
 * @returns {{
 *   repoInfo:   object | null,
 *   commits:    object[] | null,
 *   languages:  Record<string, number> | null,
 *   isLoading:  boolean,
 *   error:      string | null,
 *   rateLimit:  { remaining: number, reset: Date } | null,
 *   refetch:    () => void,
 * }}
 */
export function useGitHub(owner, repo, commitsCount = 10) {
  const [repoInfo,   setRepoInfo]   = useState(getCache(`${owner}/${repo}/info`))
  const [commits,    setCommits]    = useState(getCache(`${owner}/${repo}/commits`))
  const [languages,  setLanguages]  = useState(getCache(`${owner}/${repo}/languages`))
  const [isLoading,  setIsLoading]  = useState(false)
  const [error,      setError]      = useState(null)
  const [rateLimit,  setRateLimit]  = useState(null)
  const [fetchCount, setFetchCount] = useState(0)

  const abortRef = useRef(null)

  const refetch = useCallback(() => {
    // Limpiar caché para forzar re-fetch
    GITHUB_CACHE.delete(`${owner}/${repo}/info`)
    GITHUB_CACHE.delete(`${owner}/${repo}/commits`)
    GITHUB_CACHE.delete(`${owner}/${repo}/languages`)
    setFetchCount((c) => c + 1)
  }, [owner, repo])

  useEffect(() => {
    // Si ya tenemos todo en caché, no pedimos nada
    const cachedInfo   = getCache(`${owner}/${repo}/info`)
    const cachedCommits = getCache(`${owner}/${repo}/commits`)
    const cachedLangs  = getCache(`${owner}/${repo}/languages`)

    if (cachedInfo && cachedCommits && cachedLangs) {
      setRepoInfo(cachedInfo)
      setCommits(cachedCommits)
      setLanguages(cachedLangs)
      return
    }

    // Cancelar petición anterior
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)

    // Lanzamos las 3 peticiones en paralelo
    Promise.allSettled([
      fetchRepoInfo(owner, repo, controller.signal),
      fetchRepoCommits(owner, repo, commitsCount, controller.signal),
      fetchRepoLanguages(owner, repo, controller.signal),
    ]).then(([infoResult, commitsResult, langsResult]) => {
      if (controller.signal.aborted) return

      // Procesar cada resultado independientemente
      if (infoResult.status === 'fulfilled') {
        const { data, rateLimit: rl } = infoResult.value
        setRepoInfo(data)
        setCache(`${owner}/${repo}/info`, data)
        setRateLimit(rl)
      } else if (infoResult.reason?.name !== 'AbortError') {
        setError(infoResult.reason?.message || 'Error al cargar el repositorio.')
      }

      if (commitsResult.status === 'fulfilled') {
        const { data } = commitsResult.value
        setCommits(data)
        setCache(`${owner}/${repo}/commits`, data)
      }

      if (langsResult.status === 'fulfilled') {
        const { data } = langsResult.value
        setLanguages(data)
        setCache(`${owner}/${repo}/languages`, data)
      }

      setIsLoading(false)
    })

    return () => controller.abort()
  }, [owner, repo, commitsCount, fetchCount])

  return { repoInfo, commits, languages, isLoading, error, rateLimit, refetch }
}
