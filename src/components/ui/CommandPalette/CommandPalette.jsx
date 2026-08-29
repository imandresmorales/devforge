/**
 * @fileoverview Paleta de Comandos y Búsqueda Global (Ctrl+K / Cmd+K) — Mejora 27.
 *
 * CARACTERÍSTICAS:
 * - Atajo de teclado global `Ctrl+K` / `Cmd+K` para abrir la paleta.
 * - Búsqueda rápida optimizada con debounce y categorización por secciones.
 * - Resaltado dinámico de texto coincidente con `<mark>`.
 * - Navegación 100% por teclado (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`).
 * - Acceso a todas las páginas, acciones del sistema y mejoras del roadmap.
 *
 * @module components/ui/CommandPalette
 */
import { useState, useEffect, useRef, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebounce } from '../../../hooks/useDebounce'
import { useKeyboardShortcut } from '../../../hooks/useKeyboardShortcut'
import './CommandPalette.css'

/**
 * Resalta la coincidencia de búsqueda dentro de un texto.
 * @param {string} text
 * @param {string} query
 * @returns {JSX.Element | string}
 */
function HighlightMatch({ text, query }) {
  if (!query || !query.trim()) return text
  const q = query.trim().toLowerCase()
  const idx = text.toLowerCase().indexOf(q)
  if (idx === -1) return text

  return (
    <>
      {text.slice(0, idx)}
      <mark className="cmd-highlight">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

function CommandPalette({ isOpen, onClose, onToggleTheme, onOpenQR, onOpenTerminal, onOpenAchievements }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const debouncedQuery = useDebounce(query, 120)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const searchId = useId()
  const navigate = useNavigate()

  // Atajo de cierre con tecla Escape
  useKeyboardShortcut('Escape', () => {
    if (isOpen) onClose()
  })

  // Autofoco al abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Catálogo indexado de comandos y páginas
  const ALL_ITEMS = [
    // ── Páginas de la App ──
    { id: 'page-home', category: 'Páginas', title: 'Inicio', icon: '🏠', subtitle: 'Página principal de DevForge', path: '/' },
    { id: 'page-pricing', category: 'Páginas', title: 'Planes & Precios', icon: '💳', subtitle: 'Suscripciones y pasarela Stripe', path: '/pricing' },
    { id: 'page-docs', category: 'Páginas', title: 'Documentación Técnica', icon: '📚', subtitle: 'Guías y arquitectura del proyecto', path: '/docs' },
    { id: 'page-dashboard', category: 'Páginas', title: 'Dashboard Privado', icon: '⚡', subtitle: 'Métricas y gráficos interactivos', path: '/dashboard' },
    { id: 'page-github', category: 'Páginas', title: 'GitHub en Vivo', icon: '🐙', subtitle: 'Commits y lenguajes del repositorio', path: '/github' },
    { id: 'page-profile', category: 'Páginas', title: 'Mi Perfil', icon: '👤', subtitle: 'Seguridad de cuenta y 2FA', path: '/profile' },
    { id: 'page-contact', category: 'Páginas', title: 'Contacto', icon: '📬', subtitle: 'Formulario con validación accesible', path: '/contact' },
    { id: 'page-about', category: 'Páginas', title: 'Acerca de DevForge', icon: 'ℹ️', subtitle: 'Misión del proyecto educativo', path: '/about' },
    { id: 'page-login', category: 'Páginas', title: 'Iniciar Sesión', icon: '🔐', subtitle: 'Autenticación con JWT', path: '/login' },

    // ── Acciones Rápidas ──
    {
      id: 'action-qr',
      category: 'Acciones',
      title: 'Generar Código QR',
      icon: '📱',
      subtitle: 'Crear código QR para URLs, 2FA y pagos',
      action: () => {
        onOpenQR?.()
        onClose()
      },
    },
    {
      id: 'action-terminal',
      category: 'Acciones',
      title: 'Abrir Terminal CLI Interactiva',
      icon: '💻',
      subtitle: 'Ejecutar comandos en la consola integrada DevForge',
      action: () => {
        onOpenTerminal?.()
        onClose()
      },
    },
    {
      id: 'action-achievements',
      category: 'Acciones',
      title: 'Ver Logros y Medallas',
      icon: '🏆',
      subtitle: 'Puntos XP, nivel y recompensas desbloqueadas',
      action: () => {
        onOpenAchievements?.()
        onClose()
      },
    },
    {
      id: 'action-theme',
      category: 'Acciones',
      title: 'Cambiar Tema (Claro / Oscuro)',
      icon: '🌓',
      subtitle: 'Alternar paleta de colores global',
      action: () => {
        onToggleTheme?.()
        onClose()
      },
    },
    {
      id: 'action-repo',
      category: 'Acciones',
      title: 'Abrir Repositorio en GitHub',
      icon: '🔗',
      subtitle: 'github.com/imandresmorales/devforge',
      action: () => {
        window.open('https://github.com/imandresmorales/devforge', '_blank', 'noopener,noreferrer')
        onClose()
      },
    },

    // ── Mejoras del Roadmap ──
    { id: 'm-26', category: 'Roadmap (Mejoras)', title: 'Mejora 26: Pasarela de Pagos Stripe', icon: '💳', subtitle: 'Validación Luhn, Checkout y Recibos', path: '/pricing' },
    { id: 'm-25', category: 'Roadmap (Mejoras)', title: 'Mejora 25: PWA y Soporte Offline', icon: '⚡', subtitle: 'Service Worker nativo y Manifest', path: '/dashboard' },
    { id: 'm-24', category: 'Roadmap (Mejoras)', title: 'Mejora 24: Tests con Vitest & RTL', icon: '🧪', subtitle: '78+ pruebas de unidad e integración', path: '/docs' },
    { id: 'm-23', category: 'Roadmap (Mejoras)', title: 'Mejora 23: GitHub API en Vivo', icon: '🐙', subtitle: 'Consumo de REST API con useGitHub', path: '/github' },
    { id: 'm-22', category: 'Roadmap (Mejoras)', title: 'Mejora 22: Dashboard con Gráficos SVG', icon: '📊', subtitle: 'BarChart, DonutChart y LineChart', path: '/dashboard' },
    { id: 'm-21', category: 'Roadmap (Mejoras)', title: 'Mejora 21: Autenticación JWT', icon: '🔐', subtitle: 'PrivateRoute y tokens en memoria', path: '/login' },
    { id: 'm-20', category: 'Roadmap (Mejoras)', title: 'Mejora 20: Perfil & 2FA', icon: '🛡️', subtitle: 'Medidor de contraseña y doble factor', path: '/profile' },
  ]

  // Filtrado reactivo según la búsqueda
  const filteredItems = ALL_ITEMS.filter((item) => {
    const q = debouncedQuery.toLowerCase().trim()
    if (!q) return true
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    )
  })

  // Agrupar por categoría
  const categories = Array.from(new Set(filteredItems.map((item) => item.category)))

  // Manejo de teclado en la lista
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredItems[selectedIndex]
      if (selected) {
        handleSelectItem(selected)
      }
    }
  }

  const handleSelectItem = (item) => {
    if (item.action) {
      item.action()
    } else if (item.path) {
      navigate(item.path)
      onClose()
    }
  }

  if (!isOpen) return null

  let globalIndexCounter = -1

  return (
    <div className="cmd-backdrop" onClick={onClose} role="presentation">
      <div
        className="cmd-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de Comandos y Búsqueda Global"
      >
        {/* Input de búsqueda */}
        <div className="cmd-input-wrapper">
          <span className="cmd-search-icon" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            id={searchId}
            type="text"
            className="cmd-input"
            placeholder="Escribe un comando o busca una página o mejora…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck="false"
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>

        {/* Lista de resultados */}
        <div ref={listRef} className="cmd-results" role="listbox">
          {filteredItems.length === 0 ? (
            <div className="cmd-empty">
              <span>🔎</span> No se encontraron resultados para &quot;<strong>{query}</strong>&quot;.
            </div>
          ) : (
            categories.map((category) => {
              const categoryItems = filteredItems.filter((it) => it.category === category)
              return (
                <div key={category} className="cmd-group">
                  <div className="cmd-group-title">{category}</div>
                  {categoryItems.map((item) => {
                    globalIndexCounter += 1
                    const currentIndex = globalIndexCounter
                    const isSelected = selectedIndex === currentIndex

                    return (
                      <div
                        key={item.id}
                        role="option"
                        aria-selected={isSelected}
                        className={`cmd-item${isSelected ? ' cmd-item--selected' : ''}`}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        onClick={() => handleSelectItem(item)}
                      >
                        <span className="cmd-item-icon" aria-hidden="true">{item.icon}</span>
                        <div className="cmd-item-info">
                          <span className="cmd-item-title">
                            <HighlightMatch text={item.title} query={query} />
                          </span>
                          <span className="cmd-item-subtitle">
                            <HighlightMatch text={item.subtitle} query={query} />
                          </span>
                        </div>
                        {isSelected && <span className="cmd-item-enter" aria-hidden="true">↵</span>}
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer con atajos */}
        <div className="cmd-footer">
          <span><kbd className="cmd-kbd-sm">↑</kbd> <kbd className="cmd-kbd-sm">↓</kbd> Navegar</span>
          <span><kbd className="cmd-kbd-sm">↵</kbd> Seleccionar</span>
          <span><kbd className="cmd-kbd-sm">ESC</kbd> Cerrar</span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
