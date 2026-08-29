import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CodePlayground, { PLAYGROUND_PRESETS } from './CodePlayground'
import { ToastProvider } from '../../../context/ToastContext'

function renderPlayground() {
  return render(
    <ToastProvider>
      <CodePlayground />
    </ToastProvider>
  )
}

describe('CodePlayground Component (CodePlayground.jsx)', () => {
  it('debe renderizar el título y los presets de código', () => {
    renderPlayground()
    expect(screen.getByText(/Live Code Playground/i)).toBeDefined()
    expect(screen.getByText(PLAYGROUND_PRESETS[0].name)).toBeDefined()
  })

  it('debe contener un iframe con sandbox="allow-scripts"', () => {
    renderPlayground()
    const iframe = screen.getByTitle('Vista Previa de Código DevForge')
    expect(iframe).toBeDefined()
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts')
  })

  it('debe alternar entre pestañas HTML, CSS y JavaScript', () => {
    renderPlayground()
    const cssTab = screen.getByRole('tab', { name: /CSS/i })
    fireEvent.click(cssTab)
    expect(cssTab.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByLabelText('Código CSS')).toBeDefined()
  })
})
