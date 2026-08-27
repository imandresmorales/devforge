/**
 * @fileoverview Hook useKeyboardShortcut — escucha atajos de teclado globales.
 *
 * Soporta combinación con modificadores (Ctrl, Cmd, Alt, Shift) y desactiva
 * automáticamente el comportamiento predeterminado del navegador.
 *
 * @module hooks/useKeyboardShortcut
 */
import { useEffect } from 'react'

/**
 * Escucha una combinación de teclas específica en el documento.
 *
 * @param {string} key - Tecla a escuchar (ej. 'k', 'Escape', 'Enter')
 * @param {(event: KeyboardEvent) => void} callback - Función a ejecutar al pulsar el atajo
 * @param {Object} [options]
 * @param {boolean} [options.ctrlOrCmd=false] - Requiere Ctrl en Windows/Linux o Cmd en macOS
 * @param {boolean} [options.alt=false] - Requiere Alt / Option
 * @param {boolean} [options.shift=false] - Requiere Shift
 * @param {boolean} [options.preventDefault=true] - Prevenir acción por defecto del navegador
 */
export function useKeyboardShortcut(
  key,
  callback,
  options = { ctrlOrCmd: false, alt: false, shift: false, preventDefault: true }
) {
  const { ctrlOrCmd = false, alt = false, shift = false, preventDefault = true } = options

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isKeyMatch = event.key.toLowerCase() === key.toLowerCase()

      if (!isKeyMatch) return

      const isModifierMatch = ctrlOrCmd
        ? event.ctrlKey || event.metaKey
        : true

      const isAltMatch = alt ? event.altKey : !event.altKey
      const isShiftMatch = shift ? event.shiftKey : !event.shiftKey

      if (isModifierMatch && isAltMatch && isShiftMatch) {
        if (preventDefault) {
          event.preventDefault()
        }
        callback(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [key, callback, ctrlOrCmd, alt, shift, preventDefault])
}

export default useKeyboardShortcut
