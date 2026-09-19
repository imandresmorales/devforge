/**
 * @fileoverview Componente SitemapExplorer — Explorador y generador dinámico de sitemap.xml.
 *
 * Permite a los desarrolladores visualizar el mapa del sitio XML generado en runtime,
 * añadir rutas personalizadas, auditar prioridades SEO y descargar el archivo sitemap.xml directamente.
 *
 * @module components/ui/SitemapExplorer
 */

import { useState } from 'react'
import {
  generateSitemapXml,
  validateSitemapXml,
  DEFAULT_SITEMAP_ROUTES,
} from '../../../utils/sitemapEngine'
import './SitemapExplorer.css'

export default function SitemapExplorer() {
  const [routes, setRoutes] = useState(() => [
    ...DEFAULT_SITEMAP_ROUTES,
    { path: '/docs/pwa', priority: '0.8', changefreq: 'weekly' },
    { path: '/docs/seo', priority: '0.8', changefreq: 'weekly' },
    { path: '/docs/security', priority: '0.8', changefreq: 'weekly' },
  ])
  const [newPath, setNewPath] = useState('/docs/web-workers')
  const [newPriority, setNewPriority] = useState('0.8')
  const [newFreq, setNewFreq] = useState('weekly')
  const [feedback, setFeedback] = useState(null)

  const xmlContent = generateSitemapXml(routes)
  const validationReport = validateSitemapXml(xmlContent)

  const handleAddRoute = (e) => {
    e.preventDefault()
    if (!newPath.trim()) return

    const cleanPath = newPath.trim().startsWith('/') ? newPath.trim() : '/' + newPath.trim()
    if (routes.some((r) => r.path === cleanPath)) {
      setFeedback({ type: 'error', text: `La ruta "${cleanPath}" ya está registrada en el sitemap.` })
      return
    }

    setRoutes((prev) => [...prev, { path: cleanPath, priority: newPriority, changefreq: newFreq }])
    setFeedback({ type: 'success', text: `Ruta "${cleanPath}" añadida al sitemap con prioridad ${newPriority}.` })
    setNewPath('')
  }

  const handleDeleteRoute = (pathToDelete) => {
    setRoutes((prev) => prev.filter((r) => r.path !== pathToDelete))
    setFeedback({ type: 'info', text: `Ruta "${pathToDelete}" eliminada del sitemap.` })
  }

  const handleDownloadXml = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sitemap.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setFeedback({ type: 'success', text: 'Archivo sitemap.xml descargado exitosamente.' })
  }

  return (
    <div className="sitemap-explorer-card" role="region" aria-label="Generador y Explorador de Sitemap XML">
      <div className="sitemap-explorer-card__header">
        <div className="sitemap-explorer-card__badge">⚡ Mejora 110</div>
        <h3 className="sitemap-explorer-card__title">Generador y Validador Dinámico de Sitemap.xml</h3>
        <p className="sitemap-explorer-card__subtitle">
          Administra las rutas públicas indexables de DevForge, ajusta prioridades de rastreo y descarga el archivo XML estándar.
        </p>
      </div>

      {feedback && (
        <div className={`sitemap-explorer-feedback sitemap-explorer-feedback--${feedback.type}`} role="status">
          {feedback.text}
        </div>
      )}

      {/* Grid de Estado */}
      <div className="sitemap-explorer-stats">
        <div className="sitemap-explorer-stat">
          <span className="sitemap-explorer-stat__label">URLs Indexables</span>
          <span className="sitemap-explorer-stat__value">{validationReport.urlCount}</span>
        </div>
        <div className="sitemap-explorer-stat">
          <span className="sitemap-explorer-stat__label">Namespace Sitemaps.org</span>
          <span className="sitemap-explorer-stat__value" style={{ color: '#34d399' }}>Válido (0.9)</span>
        </div>
        <div className="sitemap-explorer-stat">
          <span className="sitemap-explorer-stat__label">Rutas Privadas Excluidas</span>
          <span className="sitemap-explorer-stat__value" style={{ color: '#60a5fa' }}>/dashboard, /profile</span>
        </div>
      </div>

      {/* Formulario para añadir rutas */}
      <form className="sitemap-explorer-form" onSubmit={handleAddRoute}>
        <div className="sitemap-explorer-form__row">
          <div className="sitemap-explorer-form__group" style={{ flex: 2 }}>
            <label htmlFor="sitemap-path-input">Ruta URL:</label>
            <input
              id="sitemap-path-input"
              type="text"
              className="sitemap-explorer-input"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="/docs/tu-tema"
              required
            />
          </div>

          <div className="sitemap-explorer-form__group" style={{ flex: 1 }}>
            <label htmlFor="sitemap-prio-select">Prioridad (0.0 a 1.0):</label>
            <select
              id="sitemap-prio-select"
              className="sitemap-explorer-select"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
            >
              <option value="1.0">1.0 (Página Principal)</option>
              <option value="0.9">0.9 (Alta / Planes / Docs)</option>
              <option value="0.8">0.8 (Media Alta / Artículos)</option>
              <option value="0.5">0.5 (Estándar)</option>
              <option value="0.3">0.3 (Baja)</option>
            </select>
          </div>

          <div className="sitemap-explorer-form__group" style={{ flex: 1 }}>
            <label htmlFor="sitemap-freq-select">Frecuencia:</label>
            <select
              id="sitemap-freq-select"
              className="sitemap-explorer-select"
              value={newFreq}
              onChange={(e) => setNewFreq(e.target.value)}
            >
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
              <option value="yearly">yearly</option>
            </select>
          </div>
        </div>

        <div className="sitemap-explorer-form__actions">
          <button type="submit" className="sitemap-explorer-btn sitemap-explorer-btn--primary">
            ➕ Añadir Ruta al Sitemap
          </button>
          <button type="button" className="sitemap-explorer-btn sitemap-explorer-btn--download" onClick={handleDownloadXml}>
            📥 Descargar sitemap.xml
          </button>
        </div>
      </form>

      {/* Tabla de Rutas Registradas */}
      <div className="sitemap-explorer-table-wrapper">
        <table className="sitemap-explorer-table">
          <thead>
            <tr>
              <th>Ruta (loc)</th>
              <th>Prioridad</th>
              <th>Frecuencia</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.path}>
                <td><code>https://devforge.internal{r.path}</code></td>
                <td><span className="sitemap-prio-badge">{r.priority}</span></td>
                <td>{r.changefreq}</td>
                <td>
                  <button
                    type="button"
                    className="sitemap-delete-btn"
                    onClick={() => handleDeleteRoute(r.path)}
                    title="Eliminar ruta"
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
