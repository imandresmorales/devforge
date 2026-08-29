import { describe, it, expect } from 'vitest'
import { generateQRMatrix, generateQRCodeSVG } from './qrCode'

describe('QR Code Generator Utilities (qrCode.js)', () => {
  describe('generateQRMatrix', () => {
    it('debe generar una matriz de 25x25 booleanos', () => {
      const matrix = generateQRMatrix('https://devforge.local')
      expect(matrix.length).toBe(25)
      expect(matrix[0].length).toBe(25)
    })

    it('debe contener los Finder Patterns en las esquinas principales', () => {
      const matrix = generateQRMatrix('test-2fa-token')
      // Top-Left corner border
      expect(matrix[0][0]).toBe(true)
      expect(matrix[0][6]).toBe(true)
      expect(matrix[6][0]).toBe(true)
      expect(matrix[6][6]).toBe(true)
      // Center of Top-Left finder
      expect(matrix[3][3]).toBe(true)
    })

    it('textos diferentes generan matrices con hashes diferentes', () => {
      const m1 = generateQRMatrix('URL_UNO')
      const m2 = generateQRMatrix('URL_DOS')
      expect(JSON.stringify(m1)).not.toBe(JSON.stringify(m2))
    })
  })

  describe('generateQRCodeSVG', () => {
    it('debe generar un string SVG válido con dimensiones correctas', () => {
      const svg = generateQRCodeSVG({ text: 'https://wa.me/573001234567', size: 300 })
      expect(svg).toContain('<svg')
      expect(svg).toContain('viewBox="0 0 300 300"')
      expect(svg).toContain('<rect')
      expect(svg).toContain('</svg>')
    })

    it('debe respetar los colores personalizados', () => {
      const svg = generateQRCodeSVG({
        text: 'CustomColors',
        color: '#6366f1',
        bgColor: '#0f172a',
      })
      expect(svg).toContain('fill="#6366f1"')
      expect(svg).toContain('fill="#0f172a"')
    })
  })
})
