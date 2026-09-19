/**
 * @fileoverview Componente SchemaJsonLdViewer — Visor e inyector interactivo de esquemas JSON-LD Schema.org.
 *
 * Permite explorar y validar los esquemas estructurados para Rich Snippets en Google (WebApplication,
 * Course, TechArticle, BreadcrumbList) e inyectarlos en tiempo real.
 *
 * @module components/ui/SchemaJsonLdViewer
 */

import { useState } from 'react'
import {
  SCHEMA_BUILDERS,
  injectJsonLd,
  safeJsonStringify,
} from '../../../utils/schemaJsonLdEngine'
import './SchemaJsonLdViewer.css'

export default function SchemaJsonLdViewer() {
  const [selectedType, setSelectedType] = useState('softwareApplication')
  const [feedback, setFeedback] = useState(null)

  const getCurrentSchema = () => {
    switch (selectedType) {
      case 'softwareApplication':
        return SCHEMA_BUILDERS.softwareApplication({
          name: 'DevForge — Developer Learning Platform',
          description: 'Plataforma educativa con más de 100 mejoras continuas para dominar el desarrollo web moderno.',
          category: 'DeveloperApplication',
        })
      case 'course':
        return SCHEMA_BUILDERS.course({
          title: 'Programa Avanzado de Desarrollo Web & Ciberseguridad',
          description: 'Aprende arquitecturas distribuidas, PWA, SEO avanzado y seguridad de la información con React 19.',
        })
      case 'techArticle':
        return SCHEMA_BUILDERS.techArticle({
          title: 'Arquitectura PWA y Estrategias de Caché con Service Workers',
          description: 'Guía técnica profunda sobre Stale-While-Revalidate, Background Sync y App Badging.',
          author: 'Andres Morales',
        })
      case 'breadcrumbs':
        return SCHEMA_BUILDERS.breadcrumbs([
          { name: 'Inicio', url: '/' },
          { name: 'Documentación', url: '/docs' },
          { name: 'SEO & Schema.org', url: '/docs/seo' },
        ])
      default:
        return {}
    }
  }

  const currentSchema = getCurrentSchema()
  const formattedJson = safeJsonStringify(currentSchema)

  const handleInject = () => {
    injectJsonLd(`schema-${selectedType}`, currentSchema)
    setFeedback({
      type: 'success',
      text: `Esquema Schema.org (${selectedType}) inyectado exitosamente como script JSON-LD en el <head>.`,
    })
  }

  return (
    <div className="schema-viewer-card" role="region" aria-label="Visor e Inyector de Datos Estructurados JSON-LD">
      <div className="schema-viewer-card__header">
        <div className="schema-viewer-card__badge">⚡ Mejora 109</div>
        <h3 className="schema-viewer-card__title">Inyector de Datos Estructurados JSON-LD (Schema.org)</h3>
        <p className="schema-viewer-card__subtitle">
          Genera e inyecta microdatos Schema.org para indexación semántica avanzada y Rich Snippets en motores de búsqueda.
        </p>
      </div>

      {feedback && (
        <div className={`schema-viewer-feedback schema-viewer-feedback--${feedback.type}`} role="status">
          {feedback.text}
        </div>
      )}

      {/* Selector de Tipo de Esquema */}
      <div className="schema-viewer-selector-bar">
        <label htmlFor="schema-type-select">Tipo de Esquema Semántico:</label>
        <div className="schema-viewer-selector-row">
          <select
            id="schema-type-select"
            className="schema-viewer-select"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value)
              setFeedback(null)
            }}
          >
            <option value="softwareApplication">WebApplication (SoftwareApplication)</option>
            <option value="course">Course (Curso Técnico)</option>
            <option value="techArticle">TechArticle (Artículo / Documentación)</option>
            <option value="breadcrumbs">BreadcrumbList (Migas de Pan)</option>
          </select>

          <button type="button" className="schema-viewer-btn schema-viewer-btn--primary" onClick={handleInject}>
            ⚡ Inyectar en Head
          </button>
        </div>
      </div>

      {/* Vista Previa del Código JSON-LD */}
      <div className="schema-viewer-code-container">
        <div className="schema-viewer-code-header">
          <span>&lt;script type="application/ld+json" data-schema-id="schema-{selectedType}"&gt;</span>
          <span className="schema-viewer-badge-tag">Schema.org / JSON-LD</span>
        </div>
        <pre className="schema-viewer-code">
          {formattedJson}
        </pre>
      </div>
    </div>
  )
}
