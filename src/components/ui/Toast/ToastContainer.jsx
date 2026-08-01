/**
 * @fileoverview ToastContainer — renderizado accesible de la lista de toasts.
 * @module components/ui/Toast/ToastContainer
 */
import './Toast.css'

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
}

function ToastContainer({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div
      className="toast-container"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          role="alert"
        >
          <span className="toast__icon" aria-hidden="true">
            {ICONS[toast.type] || ICONS.info}
          </span>
          <div className="toast__content">
            {toast.title && <strong className="toast__title">{toast.title}</strong>}
            <span className="toast__message">{toast.message}</span>
          </div>
          <button
            type="button"
            className="toast__close"
            onClick={() => onClose(toast.id)}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
