/**
 * @fileoverview Página 404 — ruta no encontrada.
 * @module pages/NotFoundPage
 */
import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main
      id="main-content"
      className="page-main"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
    >
      <div className="container" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }} aria-hidden="true">
          🔍
        </div>
        <h1
          style={{
            fontSize: 'clamp(var(--text-3xl), 8vw, var(--text-5xl))',
            fontWeight: 'var(--font-extrabold)',
            background: 'var(--gradient-brand)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 'var(--space-4)',
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Página no encontrada
        </h2>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-8)',
            lineHeight: 'var(--leading-relaxed)',
          }}
        >
          La ruta que buscas no existe. Puede que haya sido movida,
          eliminada o que hayas escrito mal la URL.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--gradient-brand)',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-sm)',
            transition: 'opacity var(--transition-fast), transform var(--transition-fast)',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          ← Volver al inicio
        </Link>
      </div>
    </main>
  )
}

export default NotFoundPage
