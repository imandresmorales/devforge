/**
 * @fileoverview Hook useKanban — Gestión de estado y Drag & Drop para tablero Kanban (Mejora 34).
 *
 * CARACTERÍSTICAS:
 * - Soporte para 3 columnas de flujo de trabajo: 'todo', 'in_progress', 'done'.
 * - Reordenamiento y traslado de tareas con HTML5 Drag and Drop API.
 * - Persistencia automática en localStorage.
 * - Adición y eliminación de tareas con sanitización de texto.
 *
 * @module hooks/useKanban
 */
import { useState, useEffect, useCallback } from 'react'
import { sanitizeInput } from '../utils/security'

const STORAGE_KEY = 'df_kanban_board_v1'

export const KANBAN_COLUMNS = [
  { id: 'todo', title: '📋 Por Hacer (Backlog)', color: 'hsl(215, 20%, 65%)' },
  { id: 'in_progress', title: '⚡ En Progreso (WIP)', color: 'hsl(38, 92%, 55%)' },
  { id: 'done', title: '✅ Completado (Listo)', color: 'hsl(142, 71%, 45%)' },
]

export const INITIAL_KANBAN_TASKS = [
  {
    id: 'task-34',
    title: 'Mejora 34: Tablero Kanban interactivo con Drag & Drop',
    category: 'Frontend',
    priority: 'alta',
    column: 'done',
  },
  {
    id: 'task-35',
    title: 'Mejora 35: Editor de código en vivo con sandbox iframe',
    category: 'Seguridad',
    priority: 'alta',
    column: 'in_progress',
  },
  {
    id: 'task-36',
    title: 'Mejora 36: Tipado TypeScript y validación de esquemas',
    category: 'Arquitectura',
    priority: 'media',
    column: 'todo',
  },
  {
    id: 'task-37',
    title: 'Mejora 37: Módulo de feedback y calificaciones con NPS',
    category: 'UI/UX',
    priority: 'media',
    column: 'todo',
  },
  {
    id: 'task-38',
    title: 'Mejora 38: Generador de reportes en PDF y certificados',
    category: 'Reportes',
    priority: 'baja',
    column: 'todo',
  },
]

export function useKanban() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : INITIAL_KANBAN_TASKS
    } catch {
      return INITIAL_KANBAN_TASKS
    }
  })

  const [draggedTaskId, setDraggedTaskId] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (e) {
      console.warn('[useKanban] No se pudo persistir en localStorage:', e)
    }
  }, [tasks])

  const moveTask = useCallback((taskId, targetColumnId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: targetColumnId } : t))
    )
    setDraggedTaskId(null)
  }, [])

  const addTask = useCallback(({ title, category = 'General', priority = 'media', column = 'todo' }) => {
    const cleanTitle = sanitizeInput(title)
    if (!cleanTitle) return

    const newTask = {
      id: `task-${Date.now()}`,
      title: cleanTitle,
      category: sanitizeInput(category),
      priority,
      column,
    }

    setTasks((prev) => [newTask, ...prev])
  }, [])

  const deleteTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }, [])

  const resetTasks = useCallback(() => {
    setTasks(INITIAL_KANBAN_TASKS)
  }, [])

  return {
    tasks,
    columns: KANBAN_COLUMNS,
    draggedTaskId,
    setDraggedTaskId,
    moveTask,
    addTask,
    deleteTask,
    resetTasks,
  }
}

export default useKanban
