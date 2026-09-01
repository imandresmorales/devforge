import { describe, it, expect } from 'vitest'
import {
  sanitizePathSegment,
  buildTreeStructure,
  generateAsciiProjectTree,
  TREE_PRESETS,
} from './treeGenerator'

describe('Project Directory Tree Generator (treeGenerator.js)', () => {
  it('debe sanitizar secuencias de Path Traversal', () => {
    const malicious = '../../etc/passwd'
    const clean = sanitizePathSegment(malicious)
    expect(clean).not.toContain('..')
    expect(clean).toBe('etc/passwd')
  })

  it('debe construir un árbol anidado a partir de rutas planas', () => {
    const paths = ['src/index.js', 'src/utils/helper.js', 'README.md']
    const tree = buildTreeStructure(paths)

    expect(tree['README.md']).toBeNull()
    expect(tree.src).toBeDefined()
    expect(tree.src['index.js']).toBeNull()
    expect(tree.src.utils['helper.js']).toBeNull()
  })

  it('debe generar un diagrama ASCII con conectores válidos', () => {
    const paths = ['src/App.jsx', 'package.json']
    const ascii = generateAsciiProjectTree(paths, 'devforge')

    expect(ascii).toContain('📁 devforge/')
    expect(ascii).toContain('📁 src')
    expect(ascii).toContain('App.jsx')
    expect(ascii).toContain('package.json')
  })

  it('debe procesar correctamente las plantillas de arquitectura predefinidas', () => {
    const preset = TREE_PRESETS[0]
    const ascii = generateAsciiProjectTree(preset.paths, preset.id)
    expect(ascii).toContain('Header.jsx')
    expect(ascii).toContain('vite.config.js')
  })
})
