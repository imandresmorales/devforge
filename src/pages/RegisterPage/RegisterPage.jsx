/**
 * @fileoverview Página de Registro — formulario de creación de cuenta.
 *
 * CONCEPTOS DEMOSTRADOS:
 * - Registro de usuario con validación completa antes del envío
 * - Reutilización del evaluatePasswordStrength existente en tiempo real
 * - Confirmación de contraseña: validación cruzada entre campos
 * - Sanitización de nombre e email con las utilidades del proyecto
 *
 * @module pages/RegisterPage
 */
import { useState, useId } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { evaluatePasswordStrength } from '../../utils/security'
import { isValidEmail } from '../../utils'
import '../LoginPage/LoginPage.css'
import './RegisterPage.css'

const INITIAL = { name: '', email: '', password: '', confirm: '' }

/**
 * Valida todos los campos del formulario de registro.
 * @param {{ name: string, email: string, password: string, confirm: string }} v
 * @returns {{ name: string, email: string, password: string, confirm: string }}
 */
function validate(v) {
  return {
    name: !v.name.trim()           ? 'El nombre es obligatorio.'
        : v.name.trim().length < 2  ? 'Mínimo 2 caracteres.'
        : '',
    email: !v.email.trim()              ? 'El email es obligatorio.'
        : !isValidEmail(v.email.trim())  ? 'Introduce un email válido.'
        : '',
    password: !v.password             ? 'La contraseña es obligatoria.'
        : v.password.length < 8       ? 'Mínimo 8 caracteres.'
        : !/[A-Z]/.test(v.password)   ? 'Debe incluir al menos una mayúscula.'
        : !/[0-9]/.test(v.password)   ? 'Debe incluir al menos un número.'
        : '',
    confirm: !v.confirm                ? 'Confirma tu contraseña.'
        : v.confirm !== v.password     ? 'Las contraseñas no coinciden.'
        : '',
  }
}

/**
 * Página de registro de nuevos usuarios.
 * @returns {JSX.Element}
 */
function RegisterPage() {
  const formId = useId()
  const navigate = useNavigate()
  const { register, isLoading } = useAuth()
  const { addToast } = useToast()

  const [values,       setValues]       = useState(INITIAL)
  const [errors,       setErrors]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [touched,      setTouched]      = useState({ name: false, email: false, password: false, confirm: false })
  const [showPassword, setShowPassword] = useState(false)

  const passwordEval = evaluatePasswordStrength(values.password)

  function handleChange(e) {
    const { name, value } = e.target
    const updated = { ...values, [name]: value }
    setValues(updated)
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validate(updated)[name] }))
    }
  }

  function handleBlur(e) {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validate(values)[name] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ name: true, email: true, password: true, confirm: true })
    const allErrors = validate(values)
    setErrors(allErrors)

    if (Object.values(allErrors).some(Boolean)) {
      document.querySelector('[aria-invalid="true"]')?.focus()
      return
    }

    try {
      await register({ name: values.name, email: values.email, password: values.password })
      addToast({
        type:    'success',
        title:   '¡Cuenta creada!',
        message: 'Bienvenido a DevForge. Tu cuenta ha sido creada exitosamente.',
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      addToast({ type: 'error', title: 'Error al registrarse', message: err.message })
    }
  }

  return (
    <main id="main-content" className="auth-page">
      <div className="auth-card">

        {/* ── Cabecera ── */}
        <div className="auth-card__header">
          <span className="auth-card__logo" aria-hidden="true">⚡</span>
          <h1 className="auth-card__title">
            Crear cuenta en <span className="text-gradient">DevForge</span>
          </h1>
          <p className="auth-card__subtitle">
            Únete y empieza a dominar el stack completo.
          </p>
        </div>

        {/* ── Formulario ── */}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Formulario de registro"
        >
          {/* Nombre */}
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-name`}>
              Nombre completo
              <span className="form-label__required" aria-label="obligatorio">*</span>
            </label>
            <input
              id={`${formId}-name`}
              type="text"
              name="name"
              className={`form-input${errors.name && touched.name ? ' form-input--error' : touched.name && !errors.name ? ' form-input--valid' : ''}`}
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Tu nombre completo"
              autoComplete="name"
              maxLength={80}
              aria-required="true"
              aria-invalid={touched.name && !!errors.name}
              aria-describedby={`${formId}-name-error`}
              disabled={isLoading}
            />
            <span id={`${formId}-name-error`} className="form-error" aria-live="polite" role="alert">
              {touched.name && errors.name ? `⚠ ${errors.name}` : ''}
            </span>
          </div>

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
            <span id={`${formId}-email-error`} className="form-error" aria-live="polite" role="alert">
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
                placeholder="Mín. 8 caracteres"
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={`${formId}-password-error ${formId}-password-strength`}
                disabled={isLoading}
              />
              <button
                type="button"
                className="auth-input-wrapper__toggle"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <span aria-hidden="true">{showPassword ? '🙈' : '👁️'}</span>
              </button>
            </div>

            {/* Medidor de fuerza (reutiliza lógica existente de ProfilePage) */}
            {values.password && (
              <div
                id={`${formId}-password-strength`}
                className="register-strength"
                aria-live="polite"
              >
                <div className="register-strength__header">
                  <span>Fuerza: <strong style={{ color: passwordEval.color }}>{passwordEval.label}</strong></span>
                  <span>{passwordEval.percentage}%</span>
                </div>
                <div className="register-strength__track" role="progressbar" aria-valuenow={passwordEval.percentage} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="register-strength__bar"
                    style={{ width: `${passwordEval.percentage}%`, backgroundColor: passwordEval.color }}
                  />
                </div>
              </div>
            )}

            <span id={`${formId}-password-error`} className="form-error" aria-live="polite" role="alert">
              {touched.password && errors.password ? `⚠ ${errors.password}` : ''}
            </span>
          </div>

          {/* Confirmación */}
          <div className="form-group">
            <label className="form-label" htmlFor={`${formId}-confirm`}>
              Confirmar contraseña
              <span className="form-label__required" aria-label="obligatorio">*</span>
            </label>
            <input
              id={`${formId}-confirm`}
              type={showPassword ? 'text' : 'password'}
              name="confirm"
              className={`form-input${errors.confirm && touched.confirm ? ' form-input--error' : touched.confirm && !errors.confirm ? ' form-input--valid' : ''}`}
              value={values.confirm}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={touched.confirm && !!errors.confirm}
              aria-describedby={`${formId}-confirm-error`}
              disabled={isLoading}
            />
            <span id={`${formId}-confirm-error`} className="form-error" aria-live="polite" role="alert">
              {touched.confirm && errors.confirm ? `⚠ ${errors.confirm}` : ''}
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
              <><span className="auth-spinner" aria-hidden="true" />Creando cuenta…</>
            ) : (
              <><span aria-hidden="true">🚀</span>Crear cuenta</>
            )}
          </button>
        </form>

        {/* ── Pie ── */}
        <p className="auth-card__footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="auth-card__link">
            Iniciar sesión
          </Link>
        </p>

      </div>
    </main>
  )
}

export default RegisterPage
