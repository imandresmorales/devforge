/**
 * @fileoverview Componente raíz — configura React Router, lazy loading y layout global.
 *
 * MEJORA 10 — CODE SPLITTING:
 * Todas las páginas se cargan con React.lazy() + Suspense.
 *
 * MEJORA 21 — AUTENTICACIÓN JWT + RUTAS PROTEGIDAS:
 * - Rutas /login y /register son públicas (redirigen al dashboard si ya hay sesión)
 * - /dashboard y /profile están protegidas con PrivateRoute
 * - PrivateRoute verifica isAuthenticated de AuthContext
 *
 * @module App
 */
import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { useAuth } from './context/AuthContext'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'
import { Header } from './components/layout'
import { Footer } from './components/layout'
import PageSkeleton from './components/ui/PageSkeleton/PageSkeleton.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary/ErrorBoundary.jsx'
import PrivateRoute from './components/ui/PrivateRoute/PrivateRoute.jsx'
import PWAPrompt from './components/ui/PWAPrompt/PWAPrompt.jsx'
import CommandPalette from './components/ui/CommandPalette/CommandPalette.jsx'
import TourGuide from './components/ui/TourGuide/TourGuide.jsx'
import WhatsAppWidget from './components/ui/WhatsAppWidget/WhatsAppWidget.jsx'
import ZenModeHUD from './components/ui/ZenModeHUD/ZenModeHUD.jsx'
import QRCodeModal from './components/ui/QRCodeModal/QRCodeModal.jsx'
import FeedbackModal from './components/ui/FeedbackModal/FeedbackModal.jsx'
import TerminalModal from './components/ui/TerminalModal/TerminalModal.jsx'
import AchievementsModal from './components/ui/AchievementsModal/AchievementsModal.jsx'
import PerformanceMonitor from './components/ui/PerformanceMonitor/PerformanceMonitor.jsx'
import useZenMode from './hooks/useZenMode'
import { ToastProvider } from './context/ToastContext'
import './App.css'

// ─── Lazy imports — cada página crea su propio chunk JS ───────
const HomePage      = lazy(() => import('./pages/HomePage/HomePage.jsx'))
const AboutPage     = lazy(() => import('./pages/AboutPage/AboutPage.jsx'))
const DocsPage      = lazy(() => import('./pages/DocsPage/DocsPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage/DashboardPage.jsx'))
const ContactPage   = lazy(() => import('./pages/ContactPage/ContactPage.jsx'))
const ProfilePage   = lazy(() => import('./pages/ProfilePage/ProfilePage.jsx'))
const NotFoundPage  = lazy(() => import('./pages/NotFoundPage/NotFoundPage.jsx'))
// Mejora 21 — Páginas de autenticación
const LoginPage    = lazy(() => import('./pages/LoginPage/LoginPage.jsx'))
const RegisterPage = lazy(() => import('./pages/RegisterPage/RegisterPage.jsx'))
// Mejora 23 — GitHub API
const GitHubPage   = lazy(() => import('./pages/GitHubPage/GitHubPage.jsx'))
// Mejora 26 — Stripe Pricing
const PricingPage  = lazy(() => import('./pages/PricingPage/PricingPage.jsx'))

/**
 * Ruta pública que redirige al dashboard si el usuario ya está autenticado.
 * Evita que un usuario logueado pueda volver a ver el login/register.
 *
 * @param {{ children: React.ReactNode }} props
 */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <PageSkeleton />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

/**
 * Layout principal de la aplicación.
 * Renderiza Header, el contenido de la ruta activa (Outlet) y Footer.
 *
 * @param {Object}   props
 * @param {string}   props.theme          - 'light' | 'dark'
 * @param {Function} props.onToggleTheme  - Callback para cambiar el tema
 */
function AppLayout({ theme, onToggleTheme }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isQROpen, setIsQROpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false)
  const zen = useZenMode()

  // Atajos globales: Ctrl+K (Buscador) y Ctrl+` (Terminal)
  useKeyboardShortcut('k', () => setIsSearchOpen(true), { ctrlOrCmd: true })
  useKeyboardShortcut('`', () => setIsTerminalOpen((prev) => !prev), { ctrlOrCmd: true })

  return (
    <div className="app-root">
      {/* Skip to content — accesibilidad para teclado */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <Header
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleZen={zen.toggleZenMode}
      />

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

      <Footer onOpenFeedback={() => setIsFeedbackOpen(true)} />
      <PWAPrompt />

      {/* Paleta de Comandos y Búsqueda Global (Mejora 27) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onToggleTheme={onToggleTheme}
        onOpenQR={() => setIsQROpen(true)}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
      />

      {/* Tour Guiado Interactivo de Onboarding (Mejora 29) */}
      <TourGuide />

      {/* Widget de soporte por WhatsApp (Mejora 31) */}
      <WhatsAppWidget />

      {/* HUD de Modo Zen (Mejora 32) */}
      <ZenModeHUD
        isZenMode={zen.isZenMode}
        readingProgress={zen.readingProgress}
        fontSizeOffset={zen.fontSizeOffset}
        onExit={zen.exitZenMode}
        onIncreaseFont={zen.increaseFontSize}
        onDecreaseFont={zen.decreaseFontSize}
        onResetFont={zen.resetFontSize}
        onToggleTheme={onToggleTheme}
        theme={theme}
      />

      {/* Generador de Código QR (Mejora 33) */}
      <QRCodeModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
      />

      {/* Módulo de Calificación y Feedback (Mejora 37) */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Terminal Interactiva CLI (Mejora 40) */}
      <TerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onToggleTheme={onToggleTheme}
        theme={theme}
      />

      {/* Sala de Logros y Recompensas (Mejora 41) */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
      />

      {/* Monitor de Rendimiento y Core Web Vitals en Vivo (Mejora 39) */}
      <PerformanceMonitor />
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
            {/* ── Rutas públicas ── */}
            <Route index              element={<HomePage />} />
            <Route path="about"      element={<AboutPage />} />
            <Route path="docs"       element={<DocsPage />} />
            <Route path="pricing"    element={<PricingPage />} />
            <Route path="contact"    element={<ContactPage />} />

            {/* ── Rutas de autenticación (solo accesibles si NO hay sesión) ── */}
            <Route
              path="login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />

            {/* ── Rutas protegidas (requieren autenticación) ── */}
            <Route
              path="dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="github"
              element={
                <PrivateRoute>
                  <GitHubPage />
                </PrivateRoute>
              }
            />

            {/* Ruta catch-all — debe ir siempre al final */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
