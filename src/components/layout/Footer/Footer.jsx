/**
 * @fileoverview Componente Footer — pie de página de la aplicación.
 *
 * Muestra: marca, descripción del proyecto, barra de progreso de las 100
 * mejoras, enlaces de navegación, tech stack y copyright.
 *
 * @module components/layout/Footer
 */
import { Link } from 'react-router-dom'
import { useTour } from '../../../context/TourContext'
import './Footer.css'

/** Mejora actual para calcular el progreso */
const CURRENT_IMPROVEMENT = 55
const TOTAL_IMPROVEMENTS = 100

/** Columnas de enlaces del footer */
const FOOTER_LINKS = [
  {
    title: 'Navegación',
    links: [
      { label: 'Inicio',     to: '/' },
      { label: 'Planes',     to: '/pricing' },
      { label: 'Docs',       to: '/docs' },
      { label: 'Dashboard',  to: '/dashboard' },
      { label: 'Contacto',   to: '/contact' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { label: 'GitHub',         href: 'https://github.com/imandresmorales/devforge' },
      { label: 'Changelog',      to: '/docs' },
      { label: 'Roadmap',        to: '/docs' },
      { label: 'Contribuir',     href: 'https://github.com/imandresmorales/devforge' },
    ],
  },
]

/** Tech stack del proyecto */
const TECH_STACK = ['React 18', 'Vite', 'CSS Tokens', 'React Router']

/**
 * Componente de pie de página.
 * @returns {JSX.Element}
 */
function Footer({ onOpenFeedback }) {
  const { resetTour } = useTour()
  const progressPercent = Math.round(
    (CURRENT_IMPROVEMENT / TOTAL_IMPROVEMENTS) * 100
  )
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">

        {/* ── Grid principal ── */}
        <div className="footer__grid">

          {/* Columna de marca */}
          <div className="footer__brand">
            <div className="footer__brand-name" aria-label="DevForge">
              <span aria-hidden="true">⚡</span>
              DevForge
            </div>
            <p className="footer__brand-desc">
              Plataforma educativa e interactiva para informáticos. Aprende
              React, Next.js, TypeScript, pagos, seguridad y mucho más —
              paso a paso, con 100 mejoras planificadas.
            </p>

            {/* Barra de progreso de mejoras */}
            <div className="footer__progress" role="group" aria-label="Progreso del roadmap">
              <p className="footer__progress-label">
                Progreso: {CURRENT_IMPROVEMENT} / {TOTAL_IMPROVEMENTS} mejoras
                ({progressPercent}%)
              </p>
              <div
                className="footer__progress-bar-track"
                role="progressbar"
                aria-valuenow={CURRENT_IMPROVEMENT}
                aria-valuemin={0}
                aria-valuemax={TOTAL_IMPROVEMENTS}
                aria-label="Progreso de implementación"
              >
                <div
                  className="footer__progress-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Columnas de enlaces */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <h2 className="footer__col-title">{col.title}</h2>
              <ul className="footer__links" role="list">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className="footer__link">
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="footer__link"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${link.label} (abre en nueva pestaña)`}
                      >
                        {link.label} ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © {currentYear} Andres Morales — DevForge. MIT License.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="footer__tour-btn"
              onClick={resetTour}
              title="Reiniciar el tour guiado interactivo"
            >
              🚀 Tour
            </button>
            <button
              type="button"
              className="footer__tour-btn"
              onClick={onOpenFeedback}
              title="Calificar el proyecto DevForge"
            >
              ⭐ Calificar
            </button>
          </div>

          <div className="footer__tech-stack" aria-label="Tecnologías utilizadas">
            {TECH_STACK.map((tech) => (
              <span key={tech} className="footer__tech-badge">
                {tech}
              </span>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer
