/**
 * @fileoverview Componente ProjectTreeGenerator — Generador y visualizador de árboles de arquitectura en ASCII (Mejora 47).
 *
 * CARACTERÍSTICAS:
 * - Conversión en vivo de listas de rutas a árboles de directorios ASCII.
 * - Selector de plantillas arquitectónicas (DevForge, Next.js 15, Clean Architecture).
 * - Copiado rápido al portapapeles y descarga directa como archivo .txt o Markdown.
 * - Sanitización contra inyección de rutas (Path Traversal).
 *
 * @module components/ui/ProjectTreeGenerator
 */
import { useState, useMemo } from 'react'
import { TREE_PRESETS, generateAsciiProjectTree } from '../../../utils/treeGenerator'
import { useToast } from '../../../context/ToastContext'
import { downloadDataFile } from '../../../utils/dataExporter'
import './ProjectTreeGenerator.css'

function ProjectTreeGenerator() {
  const [selectedPresetId, setSelectedPresetId] = useState(TREE_PRESETS[0].id)
  const [rawPathsInput, setRawPathsInput] = useState(TREE_PRESETS[0].paths.join('\n'))
  const [projectName, setProjectName] = useState('devforge')
  const { addToast } = useToast()

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id)
    setRawPathsInput(preset.paths.join('\n'))
    setProjectName(preset.id)
  }

  const asciiTree = useMemo(() => {
    return generateAsciiProjectTree(rawPathsInput, projectName || 'proyecto')
  }, [rawPathsInput, projectName])

  const handleCopy = () => {
    navigator.clipboard?.writeText(asciiTree)
    addToast({
      type: 'info',
      title: 'Árbol Copiado',
      message: 'Diagrama ASCII copiado al portapapeles con éxito.',
    })
  }

  const handleDownload = () => {
    downloadDataFile(asciiTree, `${projectName}-tree.txt`, 'text/plain')
    addToast({
      type: 'success',
      title: 'Archivo Descargado',
      message: `Descargado ${projectName}-tree.txt`,
    })
  }

  return (
    <section className="tree-gen-section" aria-label="Generador de árboles de directorios">
      <div className="tree-gen-header">
        <div>
          <h2 className="tree-gen-title">🌳 Generador de Estructura de Proyectos (ASCII / MD)</h2>
          <p className="tree-gen-subtitle">
            Crea diagramas de jerarquía de carpetas y archivos formateados en ASCII para tu README.md y documentación.
          </p>
        </div>

        <div className="tree-presets-bar">
          {TREE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`preset-chip${selectedPresetId === p.id ? ' preset-chip--active' : ''}`}
              onClick={() => handleSelectPreset(p)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="tree-container">
        {/* Panel Izquierdo: Editor de Rutas */}
        <div className="tree-editor-pane">
          <div className="tree-editor-top">
            <label className="form-label" htmlFor="tree-project-name">
              Nombre de la Raíz:
            </label>
            <input
              id="tree-project-name"
              type="text"
              className="tree-name-input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Nombre del proyecto…"
            />
          </div>

          <div className="tree-field">
            <label className="form-label" htmlFor="tree-paths-input">
              Rutas de Archivos (una por línea):
            </label>
            <textarea
              id="tree-paths-input"
              className="tree-textarea"
              rows={10}
              value={rawPathsInput}
              onChange={(e) => setRawPathsInput(e.target.value)}
              placeholder="src/index.js&#10;src/components/Header.jsx&#10;package.json"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Panel Derecho: Previsualización ASCII */}
        <div className="tree-preview-pane">
          <div className="tree-preview-header">
            <span className="tree-preview-title">Salida Diagrama ASCII</span>
            <div className="tree-preview-actions">
              <button type="button" className="btn-secondary tree-btn-xs" onClick={handleCopy}>
                📋 Copiar
              </button>
              <button type="button" className="btn-primary tree-btn-xs" onClick={handleDownload}>
                💾 Descargar .txt
              </button>
            </div>
          </div>
          <pre className="tree-ascii-box">{asciiTree}</pre>
        </div>
      </div>
    </section>
  )
}

export default ProjectTreeGenerator
