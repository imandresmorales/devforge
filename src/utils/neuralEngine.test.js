import { describe, it, expect } from 'vitest'
import {
  NeuralNetwork,
  ACTIVATIONS,
  generateDataset,
  initializeWeights
} from './neuralEngine.js'

describe('neuralEngine — In-Browser Multi-Layer Perceptron (MLP)', () => {
  it('inicializa matrices de pesos con dimensiones algebraicas correctas', () => {
    const weights = initializeWeights(4, 2, 'tanh')
    expect(weights).toHaveLength(4)
    expect(weights[0]).toHaveLength(2)
  })

  it('calcula funciones de activación y derivadas con precisión numérica', () => {
    // Sigmoid
    expect(ACTIVATIONS.sigmoid.fn(0)).toBeCloseTo(0.5)
    expect(ACTIVATIONS.sigmoid.dfn(0.5)).toBeCloseTo(0.25)

    // ReLU
    expect(ACTIVATIONS.relu.fn(5)).toBe(5)
    expect(ACTIVATIONS.relu.fn(-3)).toBe(0)
    expect(ACTIVATIONS.relu.dfn(2)).toBe(1)
    expect(ACTIVATIONS.relu.dfn(-2)).toBe(0)

    // Tanh
    expect(ACTIVATIONS.tanh.fn(0)).toBeCloseTo(0)
    expect(ACTIVATIONS.tanh.dfn(0)).toBeCloseTo(1)
  })

  it('ejecuta forward propagation retornando activaciones válidas para cada capa', () => {
    const net = new NeuralNetwork([2, 4, 1], 'tanh', 0.1)
    const { activations, preActivations } = net.forward([0.5, -0.5])

    // Capas: Input (2), Oculta (4), Salida (1)
    expect(activations).toHaveLength(3)
    expect(activations[0]).toEqual([0.5, -0.5])
    expect(activations[1]).toHaveLength(4)
    expect(activations[2]).toHaveLength(1)
    expect(activations[2][0]).toBeGreaterThanOrEqual(0)
    expect(activations[2][0]).toBeLessThanOrEqual(1)
  })

  it('reduce la pérdida (Loss) tras entrenar con backpropagation sobre dataset lineal', () => {
    const net = new NeuralNetwork([2, 4, 1], 'tanh', 0.15)
    const dataset = generateDataset('linear', 40)

    const initialLoss = net.trainEpoch(dataset)
    let finalLoss = initialLoss

    for (let epoch = 0; epoch < 30; epoch++) {
      finalLoss = net.trainEpoch(dataset)
    }

    expect(finalLoss).toBeLessThan(initialLoss)
  })

  it('genera una cuadrícula 2D de probabilidades de frontera de decisión', () => {
    const net = new NeuralNetwork([2, 3, 1], 'tanh', 0.1)
    const grid = net.getDecisionGrid(10)

    expect(grid).toHaveLength(100) // 10 x 10
    expect(grid[0]).toHaveProperty('x')
    expect(grid[0]).toHaveProperty('y')
    expect(grid[0]).toHaveProperty('prob')
    expect(grid[0].prob).toBeGreaterThanOrEqual(0)
    expect(grid[0].prob).toBeLessThanOrEqual(1)
  })
})
