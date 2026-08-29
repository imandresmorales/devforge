import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKanban, INITIAL_KANBAN_TASKS } from './useKanban'

describe('useKanban Hook (useKanban.js)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('debe iniciar con las tareas predeterminadas', () => {
    const { result } = renderHook(() => useKanban())
    expect(result.current.tasks.length).toBe(INITIAL_KANBAN_TASKS.length)
  })

  it('debe mover una tarea a otra columna con moveTask', () => {
    const { result } = renderHook(() => useKanban())
    const targetTask = result.current.tasks[0]

    act(() => {
      result.current.moveTask(targetTask.id, 'done')
    })

    const updated = result.current.tasks.find((t) => t.id === targetTask.id)
    expect(updated.column).toBe('done')
  })

  it('debe agregar una nueva tarea sanitizada', () => {
    const { result } = renderHook(() => useKanban())

    act(() => {
      result.current.addTask({
        title: '<b>Nueva Tarea Segura</b>',
        category: 'Testing',
        priority: 'alta',
      })
    })

    const added = result.current.tasks[0]
    expect(added.title).toBe('Nueva Tarea Segura')
    expect(added.category).toBe('Testing')
    expect(added.priority).toBe('alta')
  })

  it('debe eliminar una tarea por su id', () => {
    const { result } = renderHook(() => useKanban())
    const initialCount = result.current.tasks.length
    const idToDelete = result.current.tasks[0].id

    act(() => {
      result.current.deleteTask(idToDelete)
    })

    expect(result.current.tasks.length).toBe(initialCount - 1)
    expect(result.current.tasks.some((t) => t.id === idToDelete)).toBe(false)
  })
})
