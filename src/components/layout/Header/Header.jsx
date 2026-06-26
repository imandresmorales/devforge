/**
 * @fileoverview Componente Header — cabecera principal de la aplicación.
 *
 * Responsabilidades:
 * - Logo y nombre de la marca con enlace al inicio
 * - Navegación principal (desktop y móvil)
 * - Toggle de tema claro/oscuro (se conecta en Mejora 5)
 * - Accesibilidad: aria-label, aria-current, aria-expanded
 *
 * @module components/layout/Header
 */
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './Header.css'

/**
 * Elementos de navegación principal.
 * Definidos fuera del componente para evitar re-creaciones en cada render.
 * @type {Array<{to: string, label: string, icon: string}>}
 */
const NAV_LINKS = [
  { to: '/',          label: 'Inicio',     icon: '🏠', end: true  },
  { to: '/docs',      label: 'Docs',       icon: '📚', end: false },
  { to: '/about',     label: 'Acerca de',  icon: 'ℹ️',  end: false },
  { to: '/dashboard', label: 'Dashboard',  icon: '⚡', end: false },
]

/**
 * Componente de cabecera principal.
 *
 * @param {Object}   props
 * @param {string}   props.theme      - Tema actual: 'light' | 'dark'
 * @param {Function} props.onToggleTheme - Callback para cambiar el tema
 * @returns {JSX.Element}
 */
function Header({ theme, onToggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  /** Cierra el menú móvil al navegar */
  function handleNavLinkClick() {
    setMobileMenuOpen(false)
  }

  return (
    <header className="header" role="banner">
      <div className="container">
        <div className="header__inner">

          {/* ── Logo ── */}
          <NavLink
            to="/"
            className="header__brand"
            aria-label="DevForge — Ir al inicio"
          >
            <span className="header__logo" aria-hidden="true">⚡</span>
            <span className="header__name">DevForge</span>
          </NavLink>

          {/* ── Navegación desktop ── */}
          <nav className="header__nav" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `header__nav-link${isActive ? ' active' : ''}`
                }
                aria-current={({ isActive }) => isActive ? 'page' : undefined}
                onClick={handleNavLinkClick}
              >
                <span className="header__nav-link-icon" aria-hidden="true">
                  {link.icon}
                </span>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* ── Acciones ── */}
          <div className="header__actions">
            {/* Toggle de tema — la lógica viene de useTheme (Mejora 5) */}
            <button
              className="header__theme-btn"
              onClick={onToggleTheme}
              aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
              title={`Modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              <span aria-hidden="true">
                {theme === 'dark' ? '☀️' : '🌙'}
              </span>
            </button>

            {/* Botón menú móvil */}
            <button
              className="header__menu-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
            >
              <span aria-hidden="true">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Menú móvil ── */}
      <nav
        id="mobile-nav"
        className={`header__mobile-nav${mobileMenuOpen ? ' open' : ''}`}
        aria-label="Navegación móvil"
        aria-hidden={!mobileMenuOpen}
      >
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `header__nav-link${isActive ? ' active' : ''}`
            }
            onClick={handleNavLinkClick}
          >
            <span className="header__nav-link-icon" aria-hidden="true">
              {link.icon}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

export default Header
