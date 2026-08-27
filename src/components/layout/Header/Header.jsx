/**
 * @fileoverview Componente Header — cabecera principal de la aplicación.
 *
 * MEJORA 21 — AUTENTICACIÓN:
 * - Los links Dashboard y Profile solo son visibles si hay sesión activa
 * - El botón Login/Logout se muestra dinámicamente según el estado de auth
 * - El logout llama a AuthContext.logout() que limpia tokens y redirige
 *
 * @module components/layout/Header
 */
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../context/ToastContext'
import UserWidget from '../../../components/ui/UserWidget/UserWidget.jsx'
import LanguageSelector from '../../../components/ui/LanguageSelector/LanguageSelector.jsx'
import NotificationCenter from '../../../components/ui/NotificationCenter/NotificationCenter.jsx'
import './Header.css'

/**
 * Links de navegación base (siempre visibles).
 * @type {Array<{to: string, label: string, icon: string, end?: boolean}>}
 */
const PUBLIC_NAV_LINKS = [
  { to: '/',        label: 'Inicio',    icon: '🏠', end: true  },
  { to: '/docs',    label: 'Docs',      icon: '📚', end: false },
  { to: '/pricing', label: 'Planes',    icon: '💳', end: false },
  { to: '/about',   label: 'Acerca de', icon: 'ℹ️',  end: false },
  { to: '/contact', label: 'Contacto',  icon: '📬', end: false },
]

/**
 * Links de navegación exclusivos para usuarios autenticados.
 * @type {Array<{to: string, label: string, icon: string}>}
 */
const PRIVATE_NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '⚡', end: false },
  { to: '/github',    label: 'GitHub',    icon: '🐙', end: false },
]

/**
 * Componente de cabecera principal.
 *
 * @param {Object}   props
 * @param {string}   props.theme           - Tema actual: 'light' | 'dark'
 * @param {Function} props.onToggleTheme   - Callback para cambiar el tema
 * @returns {JSX.Element}
 */
function Header({ theme, onToggleTheme, onOpenSearch }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  /** Cierra el menú móvil al navegar */
  function handleNavLinkClick() {
    setMobileMenuOpen(false)
  }

  /** Maneja el cierre de sesión */
  function handleLogout() {
    logout()
    setMobileMenuOpen(false)
    addToast({
      type:    'info',
      title:   'Sesión cerrada',
      message: 'Has cerrado sesión correctamente.',
    })
    navigate('/', { replace: true })
  }

  // Combinar links según el estado de auth
  const navLinks = isAuthenticated
    ? [...PUBLIC_NAV_LINKS, ...PRIVATE_NAV_LINKS]
    : PUBLIC_NAV_LINKS

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
            {navLinks.map((link) => (
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
            {/* Buscador global con atajo Ctrl+K (Mejora 27) */}
            <button
              type="button"
              className="header__search-btn"
              onClick={onOpenSearch}
              aria-label="Abrir buscador global y paleta de comandos (Ctrl+K)"
              title="Buscar (Ctrl+K)"
            >
              <span className="header__search-icon" aria-hidden="true">🔍</span>
              <span className="header__search-placeholder">Buscar…</span>
              <kbd className="header__search-kbd">Ctrl K</kbd>
            </button>

            {/* Widget de sesión (Context API — Mejora 8) */}
            <UserWidget />

            {/* Selector de idioma (i18n — Mejora 13) */}
            <LanguageSelector />

            {/* Centro de Notificaciones y Web Push (Mejora 28) */}
            <NotificationCenter />

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

            {/* Mejora 21 — Botón Login / Logout según estado de auth */}
            {isAuthenticated ? (
              <button
                className="header__auth-btn header__auth-btn--logout"
                onClick={handleLogout}
                aria-label={`Cerrar sesión de ${user?.name || 'usuario'}`}
                title="Cerrar sesión"
              >
                <span aria-hidden="true">🚪</span>
                <span className="header__auth-btn-label">Salir</span>
              </button>
            ) : (
              <NavLink
                to="/login"
                className="header__auth-btn header__auth-btn--login"
                aria-label="Iniciar sesión"
              >
                <span aria-hidden="true">🔐</span>
                <span className="header__auth-btn-label">Entrar</span>
              </NavLink>
            )}

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
        {navLinks.map((link) => (
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

        {/* Login/Logout en menú móvil */}
        {isAuthenticated ? (
          <button
            className="header__nav-link header__mobile-logout"
            onClick={handleLogout}
          >
            <span className="header__nav-link-icon" aria-hidden="true">🚪</span>
            Cerrar sesión
          </button>
        ) : (
          <NavLink
            to="/login"
            className="header__nav-link"
            onClick={handleNavLinkClick}
          >
            <span className="header__nav-link-icon" aria-hidden="true">🔐</span>
            Iniciar sesión
          </NavLink>
        )}
      </nav>
    </header>
  )
}

export default Header
