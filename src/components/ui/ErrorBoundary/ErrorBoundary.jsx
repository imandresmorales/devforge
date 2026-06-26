/**
 * @fileoverview ErrorBoundary — captura errores de renderizado de React.
 *
 * POR QUÉ ES UNA CLASS COMPONENT:
 * Los Error Boundaries DEBEN ser componentes de clase porque requieren los
 * métodos del ciclo de vida static getDerivedStateFromError() y
 * componentDidCatch(), que no existen como hooks en React (aún).
 * Fuente: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 *
 * CUÁNDO SE ACTIVA:
 * - Errores de renderizado en el árbol de componentes hijo
 * - Errores en constructores de componentes hijos
 * - Errores en métodos del ciclo de vida de hijos
 * NO captura: promesas no manejadas, errores en event handlers, errores async
 *
 * SEGURIDAD:
 * - Los detalles del error (stack trace) solo se muestran en desarrollo
 * - En producción, el usuario ve un mensaje genérico amigable
 *
 * @module components/ui/ErrorBoundary
 */
import { Component } from 'react'
import './ErrorBoundary.css'

/**
 * @typedef {Object} ErrorBoundaryState
 * @property {boolean}    hasError   - true si se capturó un error
 * @property {Error|null} error      - El error capturado
 * @property {string}     errorInfo  - Información del stack del componente
 */

class ErrorBoundary extends Component {
  /**
   * @param {{ children: React.ReactNode, fallback?: React.ReactNode }} props
   */
  constructor(props) {
    super(props)

    /** @type {ErrorBoundaryState} */
    this.state = {
      hasError:  false,
      error:     null,
      errorInfo: '',
    }

    this.handleReset = this.handleReset.bind(this)
  }

  /**
   * Se llama durante el renderizado cuando un descendiente lanza un error.
   * Actualiza el estado para que el siguiente render muestre el fallback.
   *
   * @param {Error} error
   * @returns {Partial<ErrorBoundaryState>}
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    }
  }

  /**
   * Se llama después de que el error fue renderizado en el fallback.
   * Usado para logging del error (en producción: Sentry, LogRocket, etc.)
   *
   * @param {Error}                error
   * @param {React.ErrorInfo}      info  - info.componentStack: árbol de componentes
   */
  componentDidCatch(error, info) {
    this.setState({ errorInfo: info?.componentStack ?? '' })

    // En producción, aquí se enviaría el error a un servicio de monitoring:
    // Sentry.captureException(error, { extra: info })
    // Por ahora solo log en consola (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.group('[ErrorBoundary] Error capturado')
      console.error('Error:', error)
      console.error('Árbol de componentes:', info?.componentStack)
      console.groupEnd()
    }
  }

  /**
   * Reinicia el estado del boundary para intentar renderizar de nuevo.
   */
  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: '' })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    // Si el padre pasa un fallback personalizado, lo usamos
    if (this.props.fallback) {
      return this.props.fallback
    }

    const isDev = import.meta.env.DEV

    // Fallback por defecto
    return (
      <div className="error-boundary" role="alert" aria-live="assertive">
        <div className="error-boundary__card">

          <span className="error-boundary__icon" aria-hidden="true">⚠️</span>

          <h1 className="error-boundary__title">
            Algo salió mal
          </h1>

          <p className="error-boundary__subtitle">
            Se ha producido un error inesperado en esta sección. Puedes intentar
            recargar el componente o volver al inicio.
          </p>

          {/* Detalles del error — SOLO en desarrollo */}
          {isDev && this.state.error && (
            <details className="error-boundary__details">
              <summary>Ver detalles del error (solo visible en desarrollo)</summary>
              <pre className="error-boundary__error-message">
                {`${this.state.error.name}: ${this.state.error.message}`}
                {this.state.errorInfo
                  ? `\n\nComponente:\n${this.state.errorInfo}`
                  : ''}
              </pre>
            </details>
          )}

          {/* Acciones */}
          <div className="error-boundary__actions">
            <button
              className="btn-primary"
              onClick={this.handleReset}
              aria-label="Intentar renderizar el componente de nuevo"
            >
              🔄 Reintentar
            </button>
            <a
              href="/"
              className="btn-secondary"
              aria-label="Ir a la página de inicio"
            >
              🏠 Ir al inicio
            </a>
          </div>

        </div>
      </div>
    )
  }
}

export default ErrorBoundary
