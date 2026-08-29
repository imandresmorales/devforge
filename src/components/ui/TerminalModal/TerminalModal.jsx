/**
 * @fileoverview Modal de Terminal Interactiva CLI Emulada (Mejora 40).
 *
 * CARACTERÍSTICAS:
 * - Emulador de terminal con estilo terminal UNIX / PowerShell.
 * - Prompt reactivo `devforge@alex:~$ `.
 * - Auto-scroll hacia la última línea de comandos.
 * - Integración con el hook useTerminal.
 *
 * @module components/ui/TerminalModal
 */
import { useState, useEffect, useRef } from 'react'
import Modal from '../Modal/Modal.jsx'
import useTerminal from '../../../hooks/useTerminal'
import { useAuth } from '../../../context/AuthContext'
import './TerminalModal.css'

function TerminalModal({ isOpen, onClose, onToggleTheme, theme }) {
  const { user } = useAuth()
  const [inputVal, setInputVal] = useState('')
  const terminalBottomRef = useRef(null)

  const { history, handleKeyDown, inputRef } = useTerminal({
    onToggleTheme,
    user,
    theme,
  })

  // Auto-scroll al final tras cada comando
  useEffect(() => {
    if (isOpen) {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [history, isOpen, inputRef])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="DevForge CLI — Terminal Interactiva">
      <div className="terminal-window">
        {/* Cabecera estilo ventana de consola */}
        <div className="terminal-topbar">
          <div className="terminal-dots">
            <span className="term-dot term-dot--red" />
            <span className="term-dot term-dot--yellow" />
            <span className="term-dot term-dot--green" />
          </div>
          <span className="terminal-title-bar">bash — 80x24 — devforge-cli</span>
        </div>

        {/* Salida de consola */}
        <div className="terminal-body" onClick={() => inputRef.current?.focus()}>
          {history.map((line, idx) => {
            if (line.type === 'divider') {
              return <div key={idx} className="term-divider" />
            }
            return (
              <div key={idx} className={`term-line term-line--${line.type}`}>
                <pre>{line.text}</pre>
              </div>
            )
          })}

          {/* Línea de entrada activa */}
          <div className="term-input-row">
            <span className="term-prompt">devforge@{user?.name?.split(' ')[0]?.toLowerCase() || 'guest'}:~$</span>
            <input
              ref={inputRef}
              type="text"
              className="term-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, inputVal, setInputVal)}
              aria-label="Línea de comando"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <div ref={terminalBottomRef} />
        </div>
      </div>
    </Modal>
  )
}

export default TerminalModal
