/**
 * @fileoverview Editor de Código en Vivo y Sandbox Aislado (Mejora 35).
 *
 * SEGURIDAD CRÍTICA:
 * - El renderizado de vista previa se ejecuta dentro de un <iframe sandbox="allow-scripts">.
 * - Estrictamente NO se incluye 'allow-same-origin' para evitar cualquier acceso al
 *   almacenamiento (localStorage, cookies) o DOM de la aplicación padre.
 *
 * @module components/ui/CodePlayground
 */
import { useState, useMemo } from 'react'
import { useToast } from '../../../context/ToastContext'
import './CodePlayground.css'

export const PLAYGROUND_PRESETS = [
  {
    id: 'glass-card',
    name: '💎 Tarjeta Glassmorphism',
    html: `<div class="glass-card">
  <h2>DevForge Glass</h2>
  <p>Efecto de cristal translúcido con desenfoque de fondo y bordes brillantes.</p>
  <button onclick="alert('¡Efecto interactivo en sandbox seguro!')">Interactuar</button>
</div>`,
    css: `body {
  margin: 0;
  display: grid;
  place-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%);
  font-family: system-ui, sans-serif;
  color: white;
}

.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 24px;
  border-radius: 20px;
  max-width: 320px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

button {
  background: white;
  color: #4f46e5;
  border: none;
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 12px;
}`,
    js: `// Código JavaScript en vivo
console.log('Tarjeta Glassmorphism cargada con éxito.');`,
  },
  {
    id: 'neon-btn',
    name: '⚡ Botón Neón Pulsante',
    html: `<div class="wrapper">
  <button class="neon-btn">DEVFORGE 2026</button>
</div>`,
    css: `body {
  margin: 0;
  display: grid;
  place-items: center;
  min-height: 100vh;
  background: #090d16;
  font-family: system-ui, sans-serif;
}

.neon-btn {
  background: transparent;
  color: #00f0ff;
  border: 2px solid #00f0ff;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 2px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.4), inset 0 0 15px rgba(0, 240, 255, 0.2);
  transition: all 0.3s ease;
}

.neon-btn:hover {
  background: #00f0ff;
  color: #090d16;
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.8);
}`,
    js: `// Animación pulsante
const btn = document.querySelector('.neon-btn');
btn.addEventListener('click', () => {
  btn.style.transform = 'scale(0.95)';
  setTimeout(() => btn.style.transform = 'scale(1)', 150);
});`,
  },
]

function CodePlayground() {
  const [activeTab, setActiveTab] = useState('html') // 'html' | 'css' | 'js'
  const [htmlCode, setHtmlCode] = useState(PLAYGROUND_PRESETS[0].html)
  const [cssCode, setCssCode] = useState(PLAYGROUND_PRESETS[0].css)
  const [jsCode, setJsCode] = useState(PLAYGROUND_PRESETS[0].js)
  const [selectedPresetId, setSelectedPresetId] = useState(PLAYGROUND_PRESETS[0].id)
  const { addToast } = useToast()

  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${cssCode}</style>
</head>
<body>
  ${htmlCode}
  <script>
    try {
      ${jsCode}
    } catch(err) {
      console.error(err);
    }
  </script>
</body>
</html>`
  }, [htmlCode, cssCode, jsCode])

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id)
    setHtmlCode(preset.html)
    setCssCode(preset.css)
    setJsCode(preset.js)
  }

  const handleCopy = () => {
    const full = `<!-- HTML -->\n${htmlCode}\n\n/* CSS */\n${cssCode}\n\n// JS\n${jsCode}`
    navigator.clipboard?.writeText(full)
    addToast({
      type: 'info',
      title: 'Código Copiado',
      message: 'El código HTML, CSS y JS se copió al portapapeles.',
    })
  }

  return (
    <section className="playground-section" aria-label="Editor de código en vivo">
      <div className="playground-header">
        <div>
          <h2 className="playground-title">💻 Live Code Playground (Sandbox Aislado)</h2>
          <p className="playground-subtitle">
            Experimenta con HTML, CSS y JavaScript en tiempo real dentro de un entorno seguro.
          </p>
        </div>
        <div className="playground-presets">
          {PLAYGROUND_PRESETS.map((p) => (
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

      <div className="playground-container">
        {/* Panel Izquierdo: Editor */}
        <div className="playground-editor-pane">
          <div className="playground-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'html'}
              className={`pg-tab${activeTab === 'html' ? ' pg-tab--active' : ''}`}
              onClick={() => setActiveTab('html')}
            >
              HTML
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'css'}
              className={`pg-tab${activeTab === 'css' ? ' pg-tab--active' : ''}`}
              onClick={() => setActiveTab('css')}
            >
              CSS
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'js'}
              className={`pg-tab${activeTab === 'js' ? ' pg-tab--active' : ''}`}
              onClick={() => setActiveTab('js')}
            >
              JavaScript
            </button>
            <div className="pg-tab-actions">
              <button type="button" className="pg-copy-btn" onClick={handleCopy} title="Copiar todo el código">
                📋 Copiar
              </button>
            </div>
          </div>

          <div className="playground-code-area">
            {activeTab === 'html' && (
              <textarea
                className="pg-textarea"
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                placeholder="<!-- Escribe tu HTML aquí -->"
                aria-label="Código HTML"
                spellCheck={false}
              />
            )}
            {activeTab === 'css' && (
              <textarea
                className="pg-textarea"
                value={cssCode}
                onChange={(e) => setCssCode(e.target.value)}
                placeholder="/* Escribe tu CSS aquí */"
                aria-label="Código CSS"
                spellCheck={false}
              />
            )}
            {activeTab === 'js' && (
              <textarea
                className="pg-textarea"
                value={jsCode}
                onChange={(e) => setJsCode(e.target.value)}
                placeholder="// Escribe tu JavaScript aquí"
                aria-label="Código JavaScript"
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Panel Derecho: Vista previa en Sandbox */}
        <div className="playground-preview-pane">
          <div className="playground-preview-bar">
            <span className="pg-dot pg-dot--red" />
            <span className="pg-dot pg-dot--yellow" />
            <span className="pg-dot pg-dot--green" />
            <span className="pg-preview-label">🔒 Sandbox Seguro (allow-scripts)</span>
          </div>
          <iframe
            title="Vista Previa de Código DevForge"
            srcDoc={srcDoc}
            className="playground-iframe"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </section>
  )
}

export default CodePlayground
