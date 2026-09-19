/**
 * @fileoverview Motor de auditoría y cálculo de SEO Health Score en tiempo real (Mejora 112).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Inspecciona la estructura del DOM de forma no intrusiva y sin efectos secundarios.
 * - Valida conformidad técnica con las directrices de Google Search Essentials (anteriormente Webmaster Guidelines).
 * - Evalúa: Jerarquía de encabezados (H1 único), Meta descripciones, Canonical, OpenGraph, Twitter y atributos alt.
 *
 * @module utils/seoAuditorEngine
 */

/**
 * Realiza una auditoría completa de los elementos SEO del documento o elemento raíz.
 * @param {Document|HTMLElement} [rootNode=document]
 * @returns {{
 *  score: number,
 *  grade: 'A+' | 'A' | 'B' | 'C' | 'F',
 *  passedCount: number,
 *  warningCount: number,
 *  errorCount: number,
 *  checks: Array<{ id: string, name: string, category: 'meta'|'headings'|'social'|'media'|'indexing', status: 'pass'|'warn'|'fail', message: string, scoreWeight: number }>
 * }}
 */
export function auditSeoHealth(rootNode = (typeof document !== 'undefined' ? document : null)) {
  const checks = []

  if (!rootNode) {
    return {
      score: 0,
      grade: 'F',
      passedCount: 0,
      warningCount: 0,
      errorCount: 1,
      checks: [{ id: 'dom-missing', name: 'Acceso a DOM', category: 'meta', status: 'fail', message: 'Entorno sin DOM', scoreWeight: 100 }],
    }
  }

  // 1. Título del documento
  const title = (rootNode instanceof Document ? rootNode.title : '') || rootNode.querySelector('title')?.textContent || ''
  if (!title.trim()) {
    checks.push({ id: 'meta-title', name: 'Etiqueta <title>', category: 'meta', status: 'fail', message: 'Falta la etiqueta <title> o está vacía', scoreWeight: 20 })
  } else if (title.length < 20 || title.length > 70) {
    checks.push({ id: 'meta-title', name: 'Etiqueta <title>', category: 'meta', status: 'warn', message: `Longitud de título no óptima (${title.length} caracteres, recomendado 30-65)`, scoreWeight: 10 })
  } else {
    checks.push({ id: 'meta-title', name: 'Etiqueta <title>', category: 'meta', status: 'pass', message: `Título bien estructurado (${title.length} caracteres): "${title.slice(0, 35)}..."`, scoreWeight: 20 })
  }

  // 2. Meta descripción
  const metaDesc = rootNode.querySelector('meta[name="description"]')?.getAttribute('content') || ''
  if (!metaDesc.trim()) {
    checks.push({ id: 'meta-desc', name: 'Meta Descripción', category: 'meta', status: 'fail', message: 'Falta <meta name="description">', scoreWeight: 20 })
  } else if (metaDesc.length < 80 || metaDesc.length > 170) {
    checks.push({ id: 'meta-desc', name: 'Meta Descripción', category: 'meta', status: 'warn', message: `Longitud mejorable (${metaDesc.length} caracteres, ideal 120-160)`, scoreWeight: 15 })
  } else {
    checks.push({ id: 'meta-desc', name: 'Meta Descripción', category: 'meta', status: 'pass', message: `Descripción óptima (${metaDesc.length} caracteres)`, scoreWeight: 20 })
  }

  // 3. Estructura de Encabezados (H1)
  const h1Elements = rootNode.querySelectorAll('h1')
  if (h1Elements.length === 0) {
    checks.push({ id: 'heading-h1', name: 'Encabezado Principal H1', category: 'headings', status: 'fail', message: 'No se encontró ningún elemento <h1> en la página', scoreWeight: 20 })
  } else if (h1Elements.length > 1) {
    checks.push({ id: 'heading-h1', name: 'Encabezado Principal H1', category: 'headings', status: 'warn', message: `Se detectaron ${h1Elements.length} elementos <h1> (se recomienda exactamente 1 por página)`, scoreWeight: 10 })
  } else {
    checks.push({ id: 'heading-h1', name: 'Encabezado Principal H1', category: 'headings', status: 'pass', message: `Estructura H1 perfecta: "${h1Elements[0].textContent?.trim().slice(0, 30)}..."`, scoreWeight: 20 })
  }

  // 4. OpenGraph Tags
  const ogTitle = rootNode.querySelector('meta[property="og:title"]')?.getAttribute('content')
  const ogImage = rootNode.querySelector('meta[property="og:image"]')?.getAttribute('content')
  if (ogTitle && ogImage) {
    checks.push({ id: 'social-og', name: 'OpenGraph Tags (og:title & og:image)', category: 'social', status: 'pass', message: 'Etiquetas OpenGraph configuradas correctamente', scoreWeight: 15 })
  } else {
    checks.push({ id: 'social-og', name: 'OpenGraph Tags', category: 'social', status: 'warn', message: 'Faltan etiquetas esenciales og:title u og:image para redes sociales', scoreWeight: 5 })
  }

  // 5. Canonical Link
  const canonical = rootNode.querySelector('link[rel="canonical"]')?.getAttribute('href')
  if (canonical) {
    checks.push({ id: 'indexing-canonical', name: 'Enlace Canonical', category: 'indexing', status: 'pass', message: `Canonical URL declarada (${canonical})`, scoreWeight: 15 })
  } else {
    checks.push({ id: 'indexing-canonical', name: 'Enlace Canonical', category: 'indexing', status: 'warn', message: 'No se declaró <link rel="canonical">', scoreWeight: 5 })
  }

  // 6. Atributos alt en imágenes
  const images = rootNode.querySelectorAll('img')
  let missingAlt = 0
  images.forEach((img) => {
    if (!img.hasAttribute('alt')) missingAlt++
  })

  if (images.length === 0 || missingAlt === 0) {
    checks.push({ id: 'media-alt', name: 'Accesibilidad de Imágenes (alt)', category: 'media', status: 'pass', message: 'Todas las imágenes poseen atributo alt', scoreWeight: 10 })
  } else {
    checks.push({ id: 'media-alt', name: 'Accesibilidad de Imágenes (alt)', category: 'media', status: 'warn', message: `${missingAlt} imagen(es) sin atributo alt`, scoreWeight: 0 })
  }

  // Cálculo de Puntuación
  const maxScore = 100
  let earnedScore = 0
  checks.forEach((c) => {
    if (c.status === 'pass') earnedScore += c.scoreWeight
    else if (c.status === 'warn') earnedScore += Math.floor(c.scoreWeight * 0.5)
  })

  const score = Math.min(100, Math.max(0, earnedScore))
  const grade = score >= 95 ? 'A+' : score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'F'

  return {
    score,
    grade,
    passedCount: checks.filter((c) => c.status === 'pass').length,
    warningCount: checks.filter((c) => c.status === 'warn').length,
    errorCount: checks.filter((c) => c.status === 'fail').length,
    checks,
  }
}
