/**
 * @fileoverview Punto de entrada de la aplicación DevForge.
 * 
 * Responsabilidades:
 * - Montar el árbol de componentes React en el DOM
 * - Configurar StrictMode para detectar problemas en desarrollo
 * 
 * @module main
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Estilos globales — orden importante: reset → variables → utilidades → páginas → a11y
import './styles/reset.css'
import './styles/variables.css'
import './styles/utilities.css'
import './styles/pages.css'
import './styles/a11y.css'  // SIEMPRE al final para poder sobrescribir

// i18n debe inicializarse ANTES de que React renderice el árbol de componentes
import './i18n/i18n.js'

import App from './App.jsx'
import { UserProvider, AuthProvider, NotificationProvider } from './context'
import ErrorBoundary from './components/ui/ErrorBoundary/ErrorBoundary.jsx'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(
    '[DevForge] No se encontró el elemento #root en index.html. ' +
    'Revisa que index.html tenga <div id="root"></div>.'
  )
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      {/*
        AuthProvider debe envolver a UserProvider y NotificationProvider
        para proveer autenticación y centro de notificaciones globales.
      */}
      <AuthProvider>
        <UserProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </UserProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
)
