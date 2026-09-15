/**
 * @fileoverview Motor de Redes Neuronales y Cómputo en Navegador (Neural Engine).
 *
 * Implementa un Perceptrón Multicapa (MLP) en JavaScript puro con propagación hacia adelante
 * (Forward Propagation), retropropagación de gradientes (Backpropagation), funciones de activación
 * no lineales (ReLU, Sigmoid, Tanh), optimizador con Momentum y mapeo de Fronteras de Decisión en 2D.
 *
 * @module utils/neuralEngine
 */

/**
 * Funciones de activación y sus derivadas para el cálculo del gradiente.
 */
export const ACTIVATIONS = {
  sigmoid: {
    fn: (x) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
    dfn: (fx) => fx * (1 - fx)
  },
  relu: {
    fn: (x) => Math.max(0, x),
    dfn: (fx) => (fx > 0 ? 1 : 0)
  },
  tanh: {
    fn: (x) => Math.tanh(x),
    dfn: (fx) => 1 - fx * fx
  }
}

/**
 * Generador determinista de pesos iniciales usando inicialización He / Xavier.
 * @param {number} rows
 * @param {number} cols
 * @param {string} activation
 * @returns {number[][]}
 */
export function initializeWeights(rows, cols, activation = 'tanh') {
  const scale = activation === 'relu' ? Math.sqrt(2 / cols) : Math.sqrt(1 / cols)
  const weights = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < cols; c++) {
      // Distribución normal aproximada con Box-Muller o pseudoaleatoria centrada
      const u1 = Math.max(1e-6, Math.random())
      const u2 = Math.random()
      const randNorm = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
      row.push(randNorm * scale)
    }
    weights.push(row)
  }
  return weights
}

/**
 * Inicializa un vector de sesgos (biases) en ceros.
 * @param {number} size
 * @returns {number[]}
 */
export function initializeBiases(size) {
  return new Array(size).fill(0)
}

/**
 * Clase Perceptrón Multicapa (MLP)
 */
export class NeuralNetwork {
  /**
   * @param {number[]} topology - Dimensiones de las capas, ej. [2, 4, 1] (2 entradas, 4 neuronas ocultas, 1 salida)
   * @param {string} [activation='tanh'] - Función de activación oculta ('sigmoid' | 'relu' | 'tanh')
   * @param {number} [learningRate=0.08] - Tasa de aprendizaje
   */
  constructor(topology = [2, 4, 1], activation = 'tanh', learningRate = 0.08) {
    this.topology = topology
    this.activationName = activation
    this.activation = ACTIVATIONS[activation] || ACTIVATIONS.tanh
    this.learningRate = learningRate
    this.momentum = 0.85

    this.weights = [] // weights[l] tiene dimensión [topology[l+1], topology[l]]
    this.biases = []  // biases[l] tiene dimensión [topology[l+1]]
    this.prevWeightUpdates = []
    this.prevBiasUpdates = []

    for (let l = 0; l < topology.length - 1; l++) {
      const inDim = topology[l]
      const outDim = topology[l + 1]
      const act = l === topology.length - 2 ? 'sigmoid' : activation
      this.weights.push(initializeWeights(outDim, inDim, act))
      this.biases.push(initializeBiases(outDim))

      // Matrices de momentum
      this.prevWeightUpdates.push(Array.from({ length: outDim }, () => new Array(inDim).fill(0)))
      this.prevBiasUpdates.push(new Array(outDim).fill(0))
    }
  }

  /**
   * Propagación hacia adelante (Forward Pass).
   * @param {number[]} input - Vector de entrada [x1, x2].
   * @returns {{ activations: number[][], preActivations: number[][] }}
   */
  forward(input) {
    const activations = [input]
    const preActivations = []

    let currentA = input

    for (let l = 0; l < this.weights.length; l++) {
      const W = this.weights[l]
      const b = this.biases[l]
      const isOutputLayer = l === this.weights.length - 1

      const z = []
      const a = []

      for (let i = 0; i < W.length; i++) {
        let sum = b[i]
        for (let j = 0; j < W[i].length; j++) {
          sum += W[i][j] * currentA[j]
        }
        z.push(sum)
        // La capa de salida siempre usa Sigmoid para clasificación binaria [0, 1]
        const actFn = isOutputLayer ? ACTIVATIONS.sigmoid.fn : this.activation.fn
        a.push(actFn(sum))
      }

      preActivations.push(z)
      activations.push(a)
      currentA = a
    }

    return { activations, preActivations }
  }

  /**
   * Predice la clase o probabilidad para una entrada dada.
   * @param {number[]} input
   * @returns {number} Probabilidad entre 0 y 1.
   */
  predict(input) {
    const { activations } = this.forward(input)
    return activations[activations.length - 1][0]
  }

  /**
   * Ejecuta un paso de entrenamiento con Backpropagation y Stochastic/Batch Gradient Descent.
   * @param {Array<{ x: number[], y: number }>} dataset
   * @returns {number} Pérdida promedio (Loss) del lote.
   */
  trainEpoch(dataset) {
    let totalLoss = 0

    for (const sample of dataset) {
      const { x, y } = sample
      const { activations, preActivations } = this.forward(x)
      const output = activations[activations.length - 1][0]

      // Binary Cross Entropy Loss: - [y * ln(p) + (1-y) * ln(1-p)]
      const p = Math.max(1e-7, Math.min(1 - 1e-7, output))
      const loss = -(y * Math.log(p) + (1 - y) * Math.log(1 - p))
      totalLoss += loss

      // Backpropagation
      const numLayers = this.weights.length
      let deltas = [] // deltas[l] para cada neurona de la capa l+1

      // Delta de la capa de salida (derivada de BCE combinada con Sigmoid es (output - y))
      const outputDelta = [output - y]
      deltas[numLayers - 1] = outputDelta

      // Retropropagar a las capas ocultas
      for (let l = numLayers - 2; l >= 0; l--) {
        const nextDelta = deltas[l + 1]
        const nextW = this.weights[l + 1]
        const currentA = activations[l + 1]
        const currentDelta = []

        for (let j = 0; j < this.topology[l + 1]; j++) {
          let error = 0
          for (let k = 0; k < nextDelta.length; k++) {
            error += nextDelta[k] * nextW[k][j]
          }
          const df = this.activation.dfn(currentA[j])
          currentDelta.push(error * df)
        }
        deltas[l] = currentDelta
      }

      // Actualizar pesos y sesgos con Momentum
      for (let l = 0; l < numLayers; l++) {
        const delta = deltas[l]
        const inA = activations[l]
        const W = this.weights[l]
        const b = this.biases[l]
        const prevW = this.prevWeightUpdates[l]
        const prevB = this.prevBiasUpdates[l]

        for (let i = 0; i < W.length; i++) {
          for (let j = 0; j < W[i].length; j++) {
            const grad = delta[i] * inA[j]
            const update = this.learningRate * grad + this.momentum * prevW[i][j]
            W[i][j] -= update
            prevW[i][j] = update
          }
          const bGrad = delta[i]
          const bUpdate = this.learningRate * bGrad + this.momentum * prevB[i]
          b[i] -= bUpdate
          prevB[i] = bUpdate
        }
      }
    }

    return totalLoss / dataset.length
  }

  /**
   * Genera una cuadrícula 2D de probabilidades para graficar la frontera de decisión.
   * @param {number} [resolution=20] - Número de divisiones por eje.
   * @returns {Array<{ x: number, y: number, prob: number }>}
   */
  getDecisionGrid(resolution = 20) {
    const grid = []
    const step = 2 / (resolution - 1)
    for (let i = 0; i < resolution; i++) {
      const y = 1 - i * step
      for (let j = 0; j < resolution; j++) {
        const x = -1 + j * step
        const prob = this.predict([x, y])
        grid.push({ x, y, prob })
      }
    }
    return grid
  }
}

/**
 * Genera datasets canónicos de Machine Learning para clasificación no lineal.
 * @param {'xor'|'circles'|'moons'|'linear'} type
 * @param {number} [samples=80]
 * @returns {Array<{ x: number[], y: number }>}
 */
export function generateDataset(type = 'xor', samples = 80) {
  const dataset = []

  if (type === 'xor') {
    // 4 cuadrantes alternados
    for (let i = 0; i < samples; i++) {
      const x1 = (Math.random() * 1.6 - 0.8)
      const x2 = (Math.random() * 1.6 - 0.8)
      const noise1 = (Math.random() - 0.5) * 0.15
      const noise2 = (Math.random() - 0.5) * 0.15
      const label = (x1 > 0 !== x2 > 0) ? 1 : 0
      dataset.push({ x: [x1 + noise1, x2 + noise2], y: label })
    }
  } else if (type === 'circles') {
    // Círculos concéntricos
    for (let i = 0; i < samples; i++) {
      const isInner = Math.random() < 0.5
      const r = isInner ? Math.random() * 0.4 : 0.65 + Math.random() * 0.3
      const angle = Math.random() * Math.PI * 2
      dataset.push({
        x: [r * Math.cos(angle), r * Math.sin(angle)],
        y: isInner ? 1 : 0
      })
    }
  } else if (type === 'moons') {
    // Dos lunas entrelazadas
    const half = Math.floor(samples / 2)
    for (let i = 0; i < half; i++) {
      const angle = (i / half) * Math.PI
      const x1 = Math.cos(angle) * 0.6 - 0.3 + (Math.random() - 0.5) * 0.1
      const x2 = Math.sin(angle) * 0.6 - 0.1 + (Math.random() - 0.5) * 0.1
      dataset.push({ x: [x1, x2], y: 1 })
    }
    for (let i = 0; i < half; i++) {
      const angle = (i / half) * Math.PI
      const x1 = 0.3 - Math.cos(angle) * 0.6 + (Math.random() - 0.5) * 0.1
      const x2 = 0.1 - Math.sin(angle) * 0.6 + (Math.random() - 0.5) * 0.1
      dataset.push({ x: [x1, x2], y: 0 })
    }
  } else {
    // Linealmente separable
    for (let i = 0; i < samples; i++) {
      const x1 = Math.random() * 1.6 - 0.8
      const x2 = Math.random() * 1.6 - 0.8
      const label = x1 + x2 > 0.1 ? 1 : 0
      dataset.push({ x: [x1, x2], y: label })
    }
  }

  return dataset
}
