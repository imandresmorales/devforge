/**
 * @fileoverview Utilidades para generación de reportes imprimibles y certificados PDF (Mejora 38).
 *
 * CARACTERÍSTICAS:
 * - Generación de metadatos de auditoría del proyecto.
 * - Disparo del diálogo nativo de impresión/guardado en PDF del navegador.
 *
 * @module utils/printReport
 */

/**
 * Genera el paquete de datos para el reporte de auditoría de DevForge.
 *
 * @param {Object} [params]
 * @param {string} [params.userName='Desarrollador DevForge']
 * @param {number} [params.completedCount=38]
 * @param {number} [params.totalCount=100]
 * @param {number} [params.testsCount=145]
 * @returns {Object} Datos del reporte
 */
export function generateReportData({
  userName = 'Andres Morales',
  completedCount = 38,
  totalCount = 100,
  testsCount = 145,
} = {}) {
  const percentage = Math.round((completedCount / totalCount) * 100)
  const reportId = `DF-AUDIT-${Date.now().toString(36).toUpperCase()}`
  const date = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return {
    reportId,
    date,
    userName,
    completedCount,
    totalCount,
    percentage,
    testsCount,
    securityGrade: 'A+ (Excelente)',
    architecture: 'React 18 + Vite + Vitest + PWA',
    license: 'MIT Open Source',
  }
}

/**
 * Invoca el diálogo de impresión nativo del navegador.
 */
export function triggerPrint() {
  if (typeof window !== 'undefined') {
    window.print()
  }
}
