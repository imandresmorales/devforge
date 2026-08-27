/**
 * @fileoverview Hook useDebounce — retrasa la actualización de un valor hasta que cese la actividad.
 *
 * Útil para inputs de búsqueda en tiempo real, evitando recálculos pesados o
 * peticiones a APIs por cada pulsación de tecla.
 *
 * @module hooks/useDebounce
 */
import { useState, useEffect } from 'react'

/**
 * Hook para demorar la reactividad de un valor cambiante.
 *
 * @template T
 * @param {T} value - Valor original
 * @param {number} [delay=250] - Tiempo de espera en milisegundos
 * @returns {T} Valor diferido
 *
 * @example
 * const debouncedSearch = useDebounce(query, 300)
 */
export function useDebounce(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
