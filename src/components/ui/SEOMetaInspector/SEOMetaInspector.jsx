/**
 * @fileoverview Componente SEOMetaInspector — Inspector y previsualizador de OpenGraph y Twitter Cards en vivo.
 *
 * Permite a los desarrolladores simular y auditar cómo se verán los metadatos SEO al compartir la página
 * en redes sociales (Facebook, Twitter / X, LinkedIn, Discord, Slack) y motores de búsqueda.
 *
 * @module components/ui/SEOMetaInspector
 */

import { useState } from 'react'
import { applySeoMetadata, DEFAULT_SEO_CONFIG } from '../../../utils/seoEngine'
import './SEOMetaInspector.css'

export default function SEOMetaInspector() {
  const [title, setTitle] = useState('DevForge — Master Full-Stack & Ciberseguridad')
  const [description, setDescription] = useState('Plataforma educativa con 100+ mejoras interactivas para dominar React 19, PWA, SEO, Web Workers y arquitecturas distribuidas.')
  const [canonical, setCanonical] = useState('/docs')
  const [image, setImage] = useState(DEFAULT_SEO_CONFIG.defaultImage)
  const [robots, setRobots] = useState('index, follow')
  const [activeTab, setActiveTab] = useState('google')
  const [feedback, setFeedback] = useState(null)

  const handleApplyToDocument = () => {
    applySeoMetadata({ title, description, canonical, image, robots })
    setFeedback({ type: 'success', text: '¡Metadatos SEO y etiquetas OpenGraph / Twitter inyectados en el <head> del documento!' })
  }

  return (
    <div className="seo-inspector-card" role="region" aria-label="Inspector de Meta Tags SEO y OpenGraph">
      <div className="seo-inspector-card__header">
        <div className="seo-inspector-card__badge">⚡ Mejora 108</div>
        <h3 className="seo-inspector-card__title">Gestor Dinámico de Meta Tags SEO & Social Graph</h3>
        <p className="seo-inspector-card__subtitle">
          Edita y previsualiza en tiempo real las tarjetas de previsualización en Google Search, OpenGraph y Twitter Cards.
        </p>
      </div>

      {feedback && (
        <div className={`seo-inspector-feedback seo-inspector-feedback--${feedback.type}`} role="status">
          {feedback.text}
        </div>
      )}

      {/* Formulario de Edición */}
      <div className="seo-inspector-form">
        <div className="seo-inspector-form__row">
          <div className="seo-inspector-form__group" style={{ flex: 2 }}>
            <label htmlFor="seo-title-input">Título SEO (og:title / twitter:title):</label>
            <input
              id="seo-title-input"
              type="text"
              className="seo-inspector-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="seo-inspector-form__group" style={{ flex: 1 }}>
            <label htmlFor="seo-robots-select">Directiva Robots:</label>
            <select
              id="seo-robots-select"
              className="seo-inspector-select"
              value={robots}
              onChange={(e) => setRobots(e.target.value)}
            >
              <option value="index, follow">index, follow (Pública)</option>
              <option value="noindex, follow">noindex, follow (Oculta pero rastreable)</option>
              <option value="noindex, nofollow">noindex, nofollow (Privada/Admin)</option>
            </select>
          </div>
        </div>

        <div className="seo-inspector-form__group">
          <label htmlFor="seo-desc-input">Meta Descripción (Recomendado: 120-160 caracteres):</label>
          <textarea
            id="seo-desc-input"
            className="seo-inspector-textarea"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <span className="seo-inspector-char-count">
            {description.length} caracteres ({description.length >= 120 && description.length <= 160 ? '🟢 Óptimo' : '🟡 Ajustar'})
          </span>
        </div>

        <div className="seo-inspector-form__row">
          <div className="seo-inspector-form__group" style={{ flex: 1 }}>
            <label htmlFor="seo-canonical-input">Canonical Path / URL:</label>
            <input
              id="seo-canonical-input"
              type="text"
              className="seo-inspector-input"
              value={canonical}
              onChange={(e) => setCanonical(e.target.value)}
            />
          </div>

          <div className="seo-inspector-form__group" style={{ flex: 1 }}>
            <label htmlFor="seo-image-input">og:image URL:</label>
            <input
              id="seo-image-input"
              type="text"
              className="seo-inspector-input"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="seo-inspector-btn seo-inspector-btn--primary"
          onClick={handleApplyToDocument}
        >
          🚀 Aplicar Meta Tags al Documento Real
        </button>
      </div>

      {/* Pestañas de Previsualización */}
      <div className="seo-inspector-tabs" role="tablist">
        <button
          type="button"
          className={`seo-inspector-tab ${activeTab === 'google' ? 'seo-inspector-tab--active' : ''}`}
          onClick={() => setActiveTab('google')}
          role="tab"
          aria-selected={activeTab === 'google'}
        >
          🔍 Google Search SERP
        </button>
        <button
          type="button"
          className={`seo-inspector-tab ${activeTab === 'opengraph' ? 'seo-inspector-tab--active' : ''}`}
          onClick={() => setActiveTab('opengraph')}
          role="tab"
          aria-selected={activeTab === 'opengraph'}
        >
          📱 OpenGraph (Facebook / Slack)
        </button>
        <button
          type="button"
          className={`seo-inspector-tab ${activeTab === 'twitter' ? 'seo-inspector-tab--active' : ''}`}
          onClick={() => setActiveTab('twitter')}
          role="tab"
          aria-selected={activeTab === 'twitter'}
        >
          🐦 Twitter Card
        </button>
      </div>

      {/* Previsualizadores */}
      <div className="seo-inspector-preview-box">
        {activeTab === 'google' && (
          <div className="seo-preview-google">
            <div className="seo-preview-google__site">
              <span className="seo-preview-google__favicon">⚡</span>
              <span>devforge.internal</span>
              <span className="seo-preview-google__url">› {canonical.replace(/^\//, '')}</span>
            </div>
            <h4 className="seo-preview-google__title">{title} | DevForge</h4>
            <p className="seo-preview-google__desc">{description}</p>
          </div>
        )}

        {activeTab === 'opengraph' && (
          <div className="seo-preview-og">
            <div className="seo-preview-og__image-placeholder">
              <span>🖼️ {image}</span>
            </div>
            <div className="seo-preview-og__body">
              <span className="seo-preview-og__domain">DEVFORGE.INTERNAL</span>
              <h4 className="seo-preview-og__title">{title}</h4>
              <p className="seo-preview-og__desc">{description}</p>
            </div>
          </div>
        )}

        {activeTab === 'twitter' && (
          <div className="seo-preview-twitter">
            <div className="seo-preview-twitter__image-placeholder">
              <span>🖼️ Twitter Large Image Card</span>
            </div>
            <div className="seo-preview-twitter__body">
              <h4 className="seo-preview-twitter__title">{title}</h4>
              <p className="seo-preview-twitter__desc">{description}</p>
              <span className="seo-preview-twitter__domain">🔗 devforge.internal</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
