/**
 * @fileoverview ToastContext — gestión global de notificaciones toast.
 * @module context/ToastContext
 */
import { createContext, useContext, useState, useCallback } from 'react'
import { generateId } from '../utils'
import ToastContainer from '../components/ui/Toast/ToastContainer'

const ToastContext = createContext(null)

/**
 * Proveedor global de notificaciones Toast.
 * @param {{ children: React.ReactNode }} props
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  /**
   * Elimina un toast por su ID
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  /**
   * Agrega un nuevo toast
   * @param {{ type?: 'success' | 'error' | 'warning' | 'info', title?: string, message: string, duration?: number }} options
   */
  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = generateId()
    const newToast = { id, type, title, message, duration }

    setToasts((prev) => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * Hook para acceder a la API de notificaciones Toast.
 * @returns {{ addToast: (options: {type?: string, title?: string, message: string, duration?: number}) => string, removeToast: (id: string) => void }}
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un <ToastProvider>')
  }
  return context
}
