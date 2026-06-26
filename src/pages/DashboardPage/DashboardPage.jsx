/**
 * @fileoverview Página Dashboard — área privada (se protegerá en Mejora 17).
 * @module pages/DashboardPage
 */
import DataTable from '../../components/ui/DataTable/DataTable.jsx'

/** Columnas de la tabla de mejoras */
const COLUMNS = [
  { key: 'num',    label: '#',          sortable: true,
    render: (v) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand-500)', fontSize: 'var(--text-xs)' }}>{v}</span> },
  { key: 'title',  label: 'Mejora',     sortable: true },
  { key: 'fase',   label: 'Fase',       sortable: true,
    render: (v) => <span className="badge badge--neutral">{v}</span> },
  { key: 'status', label: 'Estado',     sortable: true,
    render: (v) => <span className={`badge badge--${v === 'done' ? 'success' : v === 'wip' ? 'warning' : 'neutral'}`}>
      {v === 'done' ? '✅ Listo' : v === 'wip' ? '🔄 En curso' : '⏳ Pendiente'}
    </span> },
  { key: 'commit', label: 'Commit',     sortable: false,
    render: (v) => v ? <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-brand-500)' }}>{v}</code> : '—' },
]

/** Datos de las mejoras para la tabla */
const IMPROVEMENTS_DATA = [
  { id: 1,  num: '01', title: 'Scaffolding inicial',             fase: 'Fase 1', status: 'done', commit: '4a366c2' },
  { id: 2,  num: '02', title: 'Design tokens CSS',               fase: 'Fase 1', status: 'done', commit: 'e46bc65' },
  { id: 3,  num: '03', title: 'React Router + Layout',           fase: 'Fase 1', status: 'done', commit: 'f8900fa' },
  { id: 4,  num: '04', title: 'Hero section con animaciones',    fase: 'Fase 1', status: 'done', commit: '7701c5e' },
  { id: 5,  num: '05', title: 'Dark Mode con useTheme',          fase: 'Fase 1', status: 'done', commit: '24cc94f' },
  { id: 6,  num: '06', title: 'Formulario controlado',           fase: 'Fase 1', status: 'done', commit: 'c8a1ae7' },
  { id: 7,  num: '07', title: 'Hook useFetch + AbortController', fase: 'Fase 1', status: 'done', commit: '1f138a0' },
  { id: 8,  num: '08', title: 'Context API + useReducer',        fase: 'Fase 1', status: 'done', commit: '2fd51b9' },
  { id: 9,  num: '09', title: 'Tabla dinámica con paginación',   fase: 'Fase 1', status: 'wip',  commit: null },
  { id: 10, num: '10', title: 'Lazy loading y Code Splitting',   fase: 'Fase 1', status: 'wip',  commit: null },
  { id: 11, num: '11', title: 'Error Boundaries',                fase: 'Fase 1', status: 'wip',  commit: null },
  { id: 12, num: '12', title: 'Accesibilidad (a11y)',            fase: 'Fase 1', status: 'wip',  commit: null },
  { id: 13, num: '13', title: 'Internacionalización (i18n)',      fase: 'Fase 1', status: 'wip',  commit: null },
  { id: 14, num: '14', title: 'Tests con Vitest',                fase: 'Fase 1', status: 'todo', commit: null },
  { id: 15, num: '15', title: 'Storybook',                       fase: 'Fase 1', status: 'todo', commit: null },
  { id: 16, num: '16', title: 'Variables de entorno seguras',    fase: 'Fase 2', status: 'todo', commit: null },
  { id: 17, num: '17', title: 'Login con JWT',                   fase: 'Fase 2', status: 'todo', commit: null },
  { id: 18, num: '18', title: 'Google reCAPTCHA v3',             fase: 'Fase 2', status: 'todo', commit: null },
  { id: 19, num: '19', title: 'Sanitización XSS con DOMPurify', fase: 'Fase 2', status: 'todo', commit: null },
  { id: 20, num: '20', title: 'Cabeceras de seguridad HTTP',     fase: 'Fase 2', status: 'todo', commit: null },
]

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

        {/* Tabla de mejoras — Mejora 9 */}
        <section aria-labelledby="table-title" style={{ marginTop: 'var(--space-10)' }}>
          <h2
            id="table-title"
            style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--color-text-primary)' }}
          >
            📊 Registro de mejoras
          </h2>
          <DataTable
            data={IMPROVEMENTS_DATA}
            columns={COLUMNS}
            caption="Tabla de las 100 mejoras del proyecto DevForge"
            initialPageSize={5}
          />
        </section>

      </div>
    </main>
  )
}

export default DashboardPage
