/**
 * @fileoverview DataTable — tabla dinámica reutilizable con paginación y ordenación.
 *
 * CARACTERÍSTICAS:
 * - Paginación client-side con tamaño de página configurable
 * - Ordenación por columna (asc/desc) con toggle
 * - Búsqueda/filtrado en tiempo real sobre todos los campos string
 * - Estado vacío cuando no hay resultados
 * - 100% controlada por props (sin estado interno de datos)
 * - Accesible: aria-sort, aria-label, caption en tabla
 *
 * @template T - Tipo de los items de datos
 * @module components/ui/DataTable
 */
import { useState, useMemo } from 'react'
import { downloadCsv } from '../../../utils/exportCsv'
import './DataTable.css'

/**
 * @typedef {Object} Column
 * @property {string}   key       - Clave del campo en el objeto de datos
 * @property {string}   label     - Etiqueta de la columna
 * @property {boolean}  [sortable=true] - Si la columna es ordenable
 * @property {Function} [render]  - Función de renderizado personalizado: (value, row) => ReactNode
 */

/** Opciones de tamaño de página */
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

/**
 * Ordena un array de objetos por una clave y dirección.
 * @param {Object[]} items
 * @param {string}   key
 * @param {'asc'|'desc'} direction
 * @returns {Object[]}
 */
function sortItems(items, key, direction) {
  if (!key) return items
  return [...items].sort((a, b) => {
    const aVal = a[key] ?? ''
    const bVal = b[key] ?? ''
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    const cmp = aStr < bStr ? -1 : aStr > bStr ? 1 : 0
    return direction === 'asc' ? cmp : -cmp
  })
}

/**
 * Filtra un array de objetos buscando el término en todos los campos string.
 * @param {Object[]} items
 * @param {string}   term
 * @returns {Object[]}
 */
function filterItems(items, term) {
  if (!term.trim()) return items
  const lower = term.toLowerCase()
  return items.filter((item) =>
    Object.values(item).some((v) =>
      String(v ?? '').toLowerCase().includes(lower)
    )
  )
}

/**
 * Componente de tabla dinámica con paginación, ordenación y búsqueda.
 *
 * @param {Object}   props
 * @param {Object[]} props.data        - Array de datos a mostrar
 * @param {Column[]} props.columns     - Definición de columnas
 * @param {string}   [props.caption]   - Descripción accesible de la tabla
 * @param {number}   [props.initialPageSize=10] - Filas por página inicial
 * @param {boolean}  [props.searchable=true]    - Mostrar campo de búsqueda
 * @returns {JSX.Element}
 */
function DataTable({
  data = [],
  columns = [],
  caption = 'Tabla de datos',
  initialPageSize = 10,
  searchable = true,
}) {
  const [sortKey,       setSortKey]       = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [searchTerm,    setSearchTerm]    = useState('')
  const [currentPage,   setCurrentPage]   = useState(1)
  const [pageSize,      setPageSize]      = useState(initialPageSize)

  /** Maneja el click en una cabecera de columna ordenable */
  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  /** Al buscar, volvemos a la primera página */
  function handleSearch(e) {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  /** Al cambiar el tamaño de página, volvemos a la primera página */
  function handlePageSizeChange(e) {
    setPageSize(Number(e.target.value))
    setCurrentPage(1)
  }

  // Datos procesados: filtrar → ordenar → paginar
  const processedData = useMemo(() => {
    const filtered = filterItems(data, searchTerm)
    const sorted   = sortItems(filtered, sortKey, sortDirection)
    return sorted
  }, [data, searchTerm, sortKey, sortDirection])

  const totalPages  = Math.max(1, Math.ceil(processedData.length / pageSize))
  const safePage    = Math.min(currentPage, totalPages)
  const startIndex  = (safePage - 1) * pageSize
  const pageData    = processedData.slice(startIndex, startIndex + pageSize)
  const totalItems  = processedData.length

  // Páginas a mostrar en el control de paginación (máximo 5 botones)
  const pageNumbers = useMemo(() => {
    const pages = []
    const maxButtons = 5
    let start = Math.max(1, safePage - Math.floor(maxButtons / 2))
    let end   = Math.min(totalPages, start + maxButtons - 1)
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1)
    }
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }, [safePage, totalPages])

  return (
    <div className="data-table-wrapper">

      {/* ── Controles ── */}
      <div className="data-table__controls">
        {searchable && (
          <div className="data-table__search-wrap">
            <span className="data-table__search-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              className="data-table__search"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Buscar en la tabla…"
              aria-label="Buscar en la tabla"
            />
          </div>
        )}

        <div className="data-table__page-size">
          <label htmlFor="page-size-select">Filas:</label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={handlePageSizeChange}
            aria-label="Número de filas por página"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => downloadCsv('devforge-export.csv', columns, processedData)}
          aria-label="Exportar datos visibles a archivo CSV"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
          }}
        >
          <span aria-hidden="true">📥</span> Exportar CSV
        </button>
      </div>

      {/* ── Tabla ── */}
      <div className="data-table__scroll">
        <table
          className="data-table"
          aria-label={caption}
          aria-rowcount={totalItems}
        >
          <caption className="sr-only">{caption}</caption>

          <thead>
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable !== false
                const isActive   = sortKey === col.key
                const ariaSort   = isActive
                  ? (sortDirection === 'asc' ? 'ascending' : 'descending')
                  : 'none'

                return (
                  <th
                    key={col.key}
                    className={`${isSortable ? 'sortable' : ''}${isActive ? ' active' : ''}`}
                    onClick={isSortable ? () => handleSort(col.key) : undefined}
                    aria-sort={isSortable ? ariaSort : undefined}
                    tabIndex={isSortable ? 0 : undefined}
                    onKeyDown={isSortable
                      ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleSort(col.key) }
                      : undefined
                    }
                    scope="col"
                  >
                    {col.label}
                    {isSortable && (
                      <span className="data-table__sort-icon" aria-hidden="true">
                        {isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="data-table__empty" role="status">
                    <span className="data-table__empty-icon" aria-hidden="true">
                      {searchTerm ? '🔍' : '📭'}
                    </span>
                    {searchTerm
                      ? `Sin resultados para "${searchTerm}"`
                      : 'No hay datos disponibles'}
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((row, rowIndex) => (
                <tr key={row.id ?? rowIndex} aria-rowindex={startIndex + rowIndex + 1}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ── */}
      <div className="data-table__pagination" aria-label="Paginación de la tabla">
        <p className="data-table__pagination-info" aria-live="polite">
          {totalItems === 0
            ? 'Sin resultados'
            : `Mostrando ${startIndex + 1}–${Math.min(startIndex + pageSize, totalItems)} de ${totalItems} registros`}
        </p>

        <div
          className="data-table__pagination-controls"
          role="navigation"
          aria-label="Páginas"
        >
          <button
            className="data-table__page-btn"
            onClick={() => setCurrentPage(1)}
            disabled={safePage === 1}
            aria-label="Primera página"
          >
            «
          </button>
          <button
            className="data-table__page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            aria-label="Página anterior"
          >
            ‹
          </button>

          {pageNumbers.map((n) => (
            <button
              key={n}
              className={`data-table__page-btn${n === safePage ? ' active' : ''}`}
              onClick={() => setCurrentPage(n)}
              aria-label={`Página ${n}`}
              aria-current={n === safePage ? 'page' : undefined}
            >
              {n}
            </button>
          ))}

          <button
            className="data-table__page-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            aria-label="Página siguiente"
          >
            ›
          </button>
          <button
            className="data-table__page-btn"
            onClick={() => setCurrentPage(totalPages)}
            disabled={safePage === totalPages}
            aria-label="Última página"
          >
            »
          </button>
        </div>
      </div>

    </div>
  )
}

export default DataTable
