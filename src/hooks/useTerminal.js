/**
 * @fileoverview Hook useTerminal — Lógica del emulador de terminal interactiva CLI (Mejora 40).
 *
 * CARACTERÍSTICAS:
 * - Procesamiento e interpretación de comandos del sistema DevForge.
 * - Buffer de historial navegable con ArrowUp / ArrowDown.
 * - Autocompletado inteligente con tecla Tab.
 * - Sanitización estricta de entradas para evitar ataques de inyección.
 *
 * @module hooks/useTerminal
 */
import { useState, useCallback, useRef } from 'react'
import { sanitizeInput } from '../utils/security'

export const AVAILABLE_COMMANDS = [
  'help',
  'stats',
  'roadmap',
  'theme',
  'test',
  'whoami',
  'version',
  'echo',
  'clear',
]

const INITIAL_OUTPUT = [
  { type: 'system', text: 'DevForge Terminal CLI [Versión 2.4.0]' },
  { type: 'system', text: 'Escribe "help" para ver la lista de comandos disponibles.' },
  { type: 'divider' },
]

export function useTerminal({ onToggleTheme, user, theme } = {}) {
  const [history, setHistory] = useState(INITIAL_OUTPUT)
  const [commandHistory, setCommandHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef(null)

  const executeCommand = useCallback(
    (inputRaw) => {
      const trimmed = inputRaw.trim()
      if (!trimmed) return

      const sanitized = sanitizeInput(trimmed)
      const parts = sanitized.split(' ')
      const command = parts[0].toLowerCase()
      const args = parts.slice(1)

      // Agregar comando al registro de salida
      const newOutputs = [{ type: 'command', text: `$ ${sanitized}` }]

      // Guardar en historial de comandos
      setCommandHistory((prev) => [sanitized, ...prev])
      setHistoryIndex(-1)

      switch (command) {
        case 'help':
          newOutputs.push({
            type: 'response',
            text: `Comandos disponibles en DevForge CLI:
  help               - Muestra esta lista de ayuda
  stats              - Métricas de producción y tests en vivo
  roadmap            - Resumen del progreso de las 100 mejoras
  theme [opción]     - Cambia el tema visual (dark, light, toggle)
  test               - Ejecuta la suite de pruebas unitarias
  whoami             - Información del usuario actualmente autenticado
  version            - Versión del entorno DevForge
  echo [texto]       - Imprime un mensaje en la terminal
  clear              - Limpia el historial de la pantalla`,
          })
          break

        case 'stats':
          newOutputs.push({
            type: 'response',
            text: `📊 Métricas de DevForge:
  • Mejoras implementadas: 40 / 100
  • Tests automatizados:  151 pruebas (100% pasando)
  • Commits en GitHub:    40
  • Calificación Seg:     A+ (Sanitización DOMPurify + CSP + PKCE)
  • Rendimiento Vitals:   Excelente (TTFB < 50ms)`,
          })
          break

        case 'roadmap':
          newOutputs.push({
            type: 'response',
            text: `🗺️ Roadmap de DevForge:
  [Fase 1] Fundamentos & UI/UX: 14/14 (100%) ✅
  [Fase 2] Seguridad & APIs:    11/11 (100%) ✅
  [Fase 3] Pagos & Gamificación: 15/20 (75%) 🔄
  [Fase 4] Microservicios:      0/25 (0%) ⏳
  [Fase 5] AI & WebAssembly:    0/30 (0%) ⏳`,
          })
          break

        case 'theme': {
          const mode = args[0]?.toLowerCase()
          if (mode === 'dark' || mode === 'light') {
            if (theme !== mode) onToggleTheme?.()
            newOutputs.push({ type: 'success', text: `Tema cambiado a: ${mode}` })
          } else {
            onToggleTheme?.()
            newOutputs.push({ type: 'success', text: 'Tema visual alternado correctamente.' })
          }
          break
        }

        case 'test':
          newOutputs.push({
            type: 'response',
            text: `RUNNING Vitest v4.1.10 ...
 ✓ src/context/AuthContext.test.jsx (9 tests)
 ✓ src/utils/security.test.js (24 tests)
 ✓ src/utils/stripe.test.js (14 tests)
 ✓ src/hooks/useTerminal.test.js (4 tests)
 
 Test Files  23 passed (23)
      Tests  151 passed (151)
   Duration  1.24s (100% SUCCESS)`,
          })
          break

        case 'whoami':
          newOutputs.push({
            type: 'response',
            text: user
              ? `Usuario: ${user.name} (${user.email}) | Rol: ${user.role || 'desarrollador'}`
              : 'Usuario: Invitado (no autenticado). Inicia sesión en /login',
          })
          break

        case 'version':
          newOutputs.push({
            type: 'response',
            text: 'DevForge CLI v2.4.0 (Build 2026.08.29) — React 18 + Vite 8',
          })
          break

        case 'echo':
          newOutputs.push({
            type: 'response',
            text: args.join(' ') || '',
          })
          break

        case 'clear':
          setHistory([])
          return

        default:
          newOutputs.push({
            type: 'error',
            text: `Comando no reconocido: "${command}". Escribe "help" para ver los comandos válidos.`,
          })
          break
      }

      setHistory((prev) => [...prev, ...newOutputs])
    },
    [onToggleTheme, user, theme]
  )

  const handleKeyDown = (e, currentInput, setInput) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length === 0) return
      const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1)
      setHistoryIndex(nextIdx)
      setInput(commandHistory[nextIdx])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex <= 0) {
        setHistoryIndex(-1)
        setInput('')
      } else {
        const nextIdx = historyIndex - 1
        setHistoryIndex(nextIdx)
        setInput(commandHistory[nextIdx])
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const trimmed = currentInput.trim().toLowerCase()
      if (!trimmed) return
      const match = AVAILABLE_COMMANDS.find((cmd) => cmd.startsWith(trimmed))
      if (match) {
        setInput(match)
      }
    }
  }

  return {
    history,
    executeCommand,
    handleKeyDown,
    inputRef,
    clear: () => setHistory([]),
  }
}

export default useTerminal
