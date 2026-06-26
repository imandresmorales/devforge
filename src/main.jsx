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

import App from './App.jsx'
import { UserProvider } from './context'
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
      <UserProvider>
        <App />
      </UserProvider>
    </ErrorBoundary>
  </StrictMode>
)
