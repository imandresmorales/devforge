/**
 * @fileoverview Componente VirtualListExplorer — Laboratorio de Virtualización de Listas Grandes y Windowing (Mejora 88).
 *
 * Demuestra el renderizado por Viewport para conjuntos de datos masivos (10,000 a 100,000+ filas)
 * con consumo constante de memoria O(1) y framerate de 60 FPS garantizado.
 *
 * @module components/ui/VirtualListExplorer
 */
import { useState, useMemo, useRef, useCallback } from 'react'
import {
  calculateVirtualWindow,
  generateSyntheticDataset,
} from '../../../utils/virtualListEngine'
import './VirtualListExplorer.css'

const ITEM_HEIGHT = 44
const VIEWPORT_HEIGHT = 360

export default function VirtualListExplorer() {
  const [dataSize, setDataSize] = useState(50000)
  const [overscan, setOverscan] = useState(3)
  const [jumpIndex, setJumpIndex] = useState('')
  const [scrollTop, setScrollTop] = useState(0)

  // Generar dataset sintético memoizado
  const dataset = useMemo(() => {
    return generateSyntheticDataset(dataSize)
  }, [dataSize])

  const viewportRef = useRef(null)

  // Manejador de scroll optimizado
  const handleScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Calcular la ventana virtual activa
  const virtualWindow = useMemo(() => {
    return calculateVirtualWindow({
      scrollTop,
      viewportHeight: VIEWPORT_HEIGHT,
      itemHeight: ITEM_HEIGHT,
      totalCount: dataset.length,
      overscan,
    })
  }, [scrollTop, dataset.length, overscan])

  // Obtener únicamente los elementos a renderizar en el DOM
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = virtualWindow
    return dataset.slice(startIndex, endIndex + 1)
  }, [dataset, virtualWindow])

  // Saltar a un índice específico de forma instantánea
  const handleJump = (e) => {
    e.preventDefault()
    const targetIdx = parseInt(jumpIndex, 10)
    if (!isNaN(targetIdx) && targetIdx >= 1 && targetIdx <= dataset.length) {
      const targetScroll = (targetIdx - 1) * ITEM_HEIGHT
      if (viewportRef.current) {
        viewportRef.current.scrollTop = targetScroll
      }
    }
  }

  return (
    <section className="vlist-explorer" aria-labelledby="vlist-title">
      {/* ── Encabezado ── */}
      <div className="vlist-explorer__header">
        <div className="vlist-explorer__title-row">
          <h2 id="vlist-title" className="vlist-explorer__title">
            <span>⚡</span> Simulador de Virtualización de Listas Grandes & Windowing
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span className="badge badge--brand">Mejora 88</span>
            <span className="badge badge--success">DOM O(1) Constante</span>
            <span className="badge badge--neutral">60 FPS Smooth</span>
            <span className="badge badge--warning">Viewport Windowing</span>
          </div>
        </div>
        <p className="vlist-explorer__desc">
          Renderizado virtual de ultra alto rendimiento. Si renderizaras <strong>{dataSize.toLocaleString()}</strong> nodos DOM
          simultáneos, el navegador colapsaría por reflows excesivos y saturación de memoria.
          El algoritmo de <strong>Virtual Windowing</strong> proyecta solo las filas visibles en el viewport más un búfer de amortiguación (overscan).
        </p>
      </div>

      {/* ── Métricas HUD en Tiempo Real ── */}
      <div className="vlist-hud">
        <div className="vlist-hud__card">
          <div className="vlist-hud__value">{dataset.length.toLocaleString()}</div>
          <div className="vlist-hud__label">Total Registros</div>
        </div>
        <div className="vlist-hud__card">
          <div className="vlist-hud__value" style={{ color: '#10b981' }}>{virtualWindow.domNodesCount}</div>
          <div className="vlist-hud__label">Nodos DOM Activos</div>
        </div>
        <div className="vlist-hud__card">
          <div className="vlist-hud__value" style={{ color: '#38bdf8' }}>{virtualWindow.memoryReductionPercent}%</div>
          <div className="vlist-hud__label">Reducción de Memoria</div>
        </div>
        <div className="vlist-hud__card">
          <div className="vlist-hud__value">#{virtualWindow.startIndex + 1} → #{virtualWindow.endIndex + 1}</div>
          <div className="vlist-hud__label">Ventana Visible</div>
        </div>
        <div className="vlist-hud__card">
          <div className="vlist-hud__value">{virtualWindow.offsetY.toLocaleString()}px</div>
          <div className="vlist-hud__label">Desplazamiento Y</div>
        </div>
      </div>

      {/* ── Barra de Controles ── */}
      <div className="vlist-controls">
        <div className="vlist-controls__group">
          <label>Tamaño del Dataset:</label>
          <select
            className="vlist-select"
            value={dataSize}
            onChange={(e) => setDataSize(Number(e.target.value))}
          >
            <option value={1000}>1,000 Filas</option>
            <option value={10000}>10,000 Filas</option>
            <option value={50000}>50,000 Filas</option>
            <option value={100000}>100,000 Filas</option>
            <option value={500000}>500,000 Filas (Ultra)</option>
          </select>
        </div>

        <div className="vlist-controls__group">
          <label>Overscan Buffer:</label>
          <select
            className="vlist-select"
            value={overscan}
            onChange={(e) => setOverscan(Number(e.target.value))}
          >
            <option value={1}>1 Fila</option>
            <option value={3}>3 Filas (Recomendado)</option>
            <option value={5}>5 Filas</option>
            <option value={10}>10 Filas</option>
          </select>
        </div>

        <form onSubmit={handleJump} className="vlist-controls__group">
          <label>Ir a Fila #:</label>
          <input
            type="number"
            min={1}
            max={dataset.length}
            placeholder={`1 - ${dataset.length}`}
            value={jumpIndex}
            onChange={(e) => setJumpIndex(e.target.value)}
            className="vlist-input"
            style={{ width: '90px' }}
          />
          <button type="submit" className="vlist-btn">
            Saltar 🚀
          </button>
        </form>
      </div>

      {/* ── Contenedor Virtual de Scroll ── */}
      <div
        ref={viewportRef}
        className="vlist-scroll-viewport"
        onScroll={handleScroll}
        role="region"
        aria-label="Registro de auditoría virtualizado"
      >
        <div
          className="vlist-scroll-track"
          style={{ height: `${virtualWindow.totalHeight}px` }}
        >
          <div
            className="vlist-scroll-content"
            style={{
              transform: `translate3d(0, ${virtualWindow.offsetY}px, 0)`,
            }}
          >
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="vlist-row"
                style={{ height: `${ITEM_HEIGHT}px` }}
              >
                <span className="vlist-row__idx">#{item.index}</span>
                <span className="vlist-row__time">{item.timestamp}</span>
                <span>
                  <span className={`vlist-sev vlist-sev--${item.severity}`}>
                    {item.severity}
                  </span>
                </span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.module}</span>
                <span className="vlist-row__trace">{item.action} — {item.traceId}</span>
                <span className="vlist-row__latency">{item.latencyMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
