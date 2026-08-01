/**
 * @fileoverview Custom hook para sincronizar estado de React con localStorage de forma segura.
 * 
 * CARACTERÍSTICAS DE SEGURIDAD Y ROBUSTEZ:
 * - Try-catch envolvente para capturar QuotaExceededError o bloqueo de privacidad.
 * - Sincronización reactiva entre diferentes pestañas mediante el evento 'storage'.
 * - Soporta actualización mediante valor directo o función colback (prev => newValue).
 * - Fallback seguro en memoria si localStorage no está disponible.
 *
 * @module hooks/useLocalStorage
 */
import { useState, useEffect, useCallback } from 'react'

/**
 * Hook para leer y escribir de manera segura en localStorage.
 * @template T
 * @param {string} key - Clave del almacenamiento
 * @param {T | (() => T)} initialValue - Valor inicial por defecto
 * @returns {[T, (value: T | ((val: T) => T)) => void]} Estado actual y función setter
 */
export function useLocalStorage(key, initialValue) {
  // Estado interno inicializado perezosamente
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        return JSON.parse(item)
      }
    } catch (error) {
      console.warn(`[useLocalStorage] Error al leer la clave "${key}":`, error)
    }

    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  // Función de actualización de valor
  const setValue = useCallback((value) => {
    try {
      setStoredValue((prevStored) => {
        const valueToStore = typeof value === 'function' ? value(prevStored) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
          console.error(`[useLocalStorage] Error al guardar la clave "${key}":`, error)
        }
        return valueToStore
      })
    } catch (error) {
      console.error(`[useLocalStorage] Error al guardar la clave "${key}":`, error)
    }
  }, [key])

  // Escuchar cambios de localStorage en otras pestañas
  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue))
        } catch (error) {
          console.warn(`[useLocalStorage] Error al parsear evento storage para "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue]
}

export default useLocalStorage
