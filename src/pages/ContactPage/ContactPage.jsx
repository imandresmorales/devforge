/**
 * @fileoverview Página de contacto — formulario controlado con validación en tiempo real.
 *
 * CONCEPTOS DEMOSTRADOS:
 * - Estado controlado con useState (cada input tiene su valor en el estado)
 * - Validación en tiempo real (onBlur + onChange)
 * - Mensajes de error accesibles con aria-live="polite"
 * - aria-describedby para conectar inputs con sus mensajes de error
 * - aria-invalid para indicar errores al lector de pantalla
 * - Botón submit deshabilitado mientras hay errores
 * - Simulación de envío con async/await + loading state
 *
 * @module pages/ContactPage
 */
import { useState, useId } from 'react'
import { isValidEmail } from '../../utils'
import { sanitizeInput } from '../../utils/security'
import './ContactPage.css'

/** Longitud máxima del mensaje */
const MAX_MESSAGE_LENGTH = 500

/** Temas disponibles en el select */
const TOPICS = [
  { value: '',              label: 'Selecciona un tema…' },
  { value: 'react',         label: '⚛️ React / JavaScript' },
  { value: 'nextjs',        label: '🚀 Next.js / TypeScript' },
  { value: 'security',      label: '🛡️ Seguridad web' },
  { value: 'payments',      label: '💳 Pagos con Stripe' },
  { value: 'whatsapp',      label: '💬 WhatsApp API' },
  { value: 'devops',        label: '⚙️ DevOps / CI-CD' },
  { value: 'other',         label: '✏️ Otro' },
]

/** Reglas de validación para cada campo */
const VALIDATORS = {
  name: (value) => {
    if (!value.trim()) return 'El nombre es obligatorio.'
    if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.'
    if (value.trim().length > 80) return 'El nombre no puede superar 80 caracteres.'
    return ''
  },
  email: (value) => {
    if (!value.trim()) return 'El email es obligatorio.'
    if (!isValidEmail(value.trim())) return 'Introduce un email válido (ej: user@ejemplo.com).'
    return ''
  },
  topic: (value) => {
    if (!value) return 'Selecciona un tema para continuar.'
    return ''
  },
  message: (value) => {
    if (!value.trim()) return 'El mensaje es obligatorio.'
    if (value.trim().length < 10) return 'El mensaje debe tener al menos 10 caracteres.'
    if (value.length > MAX_MESSAGE_LENGTH) return `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`
    return ''
  },
}

/** Estado inicial del formulario */
const INITIAL_FORM = { name: '', email: '', topic: '', message: '' }
const INITIAL_ERRORS = { name: '', email: '', topic: '', message: '' }
const INITIAL_TOUCHED = { name: false, email: false, topic: false, message: false }

/**
 * Valida todos los campos y retorna el objeto de errores.
 * @param {typeof INITIAL_FORM} values
 * @returns {typeof INITIAL_ERRORS}
 */
function validateAll(values) {
  return {
    name:    VALIDATORS.name(values.name),
    email:   VALIDATORS.email(values.email),
    topic:   VALIDATORS.topic(values.topic),
    message: VALIDATORS.message(values.message),
  }
}

/**
 * Indica si hay algún error en el objeto de errores.
 * @param {typeof INITIAL_ERRORS} errors
 * @returns {boolean}
 */
function hasErrors(errors) {
  return Object.values(errors).some((e) => e !== '')
}

/**
 * Página de contacto con formulario controlado.
 * @returns {JSX.Element}
 */
function ContactPage() {
  const formId = useId() // Genera IDs únicos para aria-describedby

  const [values,  setValues]  = useState(INITIAL_FORM)
  const [errors,  setErrors]  = useState(INITIAL_ERRORS)
  const [touched, setTouched] = useState(INITIAL_TOUCHED)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  /**
   * Actualiza el valor de un campo y valida en tiempo real
   * si el campo ya fue tocado (evita mostrar errores antes de interactuar).
   */
  function handleChange(e) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: VALIDATORS[name](value),
      }))
    }
  }

  /**
   * Marca el campo como "tocado" y valida al perder el foco.
   * Así el error solo aparece cuando el usuario sale del campo.
   */
  function handleBlur(e) {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({
      ...prev,
      [name]: VALIDATORS[name](value),
    }))
  }

  /**
   * Maneja el submit del formulario.
   * - Valida todos los campos
   * - Muestra todos los errores si los hay
   * - Simula un envío async con loading state
   */
  async function handleSubmit(e) {
    e.preventDefault()

    const sanitizedValues = {
      name: sanitizeInput(values.name),
      email: sanitizeInput(values.email),
      topic: values.topic,
      message: sanitizeInput(values.message),
    }

    // Marcar todos los campos como tocados para mostrar errores
    setTouched({ name: true, email: true, topic: true, message: true })
    const allErrors = validateAll(sanitizedValues)
    setErrors(allErrors)

    if (hasErrors(allErrors)) {
      // Mover el foco al primer error para accesibilidad
      const firstErrorField = document.querySelector('[aria-invalid="true"]')
      firstErrorField?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      // Simular llamada a API (en producción: fetch('/api/contact', { method: 'POST', body: JSON.stringify(values) }))
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSubmitted(true)
    } catch (err) {
      console.error('[ContactPage] Error al enviar el formulario:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  /** Reinicia el formulario para enviar otro mensaje */
  function handleReset() {
    setValues(INITIAL_FORM)
    setErrors(INITIAL_ERRORS)
    setTouched(INITIAL_TOUCHED)
    setSubmitted(false)
  }

  const messageCharsLeft = MAX_MESSAGE_LENGTH - values.message.length

  // ── Estado de éxito ──
  if (submitted) {
    return (
      <main id="main-content" className="page-main">
        <div className="container">
          <div className="contact-form-card contact-success" role="alert" aria-live="polite">
            <div className="contact-success__icon" aria-hidden="true">✅</div>
            <h1 className="contact-success__title">¡Mensaje enviado!</h1>
            <p className="contact-success__desc">
              Gracias por contactarnos. Te responderemos en menos de 24 horas.
            </p>
            <button
              className="btn-primary"
              onClick={handleReset}
              style={{ marginTop: 'var(--space-4)' }}
            >
              Enviar otro mensaje
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main id="main-content" className="page-main">
      <div className="container">

        <section className="page-hero" aria-labelledby="contact-title">
          <span className="badge badge--brand">📬 Contacto</span>
          <h1 id="contact-title">
            Hablemos de <span className="text-gradient">tecnología</span>
          </h1>
          <p>
            ¿Tienes dudas sobre el proyecto, quieres colaborar o simplemente
            quieres saludar? Escríbenos. Validación en tiempo real incluida.
          </p>
        </section>

        <div className="contact-layout">

          {/* ── Info de contacto ── */}
          <aside className="contact-info" aria-label="Información de contacto">
            <div>
              <h2 className="contact-info__title">¿Por qué este formulario?</h2>
              <p className="contact-info__desc">
                Este formulario demuestra los conceptos clave de los formularios
                controlados en React: estado controlado, validación en tiempo real,
                y mensajes de error accesibles con ARIA.
              </p>
            </div>
            <div className="contact-info__items">
              {[
                { icon: '⚛️', text: 'Estado controlado con useState' },
                { icon: '✅', text: 'Validación en tiempo real (onBlur + onChange)' },
                { icon: '♿', text: 'Mensajes de error con aria-live="polite"' },
                { icon: '🔒', text: 'Sin datos sensibles en el estado del componente' },
              ].map((item) => (
                <div key={item.text} className="contact-info__item">
                  <span className="contact-info__item-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* ── Formulario ── */}
          <div className="contact-form-card">
            <form
              className="contact-form"
              onSubmit={handleSubmit}
              noValidate
              aria-label="Formulario de contacto"
            >

              {/* Campo: Nombre */}
              <div className="form-group">
                <label className="form-label" htmlFor={`${formId}-name`}>
                  Nombre
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
                  aria-required="true"
                  aria-invalid={touched.name && !!errors.name}
                  aria-describedby={`${formId}-name-error`}
                  maxLength={80}
                />
                {/* aria-live="polite" anuncia el error al lector de pantalla sin interrumpir */}
                <span
                  id={`${formId}-name-error`}
                  className="form-error"
                  aria-live="polite"
                  role="alert"
                >
                  {touched.name && errors.name ? `⚠ ${errors.name}` : ''}
                </span>
              </div>

              {/* Campo: Email */}
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

              {/* Campo: Tema */}
              <div className="form-group">
                <label className="form-label" htmlFor={`${formId}-topic`}>
                  Tema
                  <span className="form-label__required" aria-label="obligatorio">*</span>
                </label>
                <select
                  id={`${formId}-topic`}
                  name="topic"
                  className={`form-select${errors.topic && touched.topic ? ' form-input--error' : ''}`}
                  value={values.topic}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-required="true"
                  aria-invalid={touched.topic && !!errors.topic}
                  aria-describedby={`${formId}-topic-error`}
                >
                  {TOPICS.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span
                  id={`${formId}-topic-error`}
                  className="form-error"
                  aria-live="polite"
                  role="alert"
                >
                  {touched.topic && errors.topic ? `⚠ ${errors.topic}` : ''}
                </span>
              </div>

              {/* Campo: Mensaje */}
              <div className="form-group">
                <label className="form-label" htmlFor={`${formId}-message`}>
                  Mensaje
                  <span className="form-label__required" aria-label="obligatorio">*</span>
                </label>
                <textarea
                  id={`${formId}-message`}
                  name="message"
                  className={`form-textarea${errors.message && touched.message ? ' form-textarea--error' : touched.message && !errors.message ? ' form-textarea--valid' : ''}`}
                  value={values.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Cuéntanos en qué podemos ayudarte…"
                  maxLength={MAX_MESSAGE_LENGTH}
                  aria-required="true"
                  aria-invalid={touched.message && !!errors.message}
                  aria-describedby={`${formId}-message-error ${formId}-char-count`}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    id={`${formId}-message-error`}
                    className="form-error"
                    aria-live="polite"
                    role="alert"
                  >
                    {touched.message && errors.message ? `⚠ ${errors.message}` : ''}
                  </span>
                  <span
                    id={`${formId}-char-count`}
                    className={`form-char-count${messageCharsLeft <= 50 ? ' form-char-count--warn' : ''}${messageCharsLeft <= 0 ? ' form-char-count--limit' : ''}`}
                    aria-label={`${messageCharsLeft} caracteres restantes`}
                  >
                    {messageCharsLeft}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="form-submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span aria-hidden="true">⏳</span>
                    Enviando…
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">📤</span>
                    Enviar mensaje
                  </>
                )}
              </button>

            </form>
          </div>

        </div>
      </div>
    </main>
  )
}

export default ContactPage
