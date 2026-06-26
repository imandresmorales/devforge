/**
 * @fileoverview Página de inicio — placeholder para Mejora 4.
 * El Hero completo con animaciones se implementa en la Mejora 4.
 * @module pages/HomePage
 */

function HomePage() {
  return (
    <main id="main-content" className="page-main">
      <div className="container">
        <section className="page-hero" aria-labelledby="home-title">
          <span className="badge badge--brand">🚀 Mejora 3 — React Router activo</span>
          <h1 id="home-title">
            Bienvenido a <span className="text-gradient">DevForge</span>
          </h1>
          <p>
            La plataforma para informáticos que quieren dominar el desarrollo
            web moderno. El Hero completo con animaciones llega en la{' '}
            <strong>Mejora 4</strong>.
          </p>
        </section>
      </div>
    </main>
  )
}

export default HomePage
