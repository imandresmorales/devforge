import { describe, it, expect } from 'vitest'
import { computeLineDiff, DIFF_PRESETS } from './diffHelper'

describe('Code Diff Viewer Engine (diffHelper.js)', () => {
  it('debe detectar líneas añadidas y eliminadas correctamente', () => {
    const oldCode = 'const a = 1\nconst b = 2'
    const newCode = 'const a = 1\nconst b = 3\nconst c = 4'

    const result = computeLineDiff(oldCode, newCode)

    expect(result.additions).toBe(2)
    expect(result.deletions).toBe(1)
    expect(result.diffLines.some((l) => l.type === 'unchanged' && l.text === 'const a = 1')).toBe(true)
    expect(result.diffLines.some((l) => l.type === 'removed' && l.text === 'const b = 2')).toBe(true)
    expect(result.diffLines.some((l) => l.type === 'added' && l.text === 'const b = 3')).toBe(true)
  })

  it('debe procesar textos idénticos sin adiciones ni eliminaciones', () => {
    const code = 'console.log("hello world")'
    const result = computeLineDiff(code, code)

    expect(result.additions).toBe(0)
    expect(result.deletions).toBe(0)
    expect(result.diffLines.length).toBe(1)
    expect(result.diffLines[0].type).toBe('unchanged')
  })

  it('debe procesar correctamente los presets de diferencias', () => {
    const preset = DIFF_PRESETS[0]
    const result = computeLineDiff(preset.oldCode, preset.newCode)

    expect(result.additions).toBeGreaterThan(0)
    expect(result.deletions).toBeGreaterThan(0)
  })
})
