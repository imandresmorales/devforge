import { describe, it, expect } from 'vitest'
import { generateReportData } from './printReport'

describe('Print & PDF Report Utilities (printReport.js)', () => {
  it('debe generar metadatos de auditoría con cálculos porcentuales precisos', () => {
    const data = generateReportData({ completedCount: 38, totalCount: 100 })
    expect(data.percentage).toBe(38)
    expect(data.reportId).toMatch(/^DF-AUDIT-/)
    expect(data.securityGrade).toContain('A+')
    expect(data.testsCount).toBeGreaterThanOrEqual(100)
  })

  it('debe incluir fecha formateada y metadatos de licencia', () => {
    const data = generateReportData()
    expect(data.license).toBe('MIT Open Source')
    expect(data.userName).toBeDefined()
    expect(data.date).toBeDefined()
  })
})
