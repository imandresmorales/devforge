/**
 * @fileoverview Motor de generación e inyección segura de datos estructurados JSON-LD Schema.org (Mejora 109).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Genera esquemas conformes a las directrices de Google Rich Results / Schema.org.
 * - Prevención de XSS inyectando JSON sanitizado (reemplazo de `</script>` por `<\/script>`).
 * - Gestión idempotente de scripts en `<head>` mediante identificadores únicos (`data-schema-id`).
 * - Soporte para SoftwareApplication, Course, TechArticle, BreadcrumbList y Organization.
 *
 * @module utils/schemaJsonLdEngine
 */

/**
 * Serializa de forma segura un objeto a JSON para script tags evitando inyecciones de escape HTML.
 * @param {object} data
 * @returns {string}
 */
export function safeJsonStringify(data) {
  return JSON.stringify(data, null, 2).replace(/<\/script/gi, '<\\/script')
}

/**
 * Generador de esquemas Schema.org.
 */
export const SCHEMA_BUILDERS = {
  /**
   * Esquema SoftwareApplication / WebApplication.
   */
  softwareApplication: (config = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: config.name || 'DevForge',
    applicationCategory: config.category || 'DeveloperApplication',
    operatingSystem: 'All (Web / PWA)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: config.description || 'Plataforma educativa interactiva para desarrolladores.',
    url: config.url || 'https://devforge.internal',
  }),

  /**
   * Esquema Course / Módulo de aprendizaje.
   */
  course: (config = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: config.title || 'Arquitectura Web Moderna & PWA',
    description: config.description || 'Domina Service Workers, Web Workers, IndexedDB y Ciberseguridad.',
    provider: {
      '@type': 'Organization',
      name: 'DevForge Academy',
      sameAs: 'https://devforge.internal',
    },
  }),

  /**
   * Esquema TechArticle / Documentación Técnica.
   */
  techArticle: (config = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: config.title || 'Guía de Service Workers y Resiliencia Offline',
    description: config.description || 'Implementación paso a paso de estrategias de caché y Background Sync.',
    author: {
      '@type': 'Person',
      name: config.author || 'Andres Morales',
    },
    publisher: {
      '@type': 'Organization',
      name: 'DevForge',
      logo: {
        '@type': 'ImageObject',
        url: 'https://devforge.internal/icons/icon-512.svg',
      },
    },
    datePublished: config.datePublished || '2026-09-19',
  }),

  /**
   * Esquema BreadcrumbList / Migas de pan.
   */
  breadcrumbs: (items = []) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `https://devforge.internal${item.url}`,
    })),
  }),
}

/**
 * Inyecta un script JSON-LD en el head del documento de forma idempotente.
 * @param {string} schemaId - Identificador único (ej. 'app-schema', 'breadcrumbs-schema').
 * @param {object} schemaData - Objeto Schema.org.
 * @returns {HTMLScriptElement|null}
 */
export function injectJsonLd(schemaId, schemaData) {
  if (typeof document === 'undefined' || !schemaId || !schemaData) return null

  let script = document.head.querySelector(`script[data-schema-id="${schemaId}"]`)
  if (!script) {
    script = document.createElement('script')
    script.setAttribute('type', 'application/ld+json')
    script.setAttribute('data-schema-id', schemaId)
    document.head.appendChild(script)
  }

  script.textContent = safeJsonStringify(schemaData)
  return script
}

/**
 * Elimina un esquema JSON-LD previamente inyectado.
 * @param {string} schemaId
 * @returns {boolean}
 */
export function removeJsonLd(schemaId) {
  if (typeof document === 'undefined') return false

  const script = document.head.querySelector(`script[data-schema-id="${schemaId}"]`)
  if (script && script.parentNode) {
    script.parentNode.removeChild(script)
    return true
  }
  return false
}
