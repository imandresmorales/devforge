/**
 * @fileoverview Página de Perfil de Usuario — Gestión de Seguridad, 2FA y Medidor de Contraseña.
 * @module pages/ProfilePage
 */
import { useState } from 'react'
import { useUser } from '../../context/UserContext'
import { useToast } from '../../context/ToastContext'
import { evaluatePasswordStrength, sanitizeInput } from '../../utils/security'
import Modal from '../../components/ui/Modal/Modal'
import './ProfilePage.css'

function ProfilePage() {
  const { user, login } = useUser()
  const { addToast } = useToast()

  const [name, setName] = useState(user?.name || 'Andres Morales')
  const [bio, setBio] = useState('Desarrollador Web Full Stack & Entusiasta de la Seguridad.')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [is2faEnabled, setIs2faEnabled] = useState(false)
  const [show2faModal, setShow2faModal] = useState(false)

  const passwordEval = evaluatePasswordStrength(password)

  function handleSaveProfile(e) {
    e.preventDefault()
    const cleanName = sanitizeInput(name)
    const cleanBio = sanitizeInput(bio)

    login({
      name: cleanName,
      bio: cleanBio,
      email: user?.email || 'andres@devforge.com',
      avatar: user?.avatar || '👨‍💻',
      role: user?.role || 'admin',
    })

    addToast({
      type: 'success',
      title: 'Perfil actualizado',
      message: 'Los datos de tu perfil se han guardado de forma segura.',
    })
  }

  function handleChangePassword(e) {
    e.preventDefault()

    if (!password) {
      addToast({ type: 'warning', title: 'Atención', message: 'Ingresa una nueva contraseña.' })
      return
    }

    if (password !== confirmPassword) {
      addToast({ type: 'error', title: 'Error', message: 'Las contraseñas no coinciden.' })
      return
    }

    if (passwordEval.score < 3) {
      addToast({
        type: 'warning',
        title: 'Contraseña débil',
        message: 'Utiliza una contraseña más fuerte (mayúsculas, números y símbolos).',
      })
      return
    }

    setPassword('')
    setConfirmPassword('')
    addToast({
      type: 'success',
      title: 'Contraseña actualizada',
      message: 'Tu clave de acceso ha sido actualizada con éxito.',
    })
  }

  function handleToggle2FA() {
    if (!is2faEnabled) {
      setShow2faModal(true)
    } else {
      setIs2faEnabled(false)
      addToast({ type: 'info', title: '2FA Desactivado', message: 'La autenticación de dos factores se ha desactivado.' })
    }
  }

  function handleConfirm2FA() {
    setIs2faEnabled(true)
    setShow2faModal(false)
    addToast({
      type: 'success',
      title: '2FA Activado 🛡️',
      message: 'Tu cuenta ahora está protegida con Autenticación de Dos Factores.',
    })
  }

  return (
    <main id="main-content" className="page-main">
      <div className="container">

        <section className="page-hero" aria-labelledby="profile-title">
          <span className="badge badge--brand">👤 Perfil y Seguridad</span>
          <h1 id="profile-title">
            Configuración de <span className="text-gradient">Cuenta</span>
          </h1>
          <p>
            Gestiona tus credenciales, evalúa la fuerza de tu clave y activa autenticación de dos factores (2FA).
          </p>
        </section>

        <div className="profile-grid">

          {/* Card: Información General */}
          <article className="profile-card">
            <h2 className="profile-card__title">Información de Perfil</h2>
            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-name">Nombre Completo</label>
                <input
                  id="profile-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-bio">Biografía</label>
                <textarea
                  id="profile-bio"
                  className="form-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={200}
                />
              </div>

              <button type="submit" className="btn-primary">
                Guardar Cambios
              </button>
            </form>
          </article>

          {/* Card: Seguridad de Contraseña */}
          <article className="profile-card">
            <h2 className="profile-card__title">Seguridad de la Contraseña</h2>
            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">Nueva Contraseña</label>
                <input
                  id="new-password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                />
              </div>

              {/* Medidor de Fuerza */}
              {password && (
                <div className="password-meter" aria-live="polite">
                  <div className="password-meter__header">
                    <span>Fuerza: <strong style={{ color: passwordEval.color }}>{passwordEval.label}</strong></span>
                    <span>{passwordEval.percentage}%</span>
                  </div>
                  <div className="password-meter__track">
                    <div
                      className="password-meter__bar"
                      style={{
                        width: `${passwordEval.percentage}%`,
                        backgroundColor: passwordEval.color,
                      }}
                    />
                  </div>
                  <ul className="password-meter__checks">
                    <li className={passwordEval.checks.length ? 'valid' : ''}>8+ Caracteres</li>
                    <li className={passwordEval.checks.upper && passwordEval.checks.lower ? 'valid' : ''}>Mayúsculas y minúsculas</li>
                    <li className={passwordEval.checks.number ? 'valid' : ''}>Números</li>
                    <li className={passwordEval.checks.special ? 'valid' : ''}>Símbolos especiales (!@#$)</li>
                  </ul>
                </div>
              )}

              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label" htmlFor="confirm-password">Confirmar Contraseña</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="btn-secondary">
                Actualizar Contraseña
              </button>
            </form>
          </article>

          {/* Card: Autenticación de Dos Factores (2FA) */}
          <article className="profile-card profile-card--full">
            <div className="twofa-container">
              <div>
                <h2 className="profile-card__title">Autenticación de Dos Factores (2FA)</h2>
                <p className="profile-card__desc">
                  Añade una capa extra de seguridad a tu cuenta solicitando un código TOTP de tu aplicación autenticadora.
                </p>
              </div>

              <div className="twofa-toggle">
                <span className={`badge ${is2faEnabled ? 'badge--success' : 'badge--neutral'}`}>
                  {is2faEnabled ? '🛡️ 2FA Activado' : '⚪ 2FA Desactivado'}
                </span>
                <button
                  type="button"
                  className={is2faEnabled ? 'btn-danger' : 'btn-primary'}
                  onClick={handleToggle2FA}
                >
                  {is2faEnabled ? 'Desactivar 2FA' : 'Configurar 2FA'}
                </button>
              </div>
            </div>
          </article>

        </div>

        {/* Modal de Configuración 2FA */}
        <Modal
          isOpen={show2faModal}
          onClose={() => setShow2faModal(false)}
          title="Configurar Autenticación 2FA"
          footer={
            <>
              <button className="btn-secondary" onClick={() => setShow2faModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleConfirm2FA}>Confirmar y Activar</button>
            </>
          }
        >
          <div className="twofa-modal-content">
            <p>Escanea este código QR simulado en Google Authenticator o Authy:</p>
            <div className="twofa-qr-placeholder">
              <span style={{ fontSize: '4rem' }}>📱</span>
              <code className="text-mono">DEVFORGE-2FA-SECRET-KEY-2026</code>
            </div>
            <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
              Guarda tus códigos de recuperación en un lugar seguro.
            </p>
          </div>
        </Modal>

      </div>
    </main>
  )
}

export default ProfilePage
