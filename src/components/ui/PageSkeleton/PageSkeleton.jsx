/**
 * @fileoverview PageSkeleton — skeleton loader para Suspense fallback.
 *
 * Muestra un placeholder animado mientras se carga el chunk de la página
 * con React.lazy(). El efecto shimmer es 100% CSS, sin dependencias externas.
 *
 * @module components/ui/PageSkeleton
 */
import './PageSkeleton.css'

/**
 * Skeleton loader de página completa.
 * Usado como fallback del Suspense en el lazy loading de rutas.
 *
 * @returns {JSX.Element}
 */
function PageSkeleton() {
  return (
    <div
      className="page-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Cargando página…"
    >
      <div className="container">

        {/* Simula el page-hero */}
        <div className="skeleton-block page-skeleton__badge" />
        <div className="skeleton-block page-skeleton__title" />
        <div className="skeleton-block page-skeleton__title-line2" />
        <div className="skeleton-block page-skeleton__subtitle" />
        <div className="skeleton-block page-skeleton__subtitle-line2" />

        {/* Simula el grid de cards */}
        <div className="page-skeleton__cards">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton-block page-skeleton__card" />
          ))}
        </div>

      </div>
    </div>
  )
}

export default PageSkeleton
