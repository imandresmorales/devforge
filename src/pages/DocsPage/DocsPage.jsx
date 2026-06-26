/**
 * @fileoverview Página de documentación — referencia de mejoras implementadas.
 * @module pages/DocsPage
 */
import FetchDemo from '../../components/ui/FetchDemo/FetchDemo.jsx'

/** Lista de mejoras completadas */
const COMPLETED = [
  { num: 1,  title: 'Scaffolding inicial',                 desc: 'Estructura de carpetas, .gitignore, README, .env.example' },
  { num: 2,  title: 'Design tokens CSS',                   desc: 'variables.css, reset.css, utilities.css — paleta HSL, tipografía, espaciado' },
  { num: 3,  title: 'Layout base y React Router',          desc: 'Header, Footer, rutas /, /about, /docs, /dashboard, /contact, 404' },
  { num: 4,  title: 'Hero Section con animaciones',        desc: 'Keyframes, botones CTA, diseño visual premium, responsive' },
  { num: 5,  title: 'Dark Mode con useTheme',              desc: 'Toggle dark/light, localStorage, CSS variables, sin dependencias' },
  { num: 6,  title: 'Formulario controlado',               desc: 'Validación en tiempo real, aria-live, mensajes de error accesibles' },
  { num: 7,  title: 'Hook useFetch con AbortController',   desc: 'Peticiones HTTP con loading/error/data, cancelación correcta' },
]

/** Lista de próximas mejoras */
const UPCOMING = [
  { num: 8,  title: 'Context API — Estado global de usuario' },
  { num: 9,  title: 'Tabla dinámica con paginación' },
  { num: 10, title: 'Lazy loading y Code Splitting' },
  { num: 11, title: 'Error Boundaries' },
  { num: 12, title: 'Accesibilidad (a11y) — Primera pasada' },
  { num: 13, title: 'Internacionalización (i18n)' },
  { num: 14, title: 'Tests unitarios con Vitest' },
  { num: 15, title: 'Storybook — Documentación de componentes' },
]

function DocsPage() {
  return (
    <main id="main-content" className="page-main">
      <div className="container">

        <section className="page-hero" aria-labelledby="docs-title">
          <span className="badge badge--brand">📚 Documentación</span>
          <h1 id="docs-title">Referencia del <span className="text-gradient">Proyecto</span></h1>
          <p>
            Historial de mejoras implementadas y el plan de las próximas.
            Cada mejora es atómica — una sola cosa, un solo commit.
          </p>
        </section>

        {/* Mejoras completadas */}
        <section aria-labelledby="completed-title" style={{ marginTop: 'var(--space-12)' }}>
          <h2 id="completed-title" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--color-text-primary)' }}>
            ✅ Implementadas
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {COMPLETED.map((item) => (
              <article
                key={item.num}
                style={{
                  display: 'flex',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-5)',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-xl)',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{
                  flexShrink: 0,
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--gradient-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-bold)',
                  color: 'white',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {item.num}
                </span>
                <div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {item.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Próximas mejoras */}
        <section aria-labelledby="upcoming-title" style={{ marginTop: 'var(--space-10)' }}>
          <h2 id="upcoming-title" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--color-text-primary)' }}>
            🔜 Próximas
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {UPCOMING.map((item) => (
              <div
                key={item.num}
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-4)',
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  alignItems: 'center',
                  opacity: 0.7,
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', minWidth: '28px' }}>
                  #{item.num}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Demo interactivo del hook useFetch — Mejora 7 */}
        <FetchDemo />

      </div>
    </main>
  )
}

export default DocsPage
