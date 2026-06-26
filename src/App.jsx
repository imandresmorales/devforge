/**
 * @fileoverview Componente raíz — configura React Router y el layout global.
 *
 * App.jsx actúa como shell de la aplicación:
 * - Provee el tema (claro/oscuro) a toda la app — Mejora 5
 * - Define el layout: Header + <Outlet> + Footer
 * - Configura todas las rutas con React Router v6
 *
 * @module App
 */
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { Header } from './components/layout'
import { Footer } from './components/layout'
import {
  HomePage,
  AboutPage,
  DocsPage,
  DashboardPage,
  ContactPage,
  NotFoundPage,
} from './pages'
import './App.css'

/**
 * Layout principal de la aplicación.
 * Renderiza Header, el contenido de la ruta activa (Outlet) y Footer.
 *
 * @param {Object}   props
 * @param {string}   props.theme          - 'light' | 'dark'
 * @param {Function} props.onToggleTheme  - Callback para cambiar el tema
 */
function AppLayout({ theme, onToggleTheme }) {
  return (
    <div className="app-root">
      {/* Skip to content — accesibilidad para teclado */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <Header theme={theme} onToggleTheme={onToggleTheme} />

      {/* Las páginas se renderizan aquí */}
      <Outlet />

      <Footer />
    </div>
  )
}

/**
 * Componente principal con el enrutador y la gestión de tema.
 * El hook useTheme se implementa en la Mejora 5 — por ahora
 * el tema se inicializa como 'light' y el toggle no persiste.
 *
 * @returns {JSX.Element}
 */
function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <AppLayout theme={theme} onToggleTheme={toggleTheme} />
          }
        >
          <Route index         element={<HomePage />} />
          <Route path="about"     element={<AboutPage />} />
          <Route path="docs"      element={<DocsPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="contact"   element={<ContactPage />} />
          {/* Ruta catch-all — debe ir siempre al final */}
          <Route path="*"         element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
