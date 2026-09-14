/**
 * @fileoverview Motor de Serialización Binaria y Compresión de Datos (Mejora 90).
 *
 * ARQUITECTURA DE ALTO RENDIMIENTO & gRPC PROTOBUF:
 * - Implementación de codificación de enteros Varint (LEB128).
 * - Serializador y deserializador binario compacto estilo Protocol Buffers (Protobuf v3) con tags y tipos de cable (Wire Types).
 * - Serializador y deserializador binario estilo MessagePack (MsgPack).
 * - Análisis comparativo de huella de memoria (Payload Size), ancho de banda y ratio de compresión vs JSON textual.
 *
 * @module utils/binarySerializer
 */

/**
 * Codifica un entero positivo en formato Varint (LEB128 - Little-Endian Base 128).
 * @param {number} value
 * @returns {number[]} Array de bytes
 */
export function encodeVarint(value) {
  const bytes = []
  let v = Math.floor(value)
  while (v >= 0x80) {
    bytes.push((v & 0x7f) | 0x80)
    v = Math.floor(v / 128)
  }
  bytes.push(v & 0x7f)
  return bytes
}

/**
 * Decodifica un entero Varint a partir de un array de bytes y un offset.
 * @param {Uint8Array|number[]} buffer
 * @param {number} offset
 * @returns {{ value: number, length: number }}
 */
export function decodeVarint(buffer, offset = 0) {
  let result = 0
  let shift = 0
  let count = 0
  while (true) {
    if (offset + count >= buffer.length) {
      throw new Error('Buffer insuficiente para decodificar Varint')
    }
    const byte = buffer[offset + count]
    result |= (byte & 0x7f) << shift
    count++
    if ((byte & 0x80) === 0) break
    shift += 7
  }
  return { value: result, length: count }
}

/**
 * Convierte un string UTF-8 a array de bytes.
 * @param {string} str
 * @returns {Uint8Array}
 */
export function stringToUtf8Bytes(str) {
  return new TextEncoder().encode(str)
}

/**
 * Convierte un array de bytes a string UTF-8.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function utf8BytesToString(bytes) {
  return new TextDecoder().decode(bytes)
}

/**
 * Serializa un objeto plano estructurado en formato Protobuf binario simulado.
 * Esquema de wire types:
 * - 0: Varint (int32, int64, bool)
 * - 2: Length-delimited (string, sub-messages)
 *
 * @param {Object} data - Objeto de datos
 * @param {Object} schema - Mapeo de campo a { tag: number, type: 'int'|'string'|'bool'|'float' }
 * @returns {Uint8Array}
 */
export function serializeProtobuf(data, schema) {
  const bytes = []

  for (const [key, fieldConfig] of Object.entries(schema)) {
    const val = data[key]
    if (val === undefined || val === null) continue

    const tag = fieldConfig.tag
    if (fieldConfig.type === 'int' || fieldConfig.type === 'bool') {
      const wireType = 0
      const tagByte = (tag << 3) | wireType
      bytes.push(...encodeVarint(tagByte))
      bytes.push(...encodeVarint(fieldConfig.type === 'bool' ? (val ? 1 : 0) : Number(val)))
    } else if (fieldConfig.type === 'string') {
      const wireType = 2
      const tagByte = (tag << 3) | wireType
      const strBytes = stringToUtf8Bytes(String(val))
      bytes.push(...encodeVarint(tagByte))
      bytes.push(...encodeVarint(strBytes.length))
      for (let i = 0; i < strBytes.length; i++) {
        bytes.push(strBytes[i])
      }
    } else if (fieldConfig.type === 'float') {
      // Float simulado (wire type 2 con string o representación fija)
      const wireType = 2
      const tagByte = (tag << 3) | wireType
      const floatBytes = stringToUtf8Bytes(Number(val).toFixed(2))
      bytes.push(...encodeVarint(tagByte))
      bytes.push(...encodeVarint(floatBytes.length))
      for (let i = 0; i < floatBytes.length; i++) {
        bytes.push(floatBytes[i])
      }
    }
  }

  return new Uint8Array(bytes)
}

/**
 * Deserializa un buffer Protobuf binario según su esquema.
 *
 * @param {Uint8Array} buffer
 * @param {Object} schema
 * @returns {Object}
 */
export function deserializeProtobuf(buffer, schema) {
  // Construir mapa inverso de tag -> { key, config }
  const tagMap = {}
  for (const [key, config] of Object.entries(schema)) {
    tagMap[config.tag] = { key, config }
  }

  const result = {}
  let offset = 0

  while (offset < buffer.length) {
    const { value: tagByte, length: tagLen } = decodeVarint(buffer, offset)
    offset += tagLen

    const tag = tagByte >> 3
    const wireType = tagByte & 0x07

    const field = tagMap[tag]
    if (!field) {
      // Saltar campo desconocido
      if (wireType === 0) {
        const { length: valLen } = decodeVarint(buffer, offset)
        offset += valLen
      } else if (wireType === 2) {
        const { value: strLen, length: lenBytes } = decodeVarint(buffer, offset)
        offset += lenBytes + strLen
      }
      continue
    }

    if (wireType === 0) {
      const { value, length } = decodeVarint(buffer, offset)
      offset += length
      result[field.key] = field.config.type === 'bool' ? Boolean(value) : value
    } else if (wireType === 2) {
      const { value: len, length: lenBytes } = decodeVarint(buffer, offset)
      offset += lenBytes
      const rawSlice = buffer.subarray(offset, offset + len)
      offset += len
      const strVal = utf8BytesToString(rawSlice)
      result[field.key] = field.config.type === 'float' ? parseFloat(strVal) : strVal
    }
  }

  return result
}

/**
 * Serializador compacto estilo MessagePack (MsgPack).
 * Empaqueta tipos con prefijos de byte binarios sin requerir esquema previo.
 *
 * @param {any} value
 * @returns {Uint8Array}
 */
export function serializeMessagePack(value) {
  const bytes = []

  function pack(val) {
    if (val === null || val === undefined) {
      bytes.push(0xc0) // nil
    } else if (typeof val === 'boolean') {
      bytes.push(val ? 0xc3 : 0xc2)
    } else if (typeof val === 'number') {
      if (Number.isInteger(val) && val >= 0 && val <= 127) {
        bytes.push(val) // positive fixint
      } else {
        bytes.push(0xcb) // float64 tag
        const numBytes = stringToUtf8Bytes(String(val))
        bytes.push(...encodeVarint(numBytes.length))
        for (let i = 0; i < numBytes.length; i++) bytes.push(numBytes[i])
      }
    } else if (typeof val === 'string') {
      const strBytes = stringToUtf8Bytes(val)
      if (strBytes.length <= 31) {
        bytes.push(0xa0 | strBytes.length) // fixstr
      } else {
        bytes.push(0xdb) // str32
        bytes.push(...encodeVarint(strBytes.length))
      }
      for (let i = 0; i < strBytes.length; i++) bytes.push(strBytes[i])
    } else if (Array.isArray(val)) {
      bytes.push(0x90 | Math.min(val.length, 15)) // fixarray
      val.forEach(pack)
    } else if (typeof val === 'object') {
      const keys = Object.keys(val)
      bytes.push(0x80 | Math.min(keys.length, 15)) // fixmap
      keys.forEach((k) => {
        pack(k)
        pack(val[k])
      })
    }
  }

  pack(value)
  return new Uint8Array(bytes)
}

/**
 * Convierte un Uint8Array a representación hexadecimal formateada para inspección.
 * @param {Uint8Array} buffer
 * @returns {string}
 */
export function toHexDump(buffer) {
  const hexParts = []
  for (let i = 0; i < buffer.length; i++) {
    hexParts.push(buffer[i].toString(16).padStart(2, '0').toUpperCase())
  }
  return hexParts.join(' ')
}

/**
 * Ejecuta un benchmark comparativo de serialización entre JSON, MessagePack y Protobuf.
 *
 * @param {Object} payload - Datos a serializar
 * @param {Object} schema - Esquema Protobuf
 * @returns {{
 *   jsonBytes: number,
 *   msgpackBytes: number,
 *   protobufBytes: number,
 *   msgpackSavingsPercent: number,
 *   protobufSavingsPercent: number,
 *   jsonHex: string,
 *   msgpackHex: string,
 *   protobufHex: string,
 *   isRoundtripValid: boolean
 * }}
 */
export function compareSerializationFormats(payload, schema) {
  // 1. JSON
  const jsonStr = JSON.stringify(payload)
  const jsonBuf = stringToUtf8Bytes(jsonStr)
  const jsonBytes = jsonBuf.length

  // 2. MessagePack
  const msgpackBuf = serializeMessagePack(payload)
  const msgpackBytes = msgpackBuf.length

  // 3. Protobuf
  const protobufBuf = serializeProtobuf(payload, schema)
  const protobufBytes = protobufBuf.length

  // Validar roundtrip de Protobuf
  const decodedProtobuf = deserializeProtobuf(protobufBuf, schema)
  const isRoundtripValid = Object.keys(schema).every((k) => {
    return String(decodedProtobuf[k]) === String(payload[k])
  })

  const msgpackSavingsPercent = Number((((jsonBytes - msgpackBytes) / jsonBytes) * 100).toFixed(1))
  const protobufSavingsPercent = Number((((jsonBytes - protobufBytes) / jsonBytes) * 100).toFixed(1))

  return {
    jsonBytes,
    msgpackBytes,
    protobufBytes,
    msgpackSavingsPercent,
    protobufSavingsPercent,
    jsonHex: toHexDump(jsonBuf.slice(0, 32)),
    msgpackHex: toHexDump(msgpackBuf.slice(0, 32)),
    protobufHex: toHexDump(protobufBuf),
    isRoundtripValid,
  }
}
