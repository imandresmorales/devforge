/**
 * @fileoverview UserWidget — widget de sesión para el Header.
 *
 * Consume el UserContext para mostrar:
 * - Botón "Iniciar sesión" si no hay sesión (con estado loading)
 * - Dropdown con avatar, email, plan y acciones si hay sesión
 *
 * @module components/ui/UserWidget
 */
import { useState, useRef, useEffect } from 'react'
import { useUser } from '../../../context/UserContext'
import './UserWidget.css'

/**
 * Genera las iniciales de un nombre completo.
 * @param {string} name
 * @returns {string} Máximo 2 letras en mayúscula
 */
function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

/**
 * Widget de sesión de usuario.
 * @returns {JSX.Element}
 */
function UserWidget() {
  const { user, isLoggedIn, isLoading, login, logout } = useUser()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setDropdownOpen(false)
    }
    if (dropdownOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dropdownOpen])

  // ── Estado: no autenticado ──
  if (!isLoggedIn) {
    return (
      <button
        className="user-widget__login-btn"
        onClick={login}
        disabled={isLoading}
        aria-busy={isLoading}
        aria-label={isLoading ? 'Iniciando sesión…' : 'Iniciar sesión'}
      >
        <span aria-hidden="true">{isLoading ? '⏳' : '👤'}</span>
        {isLoading ? 'Entrando…' : 'Iniciar sesión'}
      </button>
    )
  }

  // ── Estado: autenticado ──
  const initials = getInitials(user?.name)

  return (
    <div className="user-widget" ref={dropdownRef}>
      {/* Trigger del dropdown */}
      <button
        className="user-widget__trigger"
        onClick={() => setDropdownOpen((prev) => !prev)}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
        aria-label={`Menú de usuario de ${user?.name}`}
      >
        <div className="user-widget__avatar" aria-hidden="true">
          {initials}
        </div>
        <span className="user-widget__name">{user?.name?.split(' ')[0]}</span>
        <span className="user-widget__chevron" aria-hidden="true">▼</span>
      </button>

      {/* Dropdown panel */}
      {dropdownOpen && (
        <div
          className="user-widget__dropdown"
          role="menu"
          aria-label="Opciones de usuario"
        >
          {/* Cabecera con info del perfil */}
          <div className="user-widget__dropdown-header">
            <div className="user-widget__dropdown-name">{user?.name}</div>
            <div className="user-widget__dropdown-email">{user?.email}</div>
            <div className="user-widget__dropdown-plan">
              <span className="badge badge--brand" style={{ fontSize: '10px' }}>
                Plan {user?.plan?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Opciones */}
          <div className="user-widget__dropdown-body" role="group">
            <button
              className="user-widget__dropdown-item"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
            >
              <span aria-hidden="true">👤</span> Mi perfil
            </button>
            <button
              className="user-widget__dropdown-item"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
            >
              <span aria-hidden="true">⚙️</span> Configuración
            </button>
            <button
              className="user-widget__dropdown-item"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
            >
              <span aria-hidden="true">💳</span> Plan y facturación
            </button>

            <div className="user-widget__dropdown-divider" role="separator" />

            <button
              className="user-widget__dropdown-item user-widget__dropdown-item--danger"
              role="menuitem"
              onClick={() => { logout(); setDropdownOpen(false) }}
              aria-label="Cerrar sesión"
            >
              <span aria-hidden="true">🚪</span> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserWidget
