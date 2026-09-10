/**
 * @fileoverview Tests unitarios para el Motor de Message Broker Kafka (Mejora 76).
 * @module utils/kafkaBroker.test
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  hashKey,
  KafkaPartition,
  KafkaTopic,
  KafkaClusterBroker,
} from './kafkaBroker'

describe('Motor de Message Broker y Commit Log Kafka (kafkaBroker.js)', () => {
  describe('Partición y Commit Log Inmutable', () => {
    let partition

    beforeEach(() => {
      partition = new KafkaPartition(0, 'orders-events')
    })

    it('añade mensajes con offsets monótonos incrementales', () => {
      const m1 = partition.append('order_1', { amount: 100 })
      const m2 = partition.append('order_2', { amount: 250 })

      expect(m1.offset).toBe(0)
      expect(m2.offset).toBe(1)
      expect(partition.highWatermark).toBe(2)
      expect(partition.messages).toHaveLength(2)
    })

    it('permite leer mensajes a partir de un offset específico', () => {
      partition.append('k1', 'val1')
      partition.append('k2', 'val2')
      partition.append('k3', 'val3')

      const fetched = partition.fetch(1, 2)
      expect(fetched).toHaveLength(2)
      expect(fetched[0].offset).toBe(1)
      expect(fetched[1].offset).toBe(2)
    })
  })

  describe('Tópicos y Estrategia de Particionamiento por Clave', () => {
    let topic

    beforeEach(() => {
      topic = new KafkaTopic('payments', 3)
    })

    it('dirige mensajes con la misma clave a la misma partición (Garantía de Orden)', () => {
      const p1 = topic.produce('user_4482', { action: 'checkout' })
      const p2 = topic.produce('user_4482', { action: 'payment_success' })
      const p3 = topic.produce('user_4482', { action: 'invoice_generated' })

      expect(p1.partition).toBe(p2.partition)
      expect(p2.partition).toBe(p3.partition)
    })

    it('distribuye mensajes mediante Round-Robin si la clave es nula', () => {
      const p1 = topic.produce(null, 'event_a')
      const p2 = topic.produce(null, 'event_b')
      const p3 = topic.produce(null, 'event_c')

      expect(p1.partition).toBe(0)
      expect(p2.partition).toBe(1)
      expect(p3.partition).toBe(2)
    })
  })

  describe('Consumer Groups, Rebalanceo y Cálculo de Lag', () => {
    let broker

    beforeEach(() => {
      broker = new KafkaClusterBroker()
      broker.createTopic('telemetry', 3) // 3 particiones: 0, 1, 2
    })

    it('rebalancea particiones equitativamente entre consumidores activos', () => {
      broker.joinConsumerGroup('analytics-group', 'consumer-1', 'telemetry')
      let assignments = broker.rebalance('analytics-group')
      expect(assignments['consumer-1']).toEqual([0, 1, 2])

      // Se une un segundo consumidor
      broker.joinConsumerGroup('analytics-group', 'consumer-2', 'telemetry')
      assignments = broker.rebalance('analytics-group')
      expect(assignments['consumer-1']).toEqual([0, 2])
      expect(assignments['consumer-2']).toEqual([1])
    })

    it('consume mensajes, actualiza committed offsets y calcula el lag', () => {
      const topic = broker.getTopic('telemetry')
      topic.produce('sensor_1', { temp: 24.5 }) // P_x
      topic.produce('sensor_2', { temp: 28.1 })
      topic.produce('sensor_3', { temp: 19.4 })

      broker.joinConsumerGroup('iot-group', 'c1', 'telemetry')
      const pollResult = broker.poll('iot-group', 'c1')

      expect(pollResult.length).toBeGreaterThan(0)
      const firstBatch = pollResult[0]

      // Commit offset
      broker.commitOffset('iot-group', 'telemetry', firstBatch.partitionId, firstBatch.lastOffset + 1)
      const committed = broker.getCommittedOffset('iot-group', 'telemetry', firstBatch.partitionId)
      expect(committed).toBe(firstBatch.lastOffset + 1)
    })
  })
})
