import { describe, it, expect } from 'vitest'
import {
  exportToJSON,
  exportToYAML,
  exportToMarkdownTable,
  exportToCSVDefensive,
} from './dataExporter'

describe('Data Exporter Multi-Format (dataExporter.js)', () => {
  const sampleData = [
    { id: 1, title: 'Scaffolding', status: 'done' },
    { id: 2, title: 'Design tokens', status: 'done' },
  ]

  it('debe exportar a JSON válido y legible', () => {
    const json = exportToJSON(sampleData)
    expect(json).toContain('"title": "Scaffolding"')
    expect(JSON.parse(json)).toEqual(sampleData)
  })

  it('debe serializar a YAML jerárquico', () => {
    const yaml = exportToYAML({
      project: 'DevForge',
      version: '2.4.0',
      features: ['Auth', 'Stripe'],
    })
    expect(yaml).toContain('project: DevForge')
    expect(yaml).toContain('- Auth')
    expect(yaml).toContain('- Stripe')
  })

  it('debe generar una tabla Markdown con encabezados y separadores GFM', () => {
    const md = exportToMarkdownTable(sampleData)
    expect(md).toContain('| id | title | status |')
    expect(md).toContain('| --- | --- | --- |')
    expect(md).toContain('| 1 | Scaffolding | done |')
  })

  it('debe generar CSV defensivo contra inyección de fórmulas', () => {
    const vulnerableData = [{ name: '=1+1', role: 'admin' }]
    const csv = exportToCSVDefensive(vulnerableData)
    expect(csv).toContain("'=1+1")
  })
})
