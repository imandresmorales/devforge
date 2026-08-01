import { describe, it, expect } from 'vitest'
import { sanitizeCsvCell, generateCsvContent } from './exportCsv.js'

describe('Seguridad - Exportación CSV (exportCsv.js)', () => {
  describe('sanitizeCsvCell', () => {
    it('debe mitigar inyecciones de fórmulas que empiezan con =, +, -, @', () => {
      expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
      expect(sanitizeCsvCell('+12345')).toBe("'+12345")
      expect(sanitizeCsvCell('@cmd')).toBe("'@cmd")
    })

    it('debe escapar comillas dobles adecuadamente', () => {
      expect(sanitizeCsvCell('Hola "Mundo"')).toBe('"Hola ""Mundo"""')
    })

    it('debe manejar valores nulos o no definidos', () => {
      expect(sanitizeCsvCell(null)).toBe('')
      expect(sanitizeCsvCell(undefined)).toBe('')
    })
  })

  describe('generateCsvContent', () => {
    it('debe generar la estructura correcta de cabecera y filas', () => {
      const cols = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Nombre' },
      ]
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]

      const csv = generateCsvContent(cols, data)
      expect(csv).toContain('ID,Nombre')
      expect(csv).toContain('1,Alice')
      expect(csv).toContain('2,Bob')
    })
  })
})
