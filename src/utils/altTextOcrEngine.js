/**
 * @fileoverview Motor de Análisis Semántico de Imágenes y Generación de Textos Alternativos WCAG 1.1.1 AAA (Mejora 117).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Cumple con WCAG 2.1 Criterio 1.1.1 (Contenido no textual).
 * - Identifica imágenes decorativas vs informativas.
 * - Detecta patrones no conformes (ej: "foto de", "imagen.png", textos redundantes o excesivamente cortos).
 * - Provee sugerencias semánticas automáticas basadas en contexto y nombre de archivo.
 *
 * @module utils/altTextOcrEngine
 */

const REDUNDANT_WORDS = ['foto de', 'imagen de', 'picture of', 'image of', 'graphic of', 'captura de']

/**
 * Evalúa la calidad y conformidad WCAG de un texto alternativo.
 * @param {string} altText
 * @param {boolean} [isDecorative=false]
 * @returns {{
 *  valid: boolean,
 *  isDecorative: boolean,
 *  score: number,
 *  quality: 'perfect' | 'good' | 'warning' | 'error',
 *  issues: string[]
 * }}
 */
export function evaluateAltText(altText = '', isDecorative = false) {
  const issues = []

  if (isDecorative) {
    return {
      valid: true,
      isDecorative: true,
      score: 100,
      quality: 'perfect',
      issues: [],
    }
  }

  const clean = (altText || '').trim()

  if (!clean) {
    return {
      valid: false,
      isDecorative: false,
      score: 0,
      quality: 'error',
      issues: ['Falta el atributo alt o está vacío en una imagen informativa.'],
    }
  }

  if (clean.length < 5) {
    issues.push('El texto alternativo es demasiado breve para ser descriptivo.')
  }

  if (clean.length > 150) {
    issues.push('El texto alternativo es excesivamente largo (>150 caracteres); considera usar un aria-describedby.')
  }

  const lower = clean.toLowerCase()
  for (const word of REDUNDANT_WORDS) {
    if (lower.startsWith(word)) {
      issues.push(`Evita usar frases redundantes como "${word}" (los lectores de pantalla ya anuncian que es una imagen).`)
      break
    }
  }

  if (/\.(png|jpe?g|svg|webp|gif)$/i.test(clean)) {
    issues.push('El texto alternativo parece ser un nombre de archivo, no una descripción.')
  }

  let score = 100 - issues.length * 25
  score = Math.max(0, Math.min(100, score))

  const quality = score >= 90 ? 'perfect' : score >= 60 ? 'good' : score > 0 ? 'warning' : 'error'

  return {
    valid: issues.length === 0,
    isDecorative: false,
    score,
    quality,
    issues,
  }
}

/**
 * Genera una sugerencia semántica de texto alternativo a partir de contexto y metadatos.
 * @param {string} fileName
 * @param {string} [context='']
 * @returns {string}
 */
export function generateSuggestedAlt(fileName = '', context = '') {
  const baseName = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim()

  if (!baseName && !context) {
    return 'Elemento gráfico ilustrativo del sistema'
  }

  if (context.trim()) {
    return `${baseName ? baseName + ': ' : ''}${context.trim()}`
  }

  return baseName.charAt(0).toUpperCase() + baseName.slice(1)
}
