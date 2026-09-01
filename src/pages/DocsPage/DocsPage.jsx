/**
 * @fileoverview Página de documentación — referencia de mejoras implementadas.
 * @module pages/DocsPage
 */
import FetchDemo from '../../components/ui/FetchDemo/FetchDemo.jsx'
import CodePlayground from '../../components/ui/CodePlayground/CodePlayground.jsx'
import RegexTester from '../../components/ui/RegexTester/RegexTester.jsx'
import WebSocketLiveDemo from '../../components/ui/WebSocketLiveDemo/WebSocketLiveDemo.jsx'
import ProjectTreeGenerator from '../../components/ui/ProjectTreeGenerator/ProjectTreeGenerator.jsx'

/** Lista de mejoras completadas */
const COMPLETED = [
  { num: 1,  title: 'Scaffolding inicial',                 desc: 'Estructura de carpetas, .gitignore, README, .env.example' },
  { num: 2,  title: 'Design tokens CSS',                   desc: 'variables.css, reset.css, utilities.css — paleta HSL, tipografía, espaciado' },
  { num: 3,  title: 'Layout base y React Router',          desc: 'Header, Footer, rutas /, /about, /docs, /dashboard, /contact, 404' },
  { num: 4,  title: 'Hero Section con animaciones',        desc: 'Keyframes, botones CTA, diseño visual premium, responsive' },
  { num: 5,  title: 'Dark Mode con useTheme',              desc: 'Toggle dark/light, localStorage, CSS variables, sin dependencias' },
  { num: 6,  title: 'Formulario controlado',               desc: 'Validación en tiempo real, aria-live, mensajes de error accesibles' },
  { num: 7,  title: 'Hook useFetch con AbortController',   desc: 'Peticiones HTTP con loading/error/data, cancelación correcta' },
  { num: 8,  title: 'Context API — Estado global usuario', desc: 'UserContext + useReducer para autenticación y estado global' },
  { num: 9,  title: 'Tabla dinámica DataTable',            desc: 'Paginación, ordenación por columna y búsqueda integrada' },
  { num: 10, title: 'Lazy loading y Code Splitting',       desc: 'React.lazy + Suspense para optimización de bundles JS' },
  { num: 11, title: 'Error Boundaries',                    desc: 'Captura y aislamiento de errores de renderizado en React' },
  { num: 12, title: 'Accesibilidad (a11y)',                desc: 'Skip-links, WAI-ARIA, soporte teclado y hoja a11y.css' },
  { num: 13, title: 'Internacionalización (i18n)',         desc: 'i18next + react-i18next con soporte Español/Inglés' },
  { num: 14, title: 'Testing unitario con Vitest',         desc: 'Vitest + React Testing Library y suite de pruebas automatizada' },
  { num: 15, title: 'Seguridad Web I (DOMPurify & CSP)',   desc: 'Sanitización estricta XSS con DOMPurify y cabeceras CSP' },
  { num: 16, title: 'Hook useLocalStorage seguro',         desc: 'Manejo de errores, cuota y sincronización en tiempo real entre pestañas' },
  { num: 17, title: 'Notificaciones Toast accesibles',     desc: 'ToastContext global, animaciones CSS y soporte aria-live' },
  { num: 18, title: 'Componente Modal accesible',          desc: 'Renderizado con createPortal, focus trap y atajos de teclado (Esc)' },
  { num: 19, title: 'Exportación CSV defensiva',           desc: 'Protección contra inyección de fórmulas CSV y descarga directa' },
  { num: 20, title: 'Página de Perfil y Medidor 2FA',      desc: 'Vista /profile, medidor de fuerza de contraseñas y simulación 2FA' },
]

/** Lista de próximas mejoras */
const UPCOMING = [
  { num: 21, title: 'Storybook — Documentación interactiva de componentes' },
  { num: 22, title: 'Middleware de Autenticación y Rutas Protegidas' },
  { num: 23, title: 'Infinite Scroll con Intersection Observer' },
  { num: 24, title: 'Drag and Drop accesible para gestión de listas' },
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

        {/* Live Code Playground interactivo — Mejora 35 */}
        <CodePlayground />

        {/* Regex Tester interactivo en vivo — Mejora 43 */}
        <RegexTester />

        {/* Cliente WebSocket en vivo — Mejora 46 */}
        <WebSocketLiveDemo />

        {/* Generador de Árboles ASCII — Mejora 47 */}
        <ProjectTreeGenerator />

      </div>
    </main>
  )
}

export default DocsPage
