/**
 * @fileoverview Página Dashboard — área privada protegida con autenticación JWT.
 *
 * MEJORA 21: Esta ruta ahora está protegida por PrivateRoute.
 * MEJORA 22: Dashboard rediseñado con gráficos SVG puros (BarChart, DonutChart, LineChart).
 *
 * Los datos son estáticos/simulados para demostrar los patrones de visualización.
 * En una app de producción provendrían de una API (ej. GET /api/dashboard/stats).
 *
 * @module pages/DashboardPage
 */
import { useAuth } from '../../context/AuthContext'
import { BarChart, DonutChart, LineChart } from '../../components/ui/Charts'
import DataTable from '../../components/ui/DataTable/DataTable.jsx'
import KanbanBoard from '../../components/ui/KanbanBoard/KanbanBoard.jsx'
import './DashboardPage.css'

/* ─── Datos de los gráficos ────────────────────────────────── */

/** BarChart: mejoras completadas por fase */
const PHASE_DATA = [
  { label: 'Fase 1',  value: 14, color: 'hsl(239, 84%, 64%)' },
  { label: 'Fase 2',  value: 11, color: 'hsl(262, 80%, 65%)' },
  { label: 'Fase 3',  value: 7,  color: 'hsl(142, 71%, 45%)' },
  { label: 'Fase 4',  value: 0,  color: 'hsl(215, 20%, 65%)' },
  { label: 'Fase 5',  value: 0,  color: 'hsl(215, 20%, 65%)' },
]

/** DonutChart: distribución de tecnologías del roadmap */
const TECH_SEGMENTS = [
  { label: 'React / JS',  value: 35, color: 'hsl(192, 95%, 68%)' },
  { label: 'Seguridad',   value: 20, color: 'hsl(0,   72%, 65%)' },
  { label: 'Next.js',     value: 20, color: 'hsl(239, 84%, 64%)' },
  { label: 'APIs & Stripe', value: 15, color: 'hsl(142, 71%, 45%)' },
  { label: 'DevOps',      value: 10, color: 'hsl(38,  92%, 55%)' },
]

/** LineChart: commits por semana (últimas 8 semanas) */
const WEEKLY_COMMITS = [
  { label: 'S1', value: 3 },
  { label: 'S2', value: 5 },
  { label: 'S3', value: 4 },
  { label: 'S4', value: 8 },
  { label: 'S5', value: 6 },
  { label: 'S6', value: 10 },
  { label: 'S7', value: 9 },
  { label: 'S8', value: 20 },
]

/* ─── Stats cards ───────────────────────────────────────────── */
const STATS = [
  { id: 'mejoras',     label: 'Mejoras implementadas', value: '32',   unit: 'de 100', icon: '✅', color: 'hsl(142, 71%, 45%)' },
  { id: 'commits',     label: 'Commits en GitHub',     value: '32',   unit: 'commits', icon: '📦', color: 'hsl(239, 84%, 64%)' },
  { id: 'componentes', label: 'Componentes UI',        value: '29',   unit: 'archivos', icon: '🧩', color: 'hsl(262, 80%, 65%)' },
  { id: 'cobertura',   label: 'Tests automatizados',   value: '126',  unit: 'pasando', icon: '🧪', color: 'hsl(142, 71%, 45%)' },
]

/* ─── Tabla de mejoras ──────────────────────────────────────── */
const COLUMNS = [
  {
    key: 'num', label: '#', sortable: true,
    render: (v) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand-500)', fontSize: 'var(--text-xs)' }}>{v}</span>,
  },
  { key: 'title',  label: 'Mejora',  sortable: true },
  {
    key: 'status', label: 'Estado', sortable: true,
    render: (v) => (
      <span className={`badge badge--${v === 'done' ? 'success' : v === 'wip' ? 'warning' : 'neutral'}`}>
        {v === 'done' ? '✅ Listo' : v === 'wip' ? '🔄 En curso' : '⏳ Pendiente'}
      </span>
    ),
  },
  {
    key: 'commit', label: 'Commit', sortable: false,
    render: (v) => v
      ? <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-brand-500)' }}>{v}</code>
      : '—',
  },
]

const IMPROVEMENTS_DATA = [
  { id: 1,  num: '01', title: 'Scaffolding inicial',             status: 'done', commit: '4a366c2' },
  { id: 2,  num: '02', title: 'Design tokens CSS',               status: 'done', commit: 'e46bc65' },
  { id: 3,  num: '03', title: 'React Router + Layout',           status: 'done', commit: 'f8900fa' },
  { id: 4,  num: '04', title: 'Hero section con animaciones',    status: 'done', commit: '7701c5e' },
  { id: 5,  num: '05', title: 'Dark Mode con useTheme',          status: 'done', commit: '24cc94f' },
  { id: 6,  num: '06', title: 'Formulario controlado',           status: 'done', commit: 'c8a1ae7' },
  { id: 7,  num: '07', title: 'Hook useFetch + AbortController', status: 'done', commit: '1f138a0' },
  { id: 8,  num: '08', title: 'Context API + useReducer',        status: 'done', commit: '2fd51b9' },
  { id: 9,  num: '09', title: 'Tabla dinámica paginada',         status: 'done', commit: 'c4ea2fb' },
  { id: 10, num: '10', title: 'Lazy loading y Code Splitting',   status: 'done', commit: 'd4c5334' },
  { id: 11, num: '11', title: 'Error Boundaries',                status: 'done', commit: 'd4f5bd9' },
  { id: 12, num: '12', title: 'Accesibilidad (a11y)',            status: 'done', commit: '184a461' },
  { id: 13, num: '13', title: 'Internacionalización (i18n)',      status: 'done', commit: '160c331' },
  { id: 14, num: '14', title: 'Tests con Vitest',                status: 'done', commit: '2354efb' },
  { id: 15, num: '15', title: 'Sanitización XSS + CSP headers',  status: 'done', commit: '6d8452e' },
  { id: 16, num: '16', title: 'hook useLocalStorage seguro',     status: 'done', commit: '04482d0' },
  { id: 17, num: '17', title: 'Toast notifications globales',    status: 'done', commit: '03f7f72' },
  { id: 18, num: '18', title: 'Modal reutilizable con portal',   status: 'done', commit: '1f7b4bb' },
  { id: 19, num: '19', title: 'Exportación CSV segura',          status: 'done', commit: '804c61f' },
  { id: 20, num: '20', title: 'Página de perfil + 2FA + medidor',status: 'done', commit: '78b5e08' },
  { id: 21, num: '21', title: 'Auth JWT + PrivateRoute',         status: 'done', commit: '73dd0b2' },
  { id: 22, num: '22', title: 'Dashboard con gráficos SVG',      status: 'done', commit: '405b7c5' },
  { id: 23, num: '23', title: 'GitHub REST API real',            status: 'done', commit: '03cefa2' },
  { id: 24, num: '24', title: 'Cobertura de tests completa',     status: 'done', commit: 'ab2ba25' },
  { id: 25, num: '25', title: 'PWA + Service Worker nativo',     status: 'done', commit: '166f4c4' },
  { id: 26, num: '26', title: 'Pasarela Stripe + Checkout Luhn', status: 'done', commit: 'e875c75' },
  { id: 27, num: '27', title: 'Buscador Global Ctrl+K Palette',  status: 'done', commit: '7e7747c' },
  { id: 28, num: '28', title: 'Centro de Alertas & Web Push API',status: 'done', commit: '3dfd46c' },
  { id: 29, num: '29', title: 'Tour Guiado Interactivo Onboarding', status: 'done', commit: '80c9ff4' },
  { id: 30, num: '30', title: 'OAuth 2.0 Google & GitHub Login',  status: 'done', commit: '03aad46' },
  { id: 31, num: '31', title: 'WhatsApp Cloud API & Chat Widget', status: 'done', commit: 'd358246' },
  { id: 32, num: '32', title: 'Modo Zen / Lectura Inmersiva',     status: 'done', commit: 'main' },
]

/**
 * Página de Dashboard con gráficos SVG y tabla de mejoras.
 * Protegida por PrivateRoute (requiere autenticación).
 * @returns {JSX.Element}
 */
function DashboardPage() {
  const { user } = useAuth()

  return (
    <main id="main-content" className="page-main">
      <div className="container">

        {/* ── Hero ── */}
        <section className="page-hero" aria-labelledby="dashboard-title">
          <span className="badge badge--brand">⚡ Área privada</span>
          <h1 id="dashboard-title">
            Hola, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Desarrollador'}</span> 👋
          </h1>
          <p>
            Aquí está el estado completo del proyecto DevForge —
            <strong> {IMPROVEMENTS_DATA.filter(m => m.status === 'done').length} de 100</strong> mejoras implementadas.
          </p>
        </section>

        {/* ── Stats cards ── */}
        <section aria-labelledby="stats-title" className="dashboard-stats-section">
          <h2 id="stats-title" className="dashboard-section-title">Métricas del proyecto</h2>
          <div className="dashboard-stats-grid">
            {STATS.map((stat) => (
              <article key={stat.id} className="dashboard-stat-card">
                <div className="dashboard-stat-card__icon" aria-hidden="true">{stat.icon}</div>
                <div className="dashboard-stat-card__value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="dashboard-stat-card__unit">{stat.unit}</div>
                <div className="dashboard-stat-card__label">{stat.label}</div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Gráficos — fila de 2 ── */}
        <section aria-labelledby="charts-title" className="dashboard-charts-section">
          <h2 id="charts-title" className="dashboard-section-title">Visualización de datos</h2>

          <div className="dashboard-charts-grid">

            {/* BarChart */}
            <article className="dashboard-chart-card">
              <h3 className="dashboard-chart-card__title">Mejoras por fase</h3>
              <p className="dashboard-chart-card__desc">Número de mejoras completadas en cada fase del roadmap.</p>
              <BarChart
                data={PHASE_DATA}
                title="Mejoras completadas por fase del roadmap DevForge"
                unit=" mejoras"
                height={180}
              />
            </article>

            {/* DonutChart */}
            <article className="dashboard-chart-card">
              <h3 className="dashboard-chart-card__title">Distribución tecnológica</h3>
              <p className="dashboard-chart-card__desc">Peso de cada área del roadmap de 100 mejoras.</p>
              <DonutChart
                segments={TECH_SEGMENTS}
                title="Distribución de tecnologías en el roadmap de DevForge"
                centerLabel="100"
              />
            </article>

            {/* LineChart — fila completa */}
            <article className="dashboard-chart-card dashboard-chart-card--full">
              <h3 className="dashboard-chart-card__title">Actividad semanal (commits)</h3>
              <p className="dashboard-chart-card__desc">Número de commits realizados en las últimas 8 semanas.</p>
              <LineChart
                data={WEEKLY_COMMITS}
                title="Commits por semana en las últimas 8 semanas"
                color="hsl(239, 84%, 64%)"
                unit=" commits"
              />
            </article>

          </div>
        </section>

        {/* ── Tabla de mejoras ── */}
        <section aria-labelledby="table-title" className="dashboard-table-section">
          <h2 id="table-title" className="dashboard-section-title">📋 Registro de mejoras</h2>
          <DataTable
            data={IMPROVEMENTS_DATA}
            columns={COLUMNS}
            caption="Tabla de las 100 mejoras del proyecto DevForge"
            initialPageSize={10}
          />
        </section>

        {/* ── Tablero Kanban (Mejora 34) ── */}
        <KanbanBoard />

      </div>
    </main>
  )
}

export default DashboardPage
