/**
 * @fileoverview Tablero Kanban interactivo con Drag & Drop nativo HTML5 (Mejora 34).
 *
 * CARACTERÍSTICAS:
 * - 3 columnas dinámicas con contador de tarjetas.
 * - Eventos de Drag & Drop HTML5 nativos con feedback visual de arrastre.
 * - Formulario para añadir nuevas tareas con categorías y niveles de prioridad.
 * - Eliminación de tareas y botón para restaurar datos iniciales.
 *
 * @module components/ui/KanbanBoard
 */
import { useState } from 'react'
import useKanban from '../../../hooks/useKanban'
import './KanbanBoard.css'

function KanbanBoard() {
  const {
    tasks,
    columns,
    draggedTaskId,
    setDraggedTaskId,
    moveTask,
    addTask,
    deleteTask,
    resetTasks,
  } = useKanban()

  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Frontend')
  const [newPriority, setNewPriority] = useState('media')
  const [activeColumnHover, setActiveColumnHover] = useState(null)

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, colId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (activeColumnHover !== colId) {
      setActiveColumnHover(colId)
    }
  }

  const handleDragLeave = () => {
    setActiveColumnHover(null)
  }

  const handleDrop = (e, colId) => {
    e.preventDefault()
    setActiveColumnHover(null)
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId
    if (taskId) {
      moveTask(taskId, colId)
    }
  }

  const handleCreateTask = (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    addTask({
      title: newTitle,
      category: newCategory,
      priority: newPriority,
      column: 'todo',
    })

    setNewTitle('')
  }

  return (
    <section className="kanban-section" aria-label="Tablero Kanban de tareas">
      {/* Cabecera y Formulario de Nueva Tarea */}
      <div className="kanban-header">
        <div>
          <h2 className="kanban-title">⚡ Tablero Kanban de Mejoras</h2>
          <p className="kanban-subtitle">
            Arrastra y suelta las tarjetas entre columnas para gestionar el flujo de desarrollo.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary kanban-reset-btn"
          onClick={resetTasks}
          title="Restablecer tareas del roadmap"
        >
          🔄 Reiniciar Tablero
        </button>
      </div>

      <form className="kanban-new-form" onSubmit={handleCreateTask}>
        <input
          type="text"
          className="form-input kanban-input"
          placeholder="Escribe una nueva tarea para el roadmap…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          aria-label="Título de la nueva tarea"
        />
        <select
          className="form-input kanban-select"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          aria-label="Categoría"
        >
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Seguridad">Seguridad</option>
          <option value="UI/UX">UI/UX</option>
          <option value="DevOps">DevOps</option>
        </select>
        <select
          className="form-input kanban-select"
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          aria-label="Prioridad"
        >
          <option value="baja">🟢 Baja</option>
          <option value="media">🟡 Media</option>
          <option value="alta">🔴 Alta</option>
        </select>
        <button type="submit" className="btn-primary" disabled={!newTitle.trim()}>
          + Agregar
        </button>
      </form>

      {/* Grid de Columnas */}
      <div className="kanban-grid">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.column === col.id)
          const isHovered = activeColumnHover === col.id

          return (
            <div
              key={col.id}
              className={`kanban-col${isHovered ? ' kanban-col--dragover' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="kanban-col__header">
                <span className="kanban-col__title">{col.title}</span>
                <span className="kanban-col__badge">{colTasks.length}</span>
              </div>

              <div className="kanban-col__list">
                {colTasks.length === 0 ? (
                  <div className="kanban-empty">Arrastra tarjetas aquí</div>
                ) : (
                  colTasks.map((task) => (
                    <article
                      key={task.id}
                      className={`kanban-card${draggedTaskId === task.id ? ' kanban-card--dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={() => setDraggedTaskId(null)}
                    >
                      <div className="kanban-card__top">
                        <span className="kanban-card__category">{task.category}</span>
                        <span className={`kanban-priority kanban-priority--${task.priority}`}>
                          {task.priority}
                        </span>
                      </div>
                      <h4 className="kanban-card__title">{task.title}</h4>
                      <div className="kanban-card__footer">
                        <span className="kanban-card__grip" title="Arrastrable">⋮⋮ Arrastrar</span>
                        <button
                          type="button"
                          className="kanban-card__del"
                          onClick={() => deleteTask(task.id)}
                          title="Eliminar tarea"
                          aria-label={`Eliminar tarea ${task.title}`}
                        >
                          ✕
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default KanbanBoard
