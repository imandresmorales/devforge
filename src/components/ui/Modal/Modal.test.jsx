import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal.jsx'

describe('Componente UI - Modal.jsx', () => {
  it('no debe renderizar nada en el DOM cuando isOpen es false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        Contenido modal
      </Modal>
    )

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('debe renderizar el título y contenido cuando isOpen es true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Título de Prueba">
        <p>Contenido del diálogo</p>
      </Modal>
    )

    expect(screen.getByText('Título de Prueba')).toBeInTheDocument()
    expect(screen.getByText('Contenido del diálogo')).toBeInTheDocument()
  })

  it('debe llamar a onClose al hacer clic en el botón de cerrar', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Cerrar Test">
        Contenido
      </Modal>
    )

    const closeBtn = screen.getByLabelText('Cerrar ventana modal')
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('debe cerrar al presionar la tecla Escape', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Escape Test">
        Contenido
      </Modal>
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
