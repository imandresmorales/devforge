/**
 * @fileoverview Componente raíz — configura React Router, lazy loading y layout global.
 *
 * MEJORA 10 — CODE SPLITTING:
 * Todas las páginas se cargan con React.lazy() + Suspense.
 * Cada página es un chunk JS separado que solo se descarga cuando
 * el usuario navega a esa ruta, reduciendo el bundle inicial.
 *
 * ANTES (Mejora 3):  Un solo bundle con TODAS las páginas.
 * DESPUÉS (Mejora 10): Bundle inicial pequeño + chunks por ruta.
 *
 * @module App
 */
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { Header } from './components/layout'
import { Footer } from './components/layout'
import PageSkeleton from './components/ui/PageSkeleton/PageSkeleton.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary/ErrorBoundary.jsx'
import { ToastProvider } from './context/ToastContext'
import './App.css'

// ─── Lazy imports — cada página crea su propio chunk JS ───────
// React.lazy() recibe una función que retorna un import() dinámico.
// El componente solo se descarga cuando se navega a esa ruta.
const HomePage      = lazy(() => import('./pages/HomePage/HomePage.jsx'))
const AboutPage     = lazy(() => import('./pages/AboutPage/AboutPage.jsx'))
const DocsPage      = lazy(() => import('./pages/DocsPage/DocsPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage/DashboardPage.jsx'))
const ContactPage   = lazy(() => import('./pages/ContactPage/ContactPage.jsx'))
const ProfilePage   = lazy(() => import('./pages/ProfilePage/ProfilePage.jsx'))
const NotFoundPage  = lazy(() => import('./pages/NotFoundPage/NotFoundPage.jsx'))

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

      {/*
        ErrorBoundary captura errores de la ruta activa (incluido el lazy load).
        Suspense muestra el skeleton mientras se descarga el chunk JS.
        Orden: ErrorBoundary > Suspense > Outlet (página activa)
      */}
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>

      <Footer />
    </div>
  )
}

/**
 * Componente principal con el enrutador, gestión de tema y lazy loading.
 * @returns {JSX.Element}
 */
function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <AppLayout theme={theme} onToggleTheme={toggleTheme} />
            }
          >
            <Route index              element={<HomePage />} />
            <Route path="about"      element={<AboutPage />} />
            <Route path="docs"       element={<DocsPage />} />
            <Route path="dashboard"  element={<DashboardPage />} />
            <Route path="contact"    element={<ContactPage />} />
            <Route path="profile"    element={<ProfilePage />} />
            {/* Ruta catch-all — debe ir siempre al final */}
            <Route path="*"          element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
