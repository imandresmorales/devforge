/**
 * @fileoverview GitHubPage — datos reales del repositorio DevForge.
 *
 * CONCEPTOS DEMOSTRADOS:
 * - Consumo de una API REST pública real (GitHub v3) sin backend propio
 * - Manejo de estados de carga, error y datos vacíos
 * - Reutilización de BarChart (Mejora 22) con datos dinámicos reales
 * - Rate limit awareness: el usuario ve cuántas peticiones quedan
 * - Skeleton loading mientras se cargan los datos
 * - Botón "Reintentar" que limpia la caché y re-fetcha
 *
 * @module pages/GitHubPage
 */
import { useGitHub } from '../../hooks/useGitHub'
import { BarChart } from '../../components/ui/Charts'
import { formatDate } from '../../utils'
import './GitHubPage.css'

/** Repositorio a consultar */
const REPO_OWNER = 'imandresmorales'
const REPO_NAME  = 'devforge'

/**
 * Convierte el objeto de lenguajes { JavaScript: 45000, CSS: 12000, ... }
 * a datos aptos para BarChart.
 * @param {Record<string, number>} langs
 * @returns {import('../../components/ui/Charts/BarChart').BarDatum[]}
 */
function langsToChartData(langs) {
  if (!langs) return []
  const total = Object.values(langs).reduce((a, b) => a + b, 0)
  const LANG_COLORS = {
    JavaScript: 'hsl(54, 95%, 55%)',
    TypeScript: 'hsl(210, 79%, 60%)',
    CSS:        'hsl(239, 84%, 64%)',
    HTML:       'hsl(19, 87%, 57%)',
    Python:     'hsl(210, 79%, 55%)',
  }
  return Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([lang, bytes]) => ({
      label: lang,
      value: Math.round((bytes / total) * 100),
      color: LANG_COLORS[lang] || 'hsl(239, 84%, 64%)',
    }))
}

/** Skeleton de una card mientras carga */
function SkeletonCard({ lines = 3 }) {
  return (
    <div className="github-skeleton-card" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="github-skeleton-line" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  )
}

/**
 * Página que muestra datos reales del repositorio GitHub de DevForge.
 * @returns {JSX.Element}
 */
function GitHubPage() {
  const { repoInfo, commits, languages, isLoading, error, rateLimit, refetch } = useGitHub(
    REPO_OWNER,
    REPO_NAME,
    10
  )

  const langChartData = langsToChartData(languages)

  return (
    <main id="main-content" className="page-main">
      <div className="container">

        {/* ── Hero ── */}
        <section className="page-hero" aria-labelledby="github-title">
          <span className="badge badge--brand">🐙 GitHub API en vivo</span>
          <h1 id="github-title">
            Repositorio <span className="text-gradient">DevForge</span>
          </h1>
          <p>
            Datos reales del repositorio <strong>imandresmorales/devforge</strong> obtenidos
            de la GitHub REST API v3 sin autenticación. Caché de 5 minutos en memoria.
          </p>
        </section>

        {/* ── Rate limit ── */}
        {rateLimit && (
          <div className="github-rate-limit" role="status" aria-live="polite">
            <span className={`github-rate-limit__badge ${rateLimit.remaining < 10 ? 'github-rate-limit__badge--warn' : ''}`}>
              🔢 {rateLimit.remaining} peticiones restantes de {rateLimit.limit}
            </span>
            {rateLimit.remaining < 10 && (
              <span className="github-rate-limit__reset">
                · Reset: {rateLimit.reset.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="github-error" role="alert">
            <span className="github-error__icon" aria-hidden="true">⚠️</span>
            <div>
              <strong>Error al conectar con GitHub</strong>
              <p>{error}</p>
            </div>
            <button className="btn-secondary github-error__retry" onClick={refetch}>
              🔄 Reintentar
            </button>
          </div>
        )}

        <div className="github-grid">

          {/* ── Card: Repo info ── */}
          <section aria-labelledby="repo-info-title" className="github-card github-card--wide">
            <h2 id="repo-info-title" className="github-card__title">📦 Información del repositorio</h2>
            {isLoading && !repoInfo ? (
              <SkeletonCard lines={5} />
            ) : repoInfo ? (
              <div className="github-repo-info">
                <div className="github-repo-stats">
                  {[
                    { icon: '⭐', label: 'Stars',   value: repoInfo.stargazers_count ?? 0 },
                    { icon: '🍴', label: 'Forks',   value: repoInfo.forks_count ?? 0 },
                    { icon: '👁️', label: 'Watchers', value: repoInfo.watchers_count ?? 0 },
                    { icon: '🐛', label: 'Issues',  value: repoInfo.open_issues_count ?? 0 },
                  ].map((s) => (
                    <div key={s.label} className="github-repo-stat">
                      <span className="github-repo-stat__icon" aria-hidden="true">{s.icon}</span>
                      <span className="github-repo-stat__value">{s.value}</span>
                      <span className="github-repo-stat__label">{s.label}</span>
                    </div>
                  ))}
                </div>
                <div className="github-repo-meta">
                  {repoInfo.description && (
                    <p className="github-repo-meta__desc">{repoInfo.description}</p>
                  )}
                  <dl className="github-repo-meta__details">
                    <div>
                      <dt>Lenguaje principal</dt>
                      <dd><span className="badge badge--brand">{repoInfo.language || 'N/A'}</span></dd>
                    </div>
                    <div>
                      <dt>Branch default</dt>
                      <dd><code>{repoInfo.default_branch}</code></dd>
                    </div>
                    <div>
                      <dt>Último push</dt>
                      <dd>{repoInfo.pushed_at ? formatDate(repoInfo.pushed_at) : 'N/A'}</dd>
                    </div>
                    <div>
                      <dt>Creado</dt>
                      <dd>{repoInfo.created_at ? formatDate(repoInfo.created_at) : 'N/A'}</dd>
                    </div>
                  </dl>
                  <a
                    href={repoInfo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary github-repo-link"
                    aria-label="Ver el repositorio en GitHub (abre en nueva pestaña)"
                  >
                    <span aria-hidden="true">🔗</span> Ver en GitHub
                  </a>
                </div>
              </div>
            ) : !error && (
              <p className="chart-empty">No se pudo cargar la información del repositorio.</p>
            )}
          </section>

          {/* ── Card: Lenguajes ── */}
          <section aria-labelledby="langs-title" className="github-card">
            <h2 id="langs-title" className="github-card__title">💻 Distribución de lenguajes</h2>
            <p className="github-card__desc">Porcentaje de bytes por lenguaje en el repositorio.</p>
            {isLoading && !languages ? (
              <SkeletonCard lines={4} />
            ) : langChartData.length > 0 ? (
              <BarChart
                data={langChartData}
                title="Distribución de lenguajes de programación en DevForge"
                unit="%"
                height={160}
              />
            ) : !error && (
              <p className="chart-empty">Sin datos de lenguajes.</p>
            )}
          </section>

          {/* ── Card: Últimos commits ── */}
          <section aria-labelledby="commits-title" className="github-card github-card--full">
            <h2 id="commits-title" className="github-card__title">📝 Últimos 10 commits</h2>
            {isLoading && !commits ? (
              <div className="github-commits-list">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
              </div>
            ) : commits?.length > 0 ? (
              <ol className="github-commits-list" aria-label="Lista de commits recientes">
                {commits.map((commit) => (
                  <li key={commit.sha} className="github-commit">
                    <a
                      href={commit.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="github-commit__hash"
                      aria-label={`Ver commit ${commit.sha.slice(0, 7)} en GitHub`}
                    >
                      {commit.sha.slice(0, 7)}
                    </a>
                    <span className="github-commit__message">
                      {commit.commit.message.split('\n')[0]}
                    </span>
                    <span className="github-commit__meta">
                      <span className="github-commit__author">
                        {commit.commit.author.name}
                      </span>
                      <time
                        className="github-commit__date"
                        dateTime={commit.commit.author.date}
                      >
                        {formatDate(commit.commit.author.date, { dateStyle: 'medium' })}
                      </time>
                    </span>
                  </li>
                ))}
              </ol>
            ) : !error && (
              <p className="chart-empty">No se encontraron commits.</p>
            )}
          </section>

        </div>
      </div>
    </main>
  )
}

export default GitHubPage
