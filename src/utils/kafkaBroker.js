/**
 * @fileoverview Motor de Streaming de Eventos y Message Broker estilo Apache Kafka (Mejora 76).
 *
 * CARACTERÍSTICAS:
 * - Arquitectura de Registro de Confirmación Inmutable (Append-Only Commit Log):
 *     1. Tópicos particionados para escalamiento horizontal y paralelismo de lectura/escritura.
 *     2. Asignación determinista de partición mediante hashing de clave (Key-based Partitioning) para garantizar orden estricto por entidad.
 *     3. Grupos de Consumidores (Consumer Groups) con rebalanceo automático de particiones.
 *     4. Gestión de Punteros de Offset (Committed Offset, High Watermark y cálculo de Lag de consumo).
 *     5. Semánticas de entrega de mensajes (At-least-once, At-most-once) y retención configurable.
 *
 * @module utils/kafkaBroker
 */

/**
 * Hashing determinista simple para asignación de partición.
 * @param {string} str
 * @returns {number}
 */
export function hashKey(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Representa una partición individual con su commit log inmutable.
 */
export class KafkaPartition {
  /**
   * @param {number} partitionId
   * @param {string} topicName
   */
  constructor(partitionId, topicName) {
    this.id = partitionId
    this.topic = topicName
    this.messages = [] // Array<{ offset: number, key: string, value: any, timestamp: number, headers: Object }>
    this.nextOffset = 0
  }

  /**
   * Inserta un mensaje de manera atómica al final del log.
   * @param {string|null} key
   * @param {*} value
   * @param {Object} [headers={}]
   * @returns {Object} Mensaje registrado con su offset
   */
  append(key, value, headers = {}) {
    const message = {
      offset: this.nextOffset,
      key: key || null,
      value,
      timestamp: Date.now(),
      headers,
    }
    this.messages.push(message)
    this.nextOffset++
    return message
  }

  /**
   * Lee mensajes a partir de un offset específico.
   * @param {number} fromOffset
   * @param {number} [maxCount=10]
   * @returns {Array<Object>}
   */
  fetch(fromOffset, maxCount = 10) {
    const startIndex = this.messages.findIndex((m) => m.offset >= fromOffset)
    if (startIndex === -1) return []
    return this.messages.slice(startIndex, startIndex + maxCount)
  }

  get highWatermark() {
    return this.nextOffset
  }
}

/**
 * Representa un Tópico de Kafka compuesto por múltiples particiones.
 */
export class KafkaTopic {
  /**
   * @param {string} name
   * @param {number} [partitionsCount=3]
   */
  constructor(name, partitionsCount = 3) {
    this.name = name
    this.partitions = []
    this.roundRobinCounter = 0

    for (let i = 0; i < partitionsCount; i++) {
      this.partitions.push(new KafkaPartition(i, name))
    }
  }

  /**
   * Determina la partición destino para un mensaje.
   * @param {string|null} key
   * @returns {KafkaPartition}
   */
  getPartitionForMessage(key) {
    if (key !== null && key !== undefined) {
      const idx = hashKey(String(key)) % this.partitions.length
      return this.partitions[idx]
    }
    // Round-Robin cuando la clave es nula
    const target = this.partitions[this.roundRobinCounter % this.partitions.length]
    this.roundRobinCounter++
    return target
  }

  /**
   * Publica un mensaje en el tópico.
   */
  produce(key, value, headers = {}) {
    const partition = this.getPartitionForMessage(key)
    const record = partition.append(key, value, headers)
    return {
      topic: this.name,
      partition: partition.id,
      offset: record.offset,
      record,
    }
  }
}

/**
 * Gestor del Clúster de Message Broker Kafka.
 */
export class KafkaClusterBroker {
  constructor() {
    this.topics = new Map() // topicName -> KafkaTopic
    this.consumerGroups = new Map() // groupId -> { id: string, members: Set<string>, committedOffsets: Map<string, number> }
    this.rebalanceListeners = []
  }

  /**
   * Crea un nuevo tópico particionado.
   */
  createTopic(name, partitions = 3) {
    if (this.topics.has(name)) return this.topics.get(name)
    const topic = new KafkaTopic(name, partitions)
    this.topics.set(name, topic)
    return topic
  }

  getTopic(name) {
    return this.topics.get(name)
  }

  /**
   * Registra un consumidor dentro de un Consumer Group y rebalancea particiones.
   * @param {string} groupId
   * @param {string} consumerId
   * @param {string} topicName
   */
  joinConsumerGroup(groupId, consumerId, topicName) {
    let group = this.consumerGroups.get(groupId)
    if (!group) {
      group = {
        id: groupId,
        topic: topicName,
        members: new Set(),
        committedOffsets: new Map(), // "topic#partitionId" -> offset
      }
      this.consumerGroups.set(groupId, group)
    }

    group.members.add(consumerId)
    return this.rebalance(groupId)
  }

  /**
   * Remueve un consumidor de un grupo y dispara rebalanceo de particiones.
   */
  leaveConsumerGroup(groupId, consumerId) {
    const group = this.consumerGroups.get(groupId)
    if (!group) return null
    group.members.delete(consumerId)
    return this.rebalance(groupId)
  }

  /**
   * Rebalancea la asignación de particiones entre los consumidores activos de un grupo.
   * Algoritmo: Range / Round-Robin assignment.
   * @param {string} groupId
   * @returns {Object} Mapa de { [consumerId]: Array<number> } particiones asignadas
   */
  rebalance(groupId) {
    const group = this.consumerGroups.get(groupId)
    if (!group) return {}

    const topic = this.topics.get(group.topic)
    if (!topic) return {}

    const members = Array.from(group.members)
    const assignments = {}
    members.forEach((m) => {
      assignments[m] = []
    })

    if (members.length > 0) {
      topic.partitions.forEach((partition, pIdx) => {
        const assignedMember = members[pIdx % members.length]
        assignments[assignedMember].push(partition.id)
      })
    }

    return assignments
  }

  /**
   * Realiza un commit del offset consumido por un grupo en una partición específica.
   * @param {string} groupId
   * @param {string} topicName
   * @param {number} partitionId
   * @param {number} offset
   */
  commitOffset(groupId, topicName, partitionId, offset) {
    const group = this.consumerGroups.get(groupId)
    if (!group) return false
    const key = `${topicName}#${partitionId}`
    group.committedOffsets.set(key, offset)
    return true
  }

  getCommittedOffset(groupId, topicName, partitionId) {
    const group = this.consumerGroups.get(groupId)
    if (!group) return 0
    const key = `${topicName}#${partitionId}`
    return group.committedOffsets.get(key) || 0
  }

  /**
   * Consume mensajes para un miembro de un Consumer Group.
   */
  poll(groupId, consumerId, maxMessages = 5) {
    const group = this.consumerGroups.get(groupId)
    if (!group) return []

    const topic = this.topics.get(group.topic)
    if (!topic) return []

    const assignments = this.rebalance(groupId)
    const assignedPartitions = assignments[consumerId] || []
    const fetched = []

    assignedPartitions.forEach((pId) => {
      const partition = topic.partitions[pId]
      const currentOffset = this.getCommittedOffset(groupId, group.topic, pId)
      const msgs = partition.fetch(currentOffset, maxMessages)

      if (msgs.length > 0) {
        fetched.push({
          partitionId: pId,
          messages: msgs,
          lastOffset: msgs[msgs.length - 1].offset,
        })
      }
    })

    return fetched
  }

  /**
   * Retorna una instantánea del estado global para visualización en la UI.
   */
  getSnapshot() {
    const topicsList = []
    this.topics.forEach((t) => {
      const partitionsData = t.partitions.map((p) => ({
        id: p.id,
        messagesCount: p.messages.length,
        highWatermark: p.highWatermark,
        messages: p.messages.slice(-6), // últimos 6 mensajes
      }))
      topicsList.push({
        name: t.name,
        partitions: partitionsData,
      })
    })

    const groupsList = []
    this.consumerGroups.forEach((g) => {
      const topic = this.topics.get(g.topic)
      let totalLag = 0
      const partitionStats = []

      if (topic) {
        topic.partitions.forEach((p) => {
          const committed = g.committedOffsets.get(`${g.topic}#${p.id}`) || 0
          const lag = Math.max(0, p.highWatermark - committed)
          totalLag += lag
          partitionStats.push({ partitionId: p.id, committed, highWatermark: p.highWatermark, lag })
        })
      }

      groupsList.push({
        id: g.id,
        topic: g.topic,
        members: Array.from(g.members),
        assignments: this.rebalance(g.id),
        totalLag,
        partitionStats,
      })
    })

    return {
      topics: topicsList,
      consumerGroups: groupsList,
    }
  }
}
