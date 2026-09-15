/**
 * @fileoverview Componente NeuralNetworkExplorer — Simulador de Red Neuronal en Navegador.
 *
 * MEJORA 96: Inferencia y Entrenamiento de Redes Neuronales en Tiempo Real (Edge AI).
 * Visualizador interactivo 2D de Frontera de Decisión (Decision Boundary Heatmap),
 * topología de capas multicapa, curvas de Loss y datasets de clasificación no lineal (XOR, Circles, Moons).
 *
 * @module components/ui/NeuralNetworkExplorer
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  NeuralNetwork,
  generateDataset
} from '../../../utils/neuralEngine.js'
import './NeuralNetworkExplorer.css'

export default function NeuralNetworkExplorer() {
  const [datasetType, setDatasetType] = useState('xor')
  const [hiddenNeurons, setHiddenNeurons] = useState(6)
  const [activation, setActivation] = useState('tanh')
  const [learningRate, setLearningRate] = useState(0.12)
  const [epoch, setEpoch] = useState(0)
  const [loss, setLoss] = useState(0)
  const [lossHistory, setLossHistory] = useState([])
  const [isTraining, setIsTraining] = useState(false)

  // Generar dataset inicial
  const [dataset, setDataset] = useState(() => generateDataset('xor', 80))

  // Instancia de la red
  const networkRef = useRef(null)

  // Inicializar o resetear la red
  const resetNetwork = (type = datasetType, neurons = hiddenNeurons, act = activation, lr = learningRate) => {
    setIsTraining(false)
    const newNet = new NeuralNetwork([2, neurons, 1], act, lr)
    networkRef.current = newNet
    const newDataset = generateDataset(type, 80)
    setDataset(newDataset)
    setEpoch(0)
    const initLoss = newNet.trainEpoch(newDataset)
    setLoss(initLoss)
    setLossHistory([initLoss])
  }

  useEffect(() => {
    resetNetwork()
  }, [])

  // Bucle de entrenamiento interactivo con requestAnimationFrame / interval
  useEffect(() => {
    let timerId = null
    if (isTraining && networkRef.current) {
      timerId = setInterval(() => {
        let currentLoss = 0
        // Ejecutar 5 épocas por frame para entrenamiento ultra fluido
        for (let i = 0; i < 5; i++) {
          currentLoss = networkRef.current.trainEpoch(dataset)
        }
        setEpoch(prev => prev + 5)
        setLoss(currentLoss)
        setLossHistory(prev => [...prev.slice(-30), currentLoss])
      }, 50)
    }
    return () => {
      if (timerId) clearInterval(timerId)
    }
  }, [isTraining, dataset])

  // Cuadrícula de frontera de decisión (18x18 resolución)
  const decisionGrid = useMemo(() => {
    if (!networkRef.current) return []
    return networkRef.current.getDecisionGrid(18)
  }, [epoch, datasetType, hiddenNeurons, activation])

  return (
    <section className="nn-explorer" aria-labelledby="nn-title">
      <div className="nn-header">
        <div className="nn-header__badge">
          <span>MEJORA 96</span>
          <span className="nn-badge-tag">Edge AI & Machine Learning en el Cliente</span>
        </div>
        <h2 id="nn-title" className="nn-header__title">
          Simulador de Red Neuronal en Navegador (Backpropagation & Decision Boundary)
        </h2>
        <p className="nn-header__desc">
          Entrenamiento e inferencia de un Perceptrón Multicapa (MLP) ejecutado 100% en WebAssembly/JavaScript sin servidores externos. Observe cómo la frontera de decisión no lineal se adapta en tiempo real para clasificar los datos.
        </p>
      </div>

      {/* Controles de Hiperparámetros */}
      <div className="nn-controls-bar">
        <div className="nn-control-group">
          <label className="nn-label">Dataset Benchmark:</label>
          <select
            className="nn-select"
            value={datasetType}
            onChange={(e) => {
              const val = e.target.value
              setDatasetType(val)
              resetNetwork(val, hiddenNeurons, activation, learningRate)
            }}
          >
            <option value="xor">Problema No Lineal XOR</option>
            <option value="circles">Círculos Concéntricos</option>
            <option value="moons">Dos Lunas Entrelazadas</option>
            <option value="linear">Linealmente Separable</option>
          </select>
        </div>

        <div className="nn-control-group">
          <label className="nn-label">Neuronas Ocultas:</label>
          <select
            className="nn-select"
            value={hiddenNeurons}
            onChange={(e) => {
              const val = Number(e.target.value)
              setHiddenNeurons(val)
              resetNetwork(datasetType, val, activation, learningRate)
            }}
          >
            <option value={3}>3 Neuronas</option>
            <option value={6}>6 Neuronas (Recomendado)</option>
            <option value={8}>8 Neuronas</option>
          </select>
        </div>

        <div className="nn-control-group">
          <label className="nn-label">Activación:</label>
          <select
            className="nn-select"
            value={activation}
            onChange={(e) => {
              const val = e.target.value
              setActivation(val)
              resetNetwork(datasetType, hiddenNeurons, val, learningRate)
            }}
          >
            <option value="tanh">Tanh (Hiperbólica)</option>
            <option value="relu">ReLU</option>
            <option value="sigmoid">Sigmoid</option>
          </select>
        </div>

        <div className="nn-actions-group">
          <button
            className={`nn-btn ${isTraining ? 'nn-btn--stop' : 'nn-btn--train'}`}
            onClick={() => setIsTraining(prev => !prev)}
          >
            {isTraining ? '⏸ Pausar Entrenamiento' : '▶ Iniciar Entrenamiento'}
          </button>
          <button
            className="nn-btn nn-btn--reset"
            onClick={() => resetNetwork()}
          >
            ↺ Reiniciar Pesos
          </button>
        </div>
      </div>

      {/* Panel Principal: Canvas 2D + Métricas y Topología */}
      <div className="nn-main-grid">
        {/* Canvas de Frontera de Decisión */}
        <div className="nn-canvas-card">
          <div className="nn-canvas-header">
            <h4>Mapeo de la Frontera de Decisión 2D</h4>
            <span className="nn-epoch-badge">Época: <strong>{epoch}</strong></span>
          </div>

          <div className="nn-canvas-container">
            <svg viewBox="0 0 360 360" className="nn-svg-canvas">
              {/* Celdas del Heatmap de Frontera */}
              {decisionGrid.map((cell, idx) => {
                const cellW = 360 / 18
                const cellH = 360 / 18
                const svgX = ((cell.x + 1) / 2) * 360 - cellW / 2
                const svgY = ((1 - cell.y) / 2) * 360 - cellH / 2
                // Azul para clase 1, Naranja para clase 0
                const blueAlpha = Math.max(0, cell.prob - 0.5) * 2
                const orangeAlpha = Math.max(0, 0.5 - cell.prob) * 2
                const fillColor = cell.prob >= 0.5
                  ? `rgba(59, 130, 246, ${0.15 + blueAlpha * 0.45})`
                  : `rgba(249, 115, 22, ${0.15 + orangeAlpha * 0.45})`

                return (
                  <rect
                    key={idx}
                    x={svgX}
                    y={svgY}
                    width={cellW + 1}
                    height={cellH + 1}
                    fill={fillColor}
                  />
                )
              })}

              {/* Puntos de Entrenamiento del Dataset */}
              {dataset.map((pt, i) => {
                const cx = ((pt.x[0] + 1) / 2) * 360
                const cy = ((1 - pt.x[1]) / 2) * 360
                const isClass1 = pt.y === 1

                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={isClass1 ? '#3b82f6' : '#f97316'}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    className="nn-point"
                  />
                )
              })}
            </svg>
          </div>

          <div className="nn-legend">
            <div className="nn-legend-item">
              <span className="nn-legend-dot nn-legend-dot--blue" />
              <span>Clase 1 ($y = 1$)</span>
            </div>
            <div className="nn-legend-item">
              <span className="nn-legend-dot nn-legend-dot--orange" />
              <span>Clase 0 ($y = 0$)</span>
            </div>
          </div>
        </div>

        {/* Panel Lateral: Métricas de Loss y Arquitectura */}
        <div className="nn-stats-panel">
          <div className="nn-metric-box">
            <span className="nn-metric-label">Función de Pérdida (Loss BCE):</span>
            <span className="nn-metric-value">{loss.toFixed(4)}</span>
          </div>

          {/* Gráfico Sparkline de Pérdida */}
          <div className="nn-sparkline-box">
            <span className="nn-sparkline-title">Evolución de Pérdida por Época</span>
            <svg viewBox="0 0 240 60" className="nn-sparkline-svg">
              {lossHistory.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  points={lossHistory.map((val, i) => {
                    const x = (i / (lossHistory.length - 1)) * 230 + 5
                    const y = Math.min(55, Math.max(5, (val / 1.0) * 50))
                    return `${x},${y}`
                  }).join(' ')}
                />
              )}
            </svg>
          </div>

          {/* Diagrama de Topología */}
          <div className="nn-topology-card">
            <h4>Topología de Capas MLP</h4>
            <div className="nn-layers-diagram">
              <div className="nn-layer">
                <span className="nn-layer-name">Entrada</span>
                <span className="nn-neuron-badge">2 Neuronas ($X_1, X_2$)</span>
              </div>
              <div className="nn-arrow">➔</div>
              <div className="nn-layer">
                <span className="nn-layer-name">Capa Oculta</span>
                <span className="nn-neuron-badge nn-neuron-badge--hidden">
                  {hiddenNeurons} Neuronas ({activation})
                </span>
              </div>
              <div className="nn-arrow">➔</div>
              <div className="nn-layer">
                <span className="nn-layer-name">Salida</span>
                <span className="nn-neuron-badge">1 Neurona ($\hat{y}$)</span>
              </div>
            </div>
          </div>

          <div className="nn-features-list">
            <div className="nn-feature-pill">⚡ Cero Llamadas a Servidor</div>
            <div className="nn-feature-pill">🔄 Backprop con Momentum (0.85)</div>
            <div className="nn-feature-pill">🎯 Inicialización He / Xavier</div>
          </div>
        </div>
      </div>
    </section>
  )
}
