/**
 * @fileoverview Motor de partículas de confeti nativo acelerado por GPU en HTML5 Canvas (Mejora 41).
 *
 * CARACTERÍSTICAS:
 * - Cero dependencias externas.
 * - Simulación física con aceleración gravitacional, dispersión radial y resistencia del aire.
 * - Auto-limpieza del elemento Canvas al terminar la animación.
 *
 * @module utils/confetti
 */

export function fireConfetti({ particleCount = 80, durationMs = 2500 } = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '999999'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  const width = (canvas.width = window.innerWidth)
  const height = (canvas.height = window.innerHeight)

  const colors = ['#4f46e5', '#7c3aed', '#db2777', '#10b981', '#fbbf24', '#00f0ff', '#f43f5e']

  const particles = Array.from({ length: particleCount }).map(() => ({
    x: width / 2,
    y: height / 2 + 50,
    vx: (Math.random() - 0.5) * 16,
    vy: (Math.random() - 0.7) * 18,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    opacity: 1,
  }))

  const startTime = performance.now()

  function update() {
    const elapsed = performance.now() - startTime
    const progress = elapsed / durationMs

    if (progress >= 1) {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas)
      }
      return
    }

    ctx.clearRect(0, 0, width, height)

    particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.35 // Gravedad
      p.vx *= 0.98 // Resistencia del aire
      p.rotation += p.rotationSpeed
      p.opacity = Math.max(0, 1 - progress)

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.opacity
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
    })

    requestAnimationFrame(update)
  }

  requestAnimationFrame(update)
}
