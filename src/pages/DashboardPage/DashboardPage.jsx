/**
 * @fileoverview Página Dashboard — área privada (se protegerá en Mejora 17).
 * @module pages/DashboardPage
 */

/** Estadísticas de ejemplo del dashboard */
const STATS = [
  { id: 'mejoras',    label: 'Mejoras implementadas', value: '7',    unit: 'de 100', icon: '✅' },
  { id: 'commits',    label: 'Commits en GitHub',     value: '7',    unit: 'commits', icon: '📦' },
  { id: 'componentes',label: 'Componentes creados',   value: '12',   unit: 'archivos', icon: '🧩' },
  { id: 'lineas',     label: 'Líneas de código',      value: '3.2K', unit: 'lines',   icon: '💻' },
]

function DashboardPage() {
  return (
    <main id="main-content" className="page-main">
      <div className="container">

        <section className="page-hero" aria-labelledby="dashboard-title">
          <span className="badge badge--warning">⚠️ Ruta no protegida — Mejora 17</span>
          <h1 id="dashboard-title">
            <span className="text-gradient">Dashboard</span>
          </h1>
          <p>
            Esta página se protegerá con autenticación real en la <strong>Mejora 17</strong>{' '}
            (JWT + rutas privadas). Por ahora muestra el estado del proyecto.
          </p>
        </section>

        {/* Stats grid */}
        <section
          aria-labelledby="stats-title"
          style={{ marginTop: 'var(--space-10)' }}
        >
          <h2
            id="stats-title"
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-bold)',
              marginBottom: 'var(--space-6)',
              color: 'var(--color-text-primary)',
            }}
          >
            Estado del proyecto
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {STATS.map((stat) => (
              <article
                key={stat.id}
                style={{
                  padding: 'var(--space-6)',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-xl)',
                  transition: 'border-color var(--transition-base)',
                }}
              >
                <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }} aria-hidden="true">
                  {stat.icon}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-3xl)',
                    fontWeight: 'var(--font-bold)',
                    background: 'var(--gradient-brand)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                  {stat.unit}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-medium)' }}>
                  {stat.label}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Nota educativa */}
        <aside
          style={{
            marginTop: 'var(--space-10)',
            padding: 'var(--space-6)',
            background: 'var(--color-brand-50)',
            border: '1px solid var(--color-brand-200)',
            borderRadius: 'var(--radius-xl)',
          }}
          aria-label="Nota educativa"
        >
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-brand-700)', marginBottom: 'var(--space-2)' }}>
            🎓 ¿Por qué no está protegida esta ruta?
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-brand-600)', lineHeight: 'var(--leading-relaxed)' }}>
            En la <strong>Mejora 17</strong> implementaremos un componente{' '}
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em' }}>PrivateRoute</code>{' '}
            que verificará si hay un token JWT válido antes de renderizar esta página.
            Si no hay sesión activa, redirigirá automáticamente al login.
          </p>
        </aside>

      </div>
    </main>
  )
}

export default DashboardPage
