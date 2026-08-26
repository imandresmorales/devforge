/**
 * @fileoverview PrivateRoute — componente de ruta protegida.
 *
 * PATRÓN APLICADO:
 * - Verifica si el usuario está autenticado mediante AuthContext
 * - Durante la inicialización (isLoading = true), muestra un skeleton para evitar
 *   el flash de la página de login (FOUC de autenticación)
 * - Si no está autenticado, redirige a /login guardando la ruta original en
 *   location.state.from → LoginPage puede redirigir de vuelta después del login
 * - Si está autenticado, renderiza el contenido protegido normalmente
 *
 * SEGURIDAD:
 * - La protección real está en el backend (los endpoints validan el JWT).
 *   Este componente solo protege la UX, no los datos.
 * - Nunca exponer datos sensibles en el estado de la ruta antes de verificar.
 *
 * @module components/ui/PrivateRoute
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import PageSkeleton from '../PageSkeleton/PageSkeleton'

/**
 * Componente de ruta protegida.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 *
 * @example
 * // En App.jsx:
 * <Route
 *   path="dashboard"
 *   element={<PrivateRoute><DashboardPage /></PrivateRoute>}
 * />
 */
function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Fase de inicialización: esperando a que se restaure la sesión
  // Evita el flash incorrecto de la página de login al recargar la página
  if (isLoading) {
    return <PageSkeleton />
  }

  // Sin sesión activa: redirigir al login guardando el destino original
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  // Sesión válida: renderizar el contenido protegido
  return children
}

export default PrivateRoute
