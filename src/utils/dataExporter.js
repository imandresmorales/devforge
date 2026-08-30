/**
 * @fileoverview Centro de exportación y conversión de datos en múltiples formatos (Mejora 44).
 *
 * CARACTERÍSTICAS:
 * - Serializador JSON formateado.
 * - Serializador YAML jerárquico seguro (cero dependencias externas y sin eval).
 * - Generador de tablas Markdown (GFM).
 * - Exportador CSV defensivo con protección contra inyección de fórmulas (CWE-1236).
 * - Disparador seguro de descarga de archivos Blob.
 *
 * @module utils/dataExporter
 */
import { sanitizeCsvCell } from './exportCsv'

/**
 * Convierte un objeto o arreglo a JSON formateado.
 * @param {unknown} data
 * @returns {string}
 */
export function exportToJSON(data) {
  return JSON.stringify(data, null, 2)
}

/**
 * Convierte un objeto o arreglo a formato YAML estándar.
 * @param {unknown} data
 * @param {number} [indent=0]
 * @returns {string}
 */
export function exportToYAML(data, indent = 0) {
  const spaces = '  '.repeat(indent)

  if (data === null || data === undefined) return `${spaces}null`
  if (typeof data === 'boolean' || typeof data === 'number') return `${spaces}${data}`
  if (typeof data === 'string') {
    // Si contiene saltos de línea o caracteres especiales, envolver en comillas
    if (data.includes('\n') || data.includes(':') || data.includes('#')) {
      return `${spaces}"${data.replace(/"/g, '\\"')}"`
    }
    return `${spaces}${data}`
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return `${spaces}[]`
    return data
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const innerYaml = exportToYAML(item, indent + 1).trimStart()
          return `${spaces}- ${innerYaml}`
        }
        return `${spaces}- ${exportToYAML(item, 0).trim()}`
      })
      .join('\n')
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data)
    if (keys.length === 0) return `${spaces}{}`
    return keys
      .map((key) => {
        const val = data[key]
        if (typeof val === 'object' && val !== null) {
          return `${spaces}${key}:\n${exportToYAML(val, indent + 1)}`
        }
        return `${spaces}${key}: ${exportToYAML(val, 0).trim()}`
      })
      .join('\n')
  }

  return `${spaces}${String(data)}`
}

/**
 * Convierte una lista de objetos en una tabla Markdown con formato GFM.
 * @param {Array<Record<string, unknown>>} rows
 * @returns {string}
 */
export function exportToMarkdownTable(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return '_Sin datos disponibles_'

  const headers = Object.keys(rows[0])
  const headerRow = `| ${headers.join(' | ')} |`
  const dividerRow = `| ${headers.map(() => '---').join(' | ')} |`

  const dataRows = rows.map((row) => {
    const cells = headers.map((h) => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      return String(val).replace(/\|/g, '\\|')
    })
    return `| ${cells.join(' | ')} |`
  })

  return [headerRow, dividerRow, ...dataRows].join('\n')
}

/**
 * Convierte un arreglo de objetos a CSV defensivo con sanitización contra inyecciones.
 * @param {Array<Record<string, unknown>>} rows
 * @returns {string}
 */
export function exportToCSVDefensive(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return ''

  const headers = Object.keys(rows[0])
  const headerLine = headers.join(',')

  const lines = rows.map((row) => {
    return headers
      .map((h) => sanitizeCsvCell(row[h]))
      .join(',')
  })

  return [headerLine, ...lines].join('\n')
}

/**
 * Dispara la descarga directa de un archivo Blob en el navegador.
 * @param {string} content - Contenido del archivo
 * @param {string} filename - Nombre del archivo con extensión
 * @param {string} mimeType - Tipo MIME (ej. 'application/json', 'text/yaml')
 */
export function downloadDataFile(content, filename, mimeType = 'text/plain') {
  if (typeof window === 'undefined') return

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
