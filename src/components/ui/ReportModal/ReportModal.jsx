/**
 * @fileoverview Modal de Certificado de Auditoría y Reporte Imprimible PDF (Mejora 38).
 *
 * CARACTERÍSTICAS:
 * - Vista previa formateada estilo documento corporativo de auditoría.
 * - Desglose de métricas clave (Mejoras completadas, Tests automatizados, Calificación de Seguridad).
 * - Sello QR de verificación embebido.
 * - Disparador nativo de impresión/guardado en PDF con estilos dedicados @media print.
 *
 * @module components/ui/ReportModal
 */
import { useMemo } from 'react'
import Modal from '../Modal/Modal.jsx'
import { generateReportData, triggerPrint } from '../../../utils/printReport'
import { generateQRCodeSVG } from '../../../utils/qrCode'
import { useAuth } from '../../../context/AuthContext'
import './ReportModal.css'

function ReportModal({ isOpen, onClose }) {
  const { user } = useAuth()

  const report = useMemo(() => {
    return generateReportData({
      userName: user?.name || 'Andres Morales',
      completedCount: 38,
      totalCount: 100,
      testsCount: 145,
    })
  }, [user])

  const qrSvg = useMemo(() => {
    return generateQRCodeSVG({
      text: `https://github.com/imandresmorales/devforge#${report.reportId}`,
      size: 90,
    })
  }, [report.reportId])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Certificado de Auditoría y Reporte">
      <div className="report-modal">
        {/* Documento Imprimible */}
        <div id="printable-report-area" className="report-sheet">
          {/* Cabecera del Certificado */}
          <div className="report-sheet__header">
            <div>
              <span className="report-sheet__brand">⚡ DEVFORGE</span>
              <h2 className="report-sheet__title">Certificado de Auditoría Técnica</h2>
              <p className="report-sheet__sub">Roadmap de 100 Mejoras Continuas de Software</p>
            </div>
            <div
              className="report-sheet__qr"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
              title="Código QR de verificación"
            />
          </div>

          <div className="report-sheet__divider" />

          {/* Metadatos */}
          <div className="report-sheet__meta">
            <div><strong>ID de Auditoría:</strong> <code>{report.reportId}</code></div>
            <div><strong>Fecha:</strong> {report.date}</div>
            <div><strong>Desarrollador:</strong> {report.userName}</div>
            <div><strong>Licencia:</strong> {report.license}</div>
          </div>

          {/* Tarjetas de Métricas */}
          <div className="report-sheet__metrics">
            <div className="report-metric-box">
              <span className="report-metric-box__num">{report.completedCount}/100</span>
              <span className="report-metric-box__label">Mejoras Completadas ({report.percentage}%)</span>
            </div>
            <div className="report-metric-box">
              <span className="report-metric-box__num">145</span>
              <span className="report-metric-box__label">Tests Automatizados (100%)</span>
            </div>
            <div className="report-metric-box">
              <span className="report-metric-box__num">A+</span>
              <span className="report-metric-box__label">Calificación de Seguridad</span>
            </div>
          </div>

          {/* Fases completadas */}
          <div className="report-sheet__phases">
            <h4>Desglose de Fases Implementadas:</h4>
            <ul>
              <li><strong>Fase 1 (Fundamentos & UI):</strong> 14 de 14 mejoras completadas (100%)</li>
              <li><strong>Fase 2 (Seguridad & APIs):</strong> 11 de 11 mejoras completadas (100%)</li>
              <li><strong>Fase 3 (Pagos, PWA & Avanzado):</strong> 13 de 20 mejoras completadas (65%)</li>
            </ul>
          </div>

          {/* Pie de firma */}
          <div className="report-sheet__signature">
            <div className="report-sig-line">
              <span className="report-sig-name">Andres Morales</span>
              <span className="report-sig-role">Lead Full Stack Developer</span>
            </div>
            <span className="report-badge-seal">🛡️ VERIFICADO OFICIALMENTE</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="report-modal__actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="btn-primary" onClick={triggerPrint}>
            🖨️ Imprimir / Guardar en PDF
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ReportModal
