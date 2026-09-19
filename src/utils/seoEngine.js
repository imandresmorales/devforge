/**
 * @fileoverview Motor de gestión e inyección dinámica de Meta Tags SEO, OpenGraph y Twitter Cards (Mejora 108).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Sanitización de todos los atributos y contenidos meta para prevenir inyección de código.
 * - Gestión idempotente de etiquetas `<meta>` y `<link rel="canonical">` sin duplicación.
 * - Generación automática de OpenGraph (og:title, og:desc, og:image, og:url) y Twitter Cards.
 * - Soporte para directivas de robots por vista ('index, follow' vs 'noindex, nofollow').
 *
 * @module utils/seoEngine
 */

/**
 * Configuración por defecto para DevForge.
 */
export const DEFAULT_SEO_CONFIG = {
  siteName: 'DevForge',
  domain: 'https://devforge.internal',
  defaultTitle: 'DevForge — Plataforma para Desarrolladores',
  defaultDescription: 'Plataforma educativa e interactiva con mejoras continuas para dominar el stack moderno de desarrollo web y ciberseguridad.',
  defaultImage: 'https://devforge.internal/icons/icon-512.svg',
  defaultRobots: 'index, follow',
}

/**
 * Sanitiza texto para contenido de meta tags.
 * @param {string} text
 * @returns {string}
 */
export function sanitizeMetaContent(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/<[^>]*>?/gm, '')
    .replace(/["\r\n\t]/g, ' ')
    .trim()
}

/**
 * Actualiza o crea una etiqueta <meta> en el <head> del documento.
 * @param {string} attributeName - 'name' o 'property'
 * @param {string} attributeValue - ej. 'description', 'og:title'
 * @param {string} content - Contenido del meta tag
 */
export function setMetaTag(attributeName, attributeValue, content) {
  if (typeof document === 'undefined') return

  const safeContent = sanitizeMetaContent(content)
  let element = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attributeName, attributeValue)
    document.head.appendChild(element)
  }

  element.setAttribute('content', safeContent)
}

/**
 * Actualiza o crea la etiqueta <link rel="canonical"> en el documento.
 * @param {string} urlString
 */
export function setCanonicalUrl(urlString) {
  if (typeof document === 'undefined') return

  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }

  try {
    const validUrl = new URL(urlString, DEFAULT_SEO_CONFIG.domain).href
    link.setAttribute('href', validUrl)
  } catch {
    link.setAttribute('href', DEFAULT_SEO_CONFIG.domain)
  }
}

/**
 * Aplica un conjunto completo de metadatos SEO al documento.
 * @param {{
 *  title?: string,
 *  description?: string,
 *  canonical?: string,
 *  image?: string,
 *  type?: string,
 *  robots?: string,
 *  keywords?: string,
 * }} metaConfig
 */
export function applySeoMetadata(metaConfig = {}) {
  const title = metaConfig.title
    ? `${sanitizeMetaContent(metaConfig.title)} | ${DEFAULT_SEO_CONFIG.siteName}`
    : DEFAULT_SEO_CONFIG.defaultTitle
  const description = metaConfig.description || DEFAULT_SEO_CONFIG.defaultDescription
  const image = metaConfig.image || DEFAULT_SEO_CONFIG.defaultImage
  const canonical = metaConfig.canonical || (typeof window !== 'undefined' ? window.location.pathname : '/')
  const fullCanonicalUrl = canonical.startsWith('http') ? canonical : `${DEFAULT_SEO_CONFIG.domain}${canonical}`
  const robots = metaConfig.robots || DEFAULT_SEO_CONFIG.defaultRobots
  const type = metaConfig.type || 'website'

  if (typeof document !== 'undefined') {
    document.title = title
  }

  // Standard Meta Tags
  setMetaTag('name', 'description', description)
  setMetaTag('name', 'robots', robots)
  if (metaConfig.keywords) {
    setMetaTag('name', 'keywords', metaConfig.keywords)
  }

  // OpenGraph (Facebook / LinkedIn / Slack)
  setMetaTag('property', 'og:site_name', DEFAULT_SEO_CONFIG.siteName)
  setMetaTag('property', 'og:title', title)
  setMetaTag('property', 'og:description', description)
  setMetaTag('property', 'og:image', image)
  setMetaTag('property', 'og:url', fullCanonicalUrl)
  setMetaTag('property', 'og:type', type)

  // Twitter Cards
  setMetaTag('name', 'twitter:card', 'summary_large_image')
  setMetaTag('name', 'twitter:title', title)
  setMetaTag('name', 'twitter:description', description)
  setMetaTag('name', 'twitter:image', image)

  // Canonical Link
  setCanonicalUrl(fullCanonicalUrl)

  return {
    title,
    description,
    image,
    canonical: fullCanonicalUrl,
    robots,
    type,
  }
}
