/**
 * @fileoverview Tests unitarios para el Motor de Serialización Binaria (Mejora 90).
 */
import { describe, it, expect } from 'vitest'
import {
  encodeVarint,
  decodeVarint,
  serializeProtobuf,
  deserializeProtobuf,
  serializeMessagePack,
  compareSerializationFormats,
} from './binarySerializer'

describe('Binary Serializer & Compression Engine (binarySerializer.js)', () => {
  describe('Codificación y Decodificación Varint (LEB128)', () => {
    it('debe codificar y decodificar enteros de 1 byte (< 128)', () => {
      const bytes = encodeVarint(42)
      expect(bytes).toEqual([42])

      const { value, length } = decodeVarint(new Uint8Array(bytes))
      expect(value).toBe(42)
      expect(length).toBe(1)
    })

    it('debe codificar y decodificar enteros multi-byte (> 127)', () => {
      // 300 = 0x12C -> 0xAC 0x02
      const bytes = encodeVarint(300)
      expect(bytes.length).toBe(2)

      const { value, length } = decodeVarint(new Uint8Array(bytes))
      expect(value).toBe(300)
      expect(length).toBe(2)
    })
  })

  describe('Serialización y Deserialización Protobuf (Schema-driven)', () => {
    const sensorSchema = {
      sensorId: { tag: 1, type: 'int' },
      location: { tag: 2, type: 'string' },
      temperature: { tag: 3, type: 'float' },
      isActive: { tag: 4, type: 'bool' },
    }

    const payload = {
      sensorId: 1045,
      location: 'Datacenter-Rack-A9',
      temperature: 24.5,
      isActive: true,
    }

    it('debe serializar y deserializar sin pérdida de datos (Lossless Roundtrip)', () => {
      const buffer = serializeProtobuf(payload, sensorSchema)
      expect(buffer.length).toBeGreaterThan(0)

      const decoded = deserializeProtobuf(buffer, sensorSchema)
      expect(decoded.sensorId).toBe(1045)
      expect(decoded.location).toBe('Datacenter-Rack-A9')
      expect(decoded.temperature).toBe(24.5)
      expect(decoded.isActive).toBe(true)
    })
  })

  describe('Benchmark Comparativo: JSON vs MessagePack vs Protobuf', () => {
    const schema = {
      orderId: { tag: 1, type: 'int' },
      symbol: { tag: 2, type: 'string' },
      price: { tag: 3, type: 'float' },
      amount: { tag: 4, type: 'int' },
      isFilled: { tag: 5, type: 'bool' },
    }

    const tradeOrder = {
      orderId: 987654,
      symbol: 'BTC-USDT-PERPETUAL',
      price: 64520.5,
      amount: 15,
      isFilled: false,
    }

    it('debe demostrar reducción sustancial de tamaño en Protobuf y MessagePack frente a JSON', () => {
      const result = compareSerializationFormats(tradeOrder, schema)

      expect(result.isRoundtripValid).toBe(true)
      expect(result.jsonBytes).toBeGreaterThan(result.msgpackBytes)
      expect(result.msgpackBytes).toBeGreaterThan(result.protobufBytes)
      expect(result.protobufSavingsPercent).toBeGreaterThan(50) // > 50% de ahorro de ancho de banda
    })
  })
})
