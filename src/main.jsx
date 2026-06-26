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

// Estilos globales — orden importante: reset → variables → utilidades → app
import './styles/reset.css'
import './styles/variables.css'
import './styles/utilities.css'
import './styles/pages.css'

import App from './App.jsx'
import { UserProvider } from './context'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(
    '[DevForge] No se encontró el elemento #root en index.html. ' +
    'Revisa que index.html tenga <div id="root"></div>.'
  )
}

createRoot(rootElement).render(
  <StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </StrictMode>
)
