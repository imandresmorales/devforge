/**
 * @fileoverview Componente raíz de la aplicación DevForge.
 * 
 * En esta primera mejora, App.jsx muestra una página de bienvenida
 * básica que confirma que el scaffolding funciona correctamente.
 * Las siguientes mejoras añadirán React Router y el layout completo.
 * 
 * @module App
 */
import './App.css'

/**
 * Componente principal de la aplicación.
 * @returns {JSX.Element} La interfaz de bienvenida de DevForge.
 */
function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="container">
          <div className="flex items-center gap-sm">
            <span className="app-logo" aria-hidden="true">⚡</span>
            <span className="app-brand">DevForge</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <section className="hero" aria-labelledby="hero-title">
            <h1 id="hero-title" className="hero__title">
              Bienvenido a{' '}
              <span className="text-gradient">DevForge</span>
            </h1>
            <p className="hero__subtitle">
              La plataforma para informáticos que quieren dominar el desarrollo
              web moderno — de React a Next.js, de pagos a seguridad.
            </p>
            <div className="hero__badge">
              <span className="badge badge--success">
                ✅ Mejora 1 completada — Scaffolding inicial
              </span>
            </div>
          </section>

          <section className="features" aria-label="Características del proyecto">
            <div className="features__grid">
              {FEATURES.map((feature) => (
                <article key={feature.id} className="feature-card">
                  <span className="feature-card__icon" aria-hidden="true">
                    {feature.icon}
                  </span>
                  <h2 className="feature-card__title">{feature.title}</h2>
                  <p className="feature-card__description">{feature.description}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p className="text-muted text-center">
            © 2025 DevForge — Construido con React 18 + Vite
          </p>
        </div>
      </footer>
    </div>
  )
}

/**
 * Datos de las features que se muestran en la pantalla de bienvenida.
 * Cada feature tiene un id único para el key prop de React.
 */
const FEATURES = [
  {
    id: 'auth',
    icon: '🔐',
    title: 'Autenticación',
    description: 'Google OAuth, JWT, sesiones seguras, refresh tokens y protección de rutas.',
  },
  {
    id: 'payments',
    icon: '💳',
    title: 'Pagos con Stripe',
    description: 'Checkout sessions, webhooks de pago, suscripciones y portal de facturación.',
  },
  {
    id: 'whatsapp',
    icon: '💬',
    title: 'WhatsApp API',
    description: 'Envío de mensajes, templates, webhooks y respuestas automáticas con Meta API.',
  },
  {
    id: 'security',
    icon: '🛡️',
    title: 'Seguridad',
    description: 'reCAPTCHA, CSP, XSS prevention, rate limiting, CORS y auditoría de deps.',
  },
  {
    id: 'nextjs',
    icon: '🚀',
    title: 'Migración a Next.js',
    description: 'App Router, Server Components, TypeScript strict, Prisma y Supabase.',
  },
  {
    id: 'devops',
    icon: '⚙️',
    title: 'DevOps',
    description: 'CI/CD con GitHub Actions, Docker, Vercel, Sentry y monitoreo en producción.',
  },
]

export default App
