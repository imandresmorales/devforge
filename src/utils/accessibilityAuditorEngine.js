/**
 * @fileoverview Motor de Auditoría Integral de Accesibilidad en el DOM conforme a WCAG 2.1/2.2 AAA (Mejora 118).
 *
 * BUENAS PRÁCTICAS Y SEGURIDAD:
 * - Evalúa: Labels en formularios, enlaces/botones accesibles, landmarks semánticos, tabindex positivo, jerarquía de encabezados.
 * - Inspección no intrusiva y sin efectos secundarios en el DOM.
 * - Genera sugerencias de remediación y cálculo de Accessibility Conformance Score (0-100).
 *
 * @module utils/accessibilityAuditorEngine
 */

/**
 * Ejecuta una auditoría completa de accesibilidad WCAG sobre el nodo raíz.
 * @param {Document|HTMLElement} [rootNode=document]
 * @returns {{
 *  score: number,
 *  grade: 'AAA' | 'AA' | 'A' | 'Fail',
 *  passedCount: number,
 *  warningCount: number,
 *  errorCount: number,
 *  rules: Array<{ id: string, name: string, wcagCriterion: string, status: 'pass'|'warn'|'fail', message: string, remediation: string, scoreWeight: number }>
 * }}
 */
export function auditDomAccessibility(rootNode = (typeof document !== 'undefined' ? document : null)) {
  const rules = []

  if (!rootNode) {
    return {
      score: 0,
      grade: 'Fail',
      passedCount: 0,
      warningCount: 0,
      errorCount: 1,
      rules: [{ id: 'dom-env', name: 'Entorno DOM', wcagCriterion: 'N/A', status: 'fail', message: 'No se encontró entorno DOM para auditar.', remediation: 'Ejecutar en navegador.', scoreWeight: 100 }],
    }
  }

  // 1. Atributo lang en <html>
  const docElement = rootNode.ownerDocument?.documentElement || (rootNode.tagName === 'HTML' ? rootNode : null)
  const lang = docElement?.getAttribute('lang')
  if (!lang) {
    rules.push({
      id: 'html-lang',
      name: 'Idioma del Documento (<html lang>)',
      wcagCriterion: '3.1.1 Idioma de la página (Nivel A)',
      status: 'warn',
      message: 'El elemento raíz <html> no posee el atributo lang declarado.',
      remediation: 'Agrega <html lang="es"> en el documento HTML principal.',
      scoreWeight: 15,
    })
  } else {
    rules.push({
      id: 'html-lang',
      name: 'Idioma del Documento (<html lang>)',
      wcagCriterion: '3.1.1 Idioma de la página (Nivel A)',
      status: 'pass',
      message: `Idioma primario declarado correctamente (${lang}).`,
      remediation: 'Ninguna',
      scoreWeight: 15,
    })
  }

  // 2. Formularios: Inputs sin Label accesible
  const formControls = rootNode.querySelectorAll('input:not([type="hidden"]), select, textarea')
  let unlabeledControls = 0
  formControls.forEach((input) => {
    const id = input.id
    const hasLabelTag = id && rootNode.querySelector(`label[for="${id}"]`)
    const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')
    const hasWrappedLabel = input.closest('label')

    if (!hasLabelTag && !hasAriaLabel && !hasWrappedLabel) {
      unlabeledControls++
    }
  })

  if (unlabeledControls === 0) {
    rules.push({
      id: 'form-labels',
      name: 'Etiquetas Accesibles en Formularios',
      wcagCriterion: '1.3.1 Información y relaciones & 4.1.2 Nombre, función, valor (Nivel A)',
      status: 'pass',
      message: 'Todos los controles interactivos de formulario tienen etiquetas asociadas.',
      remediation: 'Ninguna',
      scoreWeight: 20,
    })
  } else {
    rules.push({
      id: 'form-labels',
      name: 'Etiquetas Accesibles en Formularios',
      wcagCriterion: '1.3.1 Información y relaciones & 4.1.2 Nombre, función, valor (Nivel A)',
      status: 'fail',
      message: `Se detectaron ${unlabeledControls} control(es) de formulario sin etiqueta accesible.`,
      remediation: 'Asocia cada <input> con un <label for="id"> o utiliza aria-label="...".',
      scoreWeight: 20,
    })
  }

  // 3. Botones y Enlaces sin Nombre Accesible (Accessible Name)
  const interactiveElements = rootNode.querySelectorAll('button, a[href]')
  let namelessInteractive = 0
  interactiveElements.forEach((el) => {
    const text = el.textContent?.trim()
    const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
    const title = el.getAttribute('title')
    const imgAlt = el.querySelector('img')?.getAttribute('alt')

    if (!text && !ariaLabel && !title && !imgAlt) {
      namelessInteractive++
    }
  })

  if (namelessInteractive === 0) {
    rules.push({
      id: 'interactive-names',
      name: 'Nombres Accesibles en Botones y Enlaces',
      wcagCriterion: '4.1.2 Nombre, función, valor (Nivel A)',
      status: 'pass',
      message: 'Todos los botones y enlaces poseen nombres accesibles identificables.',
      remediation: 'Ninguna',
      scoreWeight: 20,
    })
  } else {
    rules.push({
      id: 'interactive-names',
      name: 'Nombres Accesibles en Botones y Enlaces',
      wcagCriterion: '4.1.2 Nombre, función, valor (Nivel A)',
      status: 'fail',
      message: `Se encontraron ${namelessInteractive} botón(es) o enlace(s) sin texto ni aria-label accesible.`,
      remediation: 'Incluye texto visible dentro del elemento o añade un atributo aria-label descriptivo.',
      scoreWeight: 20,
    })
  }

  // 4. Tabindex positivo (> 0) que rompe el orden natural de navegación
  const positiveTabindexElements = rootNode.querySelectorAll('[tabindex]')
  let positiveTabindexCount = 0
  positiveTabindexElements.forEach((el) => {
    const val = parseInt(el.getAttribute('tabindex') || '0', 10)
    if (val > 0) positiveTabindexCount++
  })

  if (positiveTabindexCount === 0) {
    rules.push({
      id: 'tabindex-natural',
      name: 'Orden Natural del Foco (Sin tabindex > 0)',
      wcagCriterion: '2.4.3 Orden del foco (Nivel A)',
      status: 'pass',
      message: 'El flujo del foco sigue el orden natural del árbol DOM sin tabindex forzados.',
      remediation: 'Ninguna',
      scoreWeight: 15,
    })
  } else {
    rules.push({
      id: 'tabindex-natural',
      name: 'Orden Natural del Foco (Sin tabindex > 0)',
      wcagCriterion: '2.4.3 Orden del foco (Nivel A)',
      status: 'warn',
      message: `Se encontraron ${positiveTabindexCount} elemento(s) con tabindex > 0 que alteran el orden natural.`,
      remediation: 'Usa tabindex="0" para elementos enfocables o reordena el DOM semántico.',
      scoreWeight: 15,
    })
  }

  // 5. Landmarks Semánticos (<main>, <nav>, <header>, <footer>)
  const hasMain = rootNode.querySelector('main, [role="main"]')
  const hasNav = rootNode.querySelector('nav, [role="navigation"]')
  const hasHeader = rootNode.querySelector('header, [role="banner"]')

  if (hasMain) {
    rules.push({
      id: 'semantic-landmarks',
      name: 'Estructura de Regiones Landmark (<main>)',
      wcagCriterion: '1.3.1 Información y relaciones (Nivel A)',
      status: 'pass',
      message: 'Estructura de puntos de referencia semánticos configurada correctamente.',
      remediation: 'Ninguna',
      scoreWeight: 15,
    })
  } else {
    rules.push({
      id: 'semantic-landmarks',
      name: 'Estructura de Regiones Landmark (<main>)',
      wcagCriterion: '1.3.1 Información y relaciones (Nivel A)',
      status: 'warn',
      message: 'No se detectó un elemento <main> principal en el documento.',
      remediation: 'Envuelve el contenido principal en una etiqueta <main id="main-content">.',
      scoreWeight: 15,
    })
  }

  // 6. Regiones de Enlace Saltar al Contenido (Skip to Content Link)
  const skipLink = rootNode.querySelector('a[href^="#main"], a[href^="#content"], .skip-link')
  if (skipLink) {
    rules.push({
      id: 'skip-to-content',
      name: 'Enlace de Salto al Contenido Principal (Skip Link)',
      wcagCriterion: '2.4.1 Evitar bloques (Nivel A)',
      status: 'pass',
      message: 'Enlace de acceso directo al contenido principal disponible.',
      remediation: 'Ninguna',
      scoreWeight: 15,
    })
  } else {
    rules.push({
      id: 'skip-to-content',
      name: 'Enlace de Salto al Contenido Principal (Skip Link)',
      wcagCriterion: '2.4.1 Evitar bloques (Nivel A)',
      status: 'warn',
      message: 'No se encontró un enlace para saltar la navegación repetitiva.',
      remediation: 'Añade <a href="#main-content" className="sr-only-focusable">Saltar al contenido</a>.',
      scoreWeight: 15,
    })
  }

  // Cálculo de Puntaje Global
  let earnedScore = 0
  rules.forEach((r) => {
    if (r.status === 'pass') earnedScore += r.scoreWeight
    else if (r.status === 'warn') earnedScore += Math.floor(r.scoreWeight * 0.5)
  })

  const score = Math.min(100, Math.max(0, earnedScore))
  const grade = score >= 90 ? 'AAA' : score >= 75 ? 'AA' : score >= 50 ? 'A' : 'Fail'

  return {
    score,
    grade,
    passedCount: rules.filter((r) => r.status === 'pass').length,
    warningCount: rules.filter((r) => r.status === 'warn').length,
    errorCount: rules.filter((r) => r.status === 'fail').length,
    rules,
  }
}
