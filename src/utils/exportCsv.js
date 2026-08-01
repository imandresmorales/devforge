/**
 * @fileoverview Utilidad para exportación segura de datos a formato CSV.
 * 
 * SEGURIDAD CONTRA INYECCIÓN CSV (CSV Injection / Formula Injection):
 * Si un campo de texto comienza con =, +, -, @, \t o \r, hojas de cálculo como MS Excel o
 * Google Sheets pueden interpretar el contenido como una fórmula ejecutable o comando DDE.
 * Para mitigar este riesgo, se antecede una comilla simple (') en dichas celdas.
 *
 * @module utils/exportCsv
 */

/**
 * Sanitiza el valor de una celda para prevenir inyecciones de fórmulas CSV.
 * @param {any} value - El valor a sanitizar
 * @returns {string} El texto de la celda seguro
 */
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return ''

  let str = String(value)

  // Mitigación de Inyección de Fórmulas CSV
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }

  // Escape de comillas dobles y comas
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Genera el contenido de un archivo CSV seguro a partir de columnas y filas.
 * @param {{ key: string, label: string }[]} columns - Definición de columnas
 * @param {Object[]} data - Filas de datos
 * @returns {string} Contenido CSV en texto con codificación UTF-8
 */
export function generateCsvContent(columns, data) {
  const headers = columns.map((col) => sanitizeCsvCell(col.label)).join(',')

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key]
        return sanitizeCsvCell(val)
      })
      .join(',')
  )

  return [headers, ...rows].join('\r\n')
}

/**
 * Inicia la descarga en el navegador de un archivo CSV.
 * @param {string} filename - Nombre del archivo a descargar (ej: 'reporte.csv')
 * @param {{ key: string, label: string }[]} columns - Columnas a exportar
 * @param {Object[]} data - Datos a exportar
 */
export function downloadCsv(filename, columns, data) {
  const csvText = generateCsvContent(columns, data)
  // BOM UTF-8 (\uFEFF) para forzar lectura correcta de tildes/ñ en Excel
  const blob = new Blob(['\uFEFF' + csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
