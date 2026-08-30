/**
 * @fileoverview Modal de Centro de Exportación de Datos Multi-formato (Mejora 44).
 *
 * CARACTERÍSTICAS:
 * - Conversión y previsualización en vivo en 4 formatos (JSON, YAML, Markdown, CSV).
 * - Selector de datasets del proyecto (Roadmap de Mejoras, Métricas del Sistema).
 * - Copiado rápido al portapapeles con Toast notification.
 * - Descarga directa del archivo en su formato correspondiente.
 *
 * @module components/ui/DataExporterModal
 */
import { useState, useMemo } from 'react'
import Modal from '../Modal/Modal.jsx'
import {
  exportToJSON,
  exportToYAML,
  exportToMarkdownTable,
  exportToCSVDefensive,
  downloadDataFile,
} from '../../../utils/dataExporter'
import { useToast } from '../../../context/ToastContext'
import './DataExporterModal.css'

const DATASETS = {
  roadmap: {
    name: '🗺️ Roadmap de Mejoras',
    data: [
      { num: '40', title: 'Terminal Interactiva CLI', status: 'done', commit: '4f6cd75' },
      { num: '41', title: 'Sistema de Logros y Gamificación', status: 'done', commit: '0287c23' },
      { num: '42', title: 'Gestor de Webhooks y Verif. HMAC', status: 'done', commit: '1387dad' },
      { num: '43', title: 'Tester de Regex en Vivo (Anti-ReDoS)', status: 'done', commit: '1325b2d' },
      { num: '44', title: 'Centro de Exportación Multi-formato', status: 'done', commit: 'main' },
    ],
  },
  metrics: {
    name: '📊 Métricas del Proyecto',
    data: [
      { metric: 'Mejoras Implementadas', value: '44 / 100', progress: '44%' },
      { metric: 'Tests Automatizados', value: '166 pasando', status: '100% éxito' },
      { metric: 'Commits en GitHub', value: '44 commits', sync: 'Al día' },
      { metric: 'Calificación de Seguridad', value: 'A+ Excelente', standard: 'CSP + PKCE + HMAC' },
    ],
  },
}

function DataExporterModal({ isOpen, onClose }) {
  const [format, setFormat] = useState('json') // 'json' | 'yaml' | 'markdown' | 'csv'
  const [selectedDataset, setSelectedDataset] = useState('roadmap')
  const { addToast } = useToast()

  const currentData = DATASETS[selectedDataset]?.data || []

  const formattedOutput = useMemo(() => {
    switch (format) {
      case 'json':
        return exportToJSON(currentData)
      case 'yaml':
        return exportToYAML(currentData)
      case 'markdown':
        return exportToMarkdownTable(currentData)
      case 'csv':
        return exportToCSVDefensive(currentData)
      default:
        return ''
    }
  }, [format, currentData])

  const handleCopy = () => {
    navigator.clipboard?.writeText(formattedOutput)
    addToast({
      type: 'info',
      title: 'Datos Copiados',
      message: `El contenido en formato ${format.toUpperCase()} se copió al portapapeles.`,
    })
  }

  const handleDownload = () => {
    const extMap = {
      json: { ext: 'json', mime: 'application/json' },
      yaml: { ext: 'yaml', mime: 'text/yaml' },
      markdown: { ext: 'md', mime: 'text/markdown' },
      csv: { ext: 'csv', mime: 'text/csv' },
    }
    const { ext, mime } = extMap[format]
    downloadDataFile(formattedOutput, `devforge-${selectedDataset}.${ext}`, mime)

    addToast({
      type: 'success',
      title: 'Archivo Descargado',
      message: `Descargado devforge-${selectedDataset}.${ext} con éxito.`,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📦 Centro de Exportación de Datos">
      <div className="exporter-modal">
        {/* Controles de Selección */}
        <div className="exporter-controls">
          <div className="exporter-group">
            <span className="exporter-label">Dataset:</span>
            <div className="exporter-pills">
              {Object.entries(DATASETS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  className={`pill-btn${selectedDataset === key ? ' pill-btn--active' : ''}`}
                  onClick={() => setSelectedDataset(key)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="exporter-group">
            <span className="exporter-label">Formato:</span>
            <div className="exporter-pills" role="tablist">
              {['json', 'yaml', 'markdown', 'csv'].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  role="tab"
                  aria-selected={format === fmt}
                  className={`pill-btn pill-btn--fmt${format === fmt ? ' pill-btn--active' : ''}`}
                  onClick={() => setFormat(fmt)}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visor de Salida */}
        <div className="exporter-preview-box">
          <div className="exporter-preview-header">
            <span className="exporter-file-name">
              devforge-{selectedDataset}.{format === 'markdown' ? 'md' : format}
            </span>
            <button type="button" className="exporter-copy-btn" onClick={handleCopy}>
              📋 Copiar
            </button>
          </div>
          <textarea
            className="exporter-output-text"
            value={formattedOutput}
            readOnly
            rows={10}
            spellCheck={false}
          />
        </div>

        {/* Acciones */}
        <div className="exporter-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="btn-primary" onClick={handleDownload}>
            💾 Descargar .{format === 'markdown' ? 'md' : format}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default DataExporterModal
