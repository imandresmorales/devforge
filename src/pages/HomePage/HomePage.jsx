/**
 * @fileoverview Página de inicio — Hero section con animaciones CSS puras.
 *
 * Características:
 * - Hero con título animado (slide-up), orbs de gradiente flotantes
 * - Botones CTA primario y secundario con hover effects
 * - Stats bar con métricas del proyecto
 * - Feature cards con micro-animaciones al hacer hover
 * - 100% responsive con media queries
 *
 * @module pages/HomePage
 */
import { Link } from 'react-router-dom'
import './HomePage.css'

/** Stats del proyecto que aparecen en la barra inferior del hero */
const HERO_STATS = [
  { value: '100',  label: 'Mejoras planificadas' },
  { value: '7',    label: 'Implementadas' },
  { value: '5',    label: 'Commits hoy' },
  { value: '0',    label: 'Vulnerabilidades' },
]

/** Feature cards que muestran las tecnologías del roadmap */
const FEATURES = [
  {
    id: 'auth',
    icon: '🔐',
    title: 'Autenticación segura',
    desc: 'Google OAuth, NextAuth.js, JWT, refresh tokens, rutas protegidas y gestión de sesiones.',
    tag: 'Mejoras 17–44',
  },
  {
    id: 'payments',
    icon: '💳',
    title: 'Pagos con Stripe',
    desc: 'Checkout sessions, webhooks firmados, suscripciones recurrentes y portal de facturación.',
    tag: 'Mejoras 46–50',
  },
  {
    id: 'whatsapp',
    icon: '💬',
    title: 'WhatsApp Cloud API',
    desc: 'Envío de mensajes, templates de Meta, webhooks para recibir mensajes y respuestas automáticas.',
    tag: 'Mejoras 51–54',
  },
  {
    id: 'security',
    icon: '🛡️',
    title: 'Seguridad web',
    desc: 'reCAPTCHA v3, CSP headers, prevención XSS con DOMPurify, rate limiting con Redis.',
    tag: 'Mejoras 16–27',
  },
  {
    id: 'nextjs',
    icon: '🚀',
    title: 'Next.js + TypeScript',
    desc: 'App Router, Server Components, Prisma ORM, Supabase PostgreSQL y TypeScript strict.',
    tag: 'Mejoras 29–45',
  },
  {
    id: 'pwa',
    icon: '📱',
    title: 'PWA + SEO',
    desc: 'Service Worker, instalable en móvil, offline support, sitemap, Open Graph y Core Web Vitals.',
    tag: 'Mejoras 66–73',
  },
]

/**
 * Página de inicio con Hero section completo y feature cards.
 * @returns {JSX.Element}
 */
function HomePage() {
  return (
    <main id="main-content">

      {/* ── Hero Section ── */}
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="container" style={{ display: 'contents' }}>

          {/* Badge de versión */}
          <span className="home-hero__version-badge" aria-label="Estado del proyecto">
            <span className="home-hero__version-dot" aria-hidden="true" />
            Mejora 4 de 100 activa
          </span>

          {/* Título principal */}
          <h1 id="hero-title" className="home-hero__title">
            Todo lo que un{' '}
            <span className="home-hero__title-gradient">informático</span>
            {' '}debe dominar
          </h1>

          {/* Subtítulo */}
          <p className="home-hero__subtitle">
            DevForge es una plataforma construida mejora a mejora — de React a Next.js,
            de pagos con Stripe a la API de WhatsApp. Código real, producción real.
          </p>

          {/* Botones CTA */}
          <div className="home-hero__cta">
            <Link
              to="/docs"
              className="btn-primary"
              aria-label="Ver la documentación del proyecto"
            >
              <span aria-hidden="true">📚</span>
              Ver documentación
            </Link>
            <a
              href="https://github.com/imandresmorales/devforge"
              className="btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver el código fuente en GitHub (abre en nueva pestaña)"
            >
              <span aria-hidden="true">⭐</span>
              GitHub
            </a>
          </div>

          {/* Stats bar */}
          <div
            className="home-hero__stats"
            role="list"
            aria-label="Estadísticas del proyecto"
          >
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="home-hero__stat" role="listitem">
                <span className="home-hero__stat-value" aria-label={`${stat.value} ${stat.label}`}>
                  {stat.value}
                </span>
                <span className="home-hero__stat-label" aria-hidden="true">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="home-features" aria-labelledby="features-title">
        <div className="container">

          <div className="home-features__header">
            <h2 id="features-title" className="home-features__title">
              ¿Qué aprenderás?
            </h2>
            <p className="home-features__subtitle">
              Cada tecnología se implementa en el proyecto real,
              con código limpio, seguro y buenas prácticas.
            </p>
          </div>

          <div className="home-features__grid">
            {FEATURES.map((feat) => (
              <article key={feat.id} className="feature-card">
                <div className="feature-card__icon-wrap" aria-hidden="true">
                  {feat.icon}
                </div>
                <h3 className="feature-card__title">{feat.title}</h3>
                <p className="feature-card__desc">{feat.desc}</p>
                <span className="feature-card__tag">{feat.tag}</span>
              </article>
            ))}
          </div>

        </div>
      </section>

    </main>
  )
}

export default HomePage
