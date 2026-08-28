/**
 * @fileoverview Página de Login — formulario de autenticación con JWT.
 *
 * CONCEPTOS DEMOSTRADOS:
 * - Flujo de autenticación: credenciales → AuthContext.login() → token en memoria
 * - Redirección post-login: respeta location.state.from (PrivateRoute lo pasa)
 * - Validación en tiempo real con feedback inmediato
 * - Toggle de visibilidad de contraseña (accesible)
 * - Estado de carga durante el proceso de autenticación
 * - Credenciales de demostración visibles para contexto educativo
 *
 * @module pages/LoginPage
 */
import { useState, useId } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { isValidEmail } from '../../utils'
import { sanitizeRedirectPath } from '../../utils/security'
import SocialAuthButtons from '../../components/ui/SocialAuthButtons/SocialAuthButtons.jsx'
import './LoginPage.css'

/** Estado inicial del formulario */
const INITIAL = { email: '', password: '' }

/**
 * Valida el formulario de login y retorna el objeto de errores.
 * @param {{ email: string, password: string }} values
 * @returns {{ email: string, password: string }}
 */
function validate({ email, password }) {
  return {
    email:    !email.trim()             ? 'El email es obligatorio.'
            : !isValidEmail(email.trim()) ? 'Introduce un email válido.'
            : '',
    password: !password ? 'La contraseña es obligatoria.'
            : password.length < 6 ? 'Mínimo 6 caracteres.'
            : '',
  }
}

/**
 * Página de inicio de sesión.
 * @returns {JSX.Element}
 */
function LoginPage() {
  const formId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuth()
  const { addToast } = useToast()

  const [values,       setValues]       = useState(INITIAL)
  const [errors,       setErrors]       = useState({ email: '', password: '' })
  const [touched,      setTouched]      = useState({ email: false, password: false })
  const [showPassword, setShowPassword] = useState(false)

  // Destino post-login seguro (previene vulnerabilidades de Open Redirect)
  const from = sanitizeRedirectPath(location.state?.from?.pathname, '/dashboard')

  function handleChange(e) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validate({ ...values, [name]: value })[name] }))
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validate({ ...values, [name]: value })[name] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    const allErrors = validate(values)
    setErrors(allErrors)

    if (Object.values(allErrors).some(Boolean)) {
      document.querySelector('[aria-invalid="true"]')?.focus()
      return
    }

    try {
      await login(values.email.trim(), values.password)
      addToast({
        type:    'success',
        title:   '¡Bienvenido!',
        message: 'Sesión iniciada correctamente.',
      })
      navigate(from, { replace: true })
    } catch (err) {
      // El error ya está en AuthContext.error — lo mostramos como toast también
      addToast({
        type:    'error',
        title:   'Error de acceso',
        message: err.message,
      })
    }
  }

  return (
    <main id="main-content" className="auth-page">
      <div className="auth-card">

        {/* ── Cabecera ── */}
        <div className="auth-card__header">
          <span className="auth-card__logo" aria-hidden="true">⚡</span>
          <h1 className="auth-card__title">
            Iniciar sesión en <span className="text-gradient">DevForge</span>
          </h1>
          <p className="auth-card__subtitle">
            Accede a tu cuenta para continuar aprendiendo.
          </p>
        </div>

        {/* ── Credenciales demo ── */}
        <aside className="auth-demo-credentials" aria-label="Credenciales de demostración">
          <p className="auth-demo-credentials__label">🧪 Credenciales de prueba:</p>
          <div className="auth-demo-credentials__items">
            <div>
              <code>andres@devforge.com</code>
              <code>DevForge2026!</code>
            </div>
            <div>
              <code>demo@devforge.com</code>
              <code>Demo1234!</code>
            </div>
          </div>
        </aside>

        {/* ── Formulario ── */}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Formulario de inicio de sesión"
        >
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-email`}>
              Email
              <span className="form-label__required" aria-label="obligatorio">*</span>
            </label>
            <input
              id={`${formId}-email`}
              type="email"
              name="email"
              className={`form-input${errors.email && touched.email ? ' form-input--error' : touched.email && !errors.email ? ' form-input--valid' : ''}`}
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="tu@email.com"
              autoComplete="email"
              aria-required="true"
              aria-invalid={touched.email && !!errors.email}
              aria-describedby={`${formId}-email-error`}
              disabled={isLoading}
            />
            <span
              id={`${formId}-email-error`}
              className="form-error"
              aria-live="polite"
              role="alert"
            >
              {touched.email && errors.email ? `⚠ ${errors.email}` : ''}
            </span>
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-password`}>
              Contraseña
              <span className="form-label__required" aria-label="obligatorio">*</span>
            </label>
            <div className="auth-input-wrapper">
              <input
                id={`${formId}-password`}
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={`form-input auth-input-wrapper__input${errors.password && touched.password ? ' form-input--error' : touched.password && !errors.password ? ' form-input--valid' : ''}`}
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={`${formId}-password-error`}
                disabled={isLoading}
              />
              <button
                type="button"
                className="auth-input-wrapper__toggle"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={0}
              >
                <span aria-hidden="true">{showPassword ? '🙈' : '👁️'}</span>
              </button>
            </div>
            <span
              id={`${formId}-password-error`}
              className="form-error"
              aria-live="polite"
              role="alert"
            >
              {touched.password && errors.password ? `⚠ ${errors.password}` : ''}
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary auth-submit"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                Verificando…
              </>
            ) : (
              <>
                <span aria-hidden="true">🔐</span>
                Iniciar sesión
              </>
            )}
          </button>
        </form>

        {/* Login con OAuth 2.0 Social (Mejora 30) */}
        <SocialAuthButtons redirectTo={from} />

        {/* ── Pie: enlace a registro ── */}
        <p className="auth-card__footer">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/register" className="auth-card__link">
            Crear cuenta gratis
          </Link>
        </p>

      </div>
    </main>
  )
}

export default LoginPage
