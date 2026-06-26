/**
 * @fileoverview Página Acerca de — información del proyecto.
 * @module pages/AboutPage
 */

/** Datos del tech stack para mostrar en la tabla */
const TECH_STACK = [
  { fase: '1–2',   tech: 'React 18 + Vite',                descripcion: 'Scaffolding, hooks, CSS tokens' },
  { fase: '3–4',   tech: 'React Router DOM v6',            descripcion: 'Navegación, layout, Hero section' },
  { fase: '5',     tech: 'CSS Custom Properties',          descripcion: 'Dark mode sin dependencias' },
  { fase: '16–28', tech: 'reCAPTCHA, JWT, DOMPurify',     descripcion: 'Seguridad web' },
  { fase: '29–45', tech: 'Next.js 14 + TypeScript',        descripcion: 'App Router, Server Components' },
  { fase: '36',    tech: 'NextAuth + Google OAuth',        descripcion: 'Autenticación real' },
  { fase: '46–50', tech: 'Stripe',                         descripcion: 'Pagos, webhooks, suscripciones' },
  { fase: '51–54', tech: 'WhatsApp Cloud API',             descripcion: 'Mensajería y webhooks' },
  { fase: '66–68', tech: 'SEO, Sitemap, JSON-LD',          descripcion: 'Posicionamiento en buscadores' },
  { fase: '72–73', tech: 'PWA + Service Worker',           descripcion: 'App instalable y offline' },
  { fase: '82–83', tech: 'GitHub Actions + Vercel',        descripcion: 'CI/CD automático' },
]

function AboutPage() {
  return (
    <main id="main-content" className="page-main">
      <div className="container">

        <section className="page-hero" aria-labelledby="about-title">
          <span className="badge badge--brand">ℹ️ Acerca del proyecto</span>
          <h1 id="about-title">¿Qué es <span className="text-gradient">DevForge</span>?</h1>
          <p>
            DevForge es una plataforma educativa construida <strong>mejora a mejora</strong>,
            cada una atómica y verificable. El objetivo: que un informático aprenda
            todas las tecnologías clave del desarrollo web moderno en un proyecto real.
          </p>
        </section>

        <section aria-labelledby="stack-title" style={{ marginTop: 'var(--space-12)' }}>
          <h2 id="stack-title" style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
            Roadmap tecnológico
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}
              aria-label="Tecnologías por fase del roadmap"
            >
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-semibold)' }}>Mejoras</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-semibold)' }}>Tecnología</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-semibold)' }}>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {TECH_STACK.map((row) => (
                  <tr
                    key={row.fase}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', color: 'var(--color-brand-500)', fontSize: 'var(--text-xs)' }}>
                      #{row.fase}
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-primary)' }}>
                      {row.tech}
                    </td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                      {row.descripcion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  )
}

export default AboutPage
