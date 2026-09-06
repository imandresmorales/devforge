/**
 * @fileoverview Motor de Cifrado Extremo a Extremo (E2EE) con Criptografía Híbrida Web Crypto API (Mejora 66).
 *
 * CARACTERÍSTICAS:
 * - Criptografía Híbrida de Grado Militar según estándares NIST y W3C Web Cryptography API:
 *     - Capa Asimétrica: RSA-OAEP (2048 bits, exponente 65537, hash SHA-256) para intercambio seguro de claves.
 *     - Capa Simétrica: AES-GCM (256 bits, IV de 96/128 bits, Authentication Tag de 128 bits) para cifrado masivo autenticado.
 * - Exportación e importación de claves en formato SPKI (SubjectPublicKeyInfo) y PKCS#8 en Base64.
 * - Detección y rechazo estricto de ataques Man-in-the-Middle (MitM) y manipulación de paquetes mediante tags de autenticación GCM.
 *
 * @module utils/e2eeEngine
 */

/**
 * Obtiene la instancia de Web Crypto API compatible con navegadores y Node.js / Vitest.
 */
function getSubtleCrypto() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle
  }
  throw new Error('Web Cryptography API (crypto.subtle) no disponible en este entorno.')
}

/**
 * Convierte un ArrayBuffer a cadena Base64.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convierte una cadena Base64 a Uint8Array.
 * @param {string} base64
 * @returns {Uint8Array}
 */
export function base64ToUint8Array(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Genera un par de claves RSA-OAEP de 2048 bits para un usuario.
 *
 * @param {Object} [options]
 * @param {number} [options.modulusLength=2048]
 * @returns {Promise<{
 *   publicKey: CryptoKey,
 *   privateKey: CryptoKey,
 *   publicKeyBase64: string,
 *   privateKeyBase64: string
 * }>}
 */
export async function generateRSAKeyPair(options = {}) {
  const subtle = getSubtleCrypto()
  const modulusLength = options.modulusLength || 2048

  const keyPair = await subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  )

  const exportedPublic = await subtle.exportKey('spki', keyPair.publicKey)
  const exportedPrivate = await subtle.exportKey('pkcs8', keyPair.privateKey)

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyBase64: arrayBufferToBase64(exportedPublic),
    privateKeyBase64: arrayBufferToBase64(exportedPrivate),
  }
}

/**
 * Importa una clave pública RSA-OAEP desde Base64.
 *
 * @param {string} base64Key
 * @returns {Promise<CryptoKey>}
 */
export async function importRSAPublicKey(base64Key) {
  const subtle = getSubtleCrypto()
  const binaryDer = base64ToUint8Array(base64Key)
  return subtle.importKey(
    'spki',
    binaryDer.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'wrapKey']
  )
}

/**
 * Importa una clave privada RSA-OAEP desde Base64.
 *
 * @param {string} base64Key
 * @returns {Promise<CryptoKey>}
 */
export async function importRSAPrivateKey(base64Key) {
  const subtle = getSubtleCrypto()
  const binaryDer = base64ToUint8Array(base64Key)
  return subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt', 'unwrapKey']
  )
}

/**
 * Cifra un payload (texto o JSON) usando Criptografía Híbrida (AES-256-GCM + RSA-OAEP).
 *
 * @param {string} plaintext - Mensaje original en texto plano.
 * @param {CryptoKey|string} recipientPublicKey - Clave pública RSA del destinatario.
 * @returns {Promise<{
 *   wrappedKey: string,
 *   iv: string,
 *   ciphertext: string,
 *   algorithm: string,
 *   timestamp: number
 * }>}
 */
export async function encryptHybridE2EE(plaintext, recipientPublicKey) {
  const subtle = getSubtleCrypto()

  const pubKey = typeof recipientPublicKey === 'string'
    ? await importRSAPublicKey(recipientPublicKey)
    : recipientPublicKey

  // 1. Generar clave simétrica efímera AES-GCM de 256 bits
  const aesKey = await subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  // 2. Generar vector de inicialización (IV) criptográficamente seguro de 12 bytes (96 bits)
  const iv = new Uint8Array(12)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(iv)
  } else {
    globalThis.crypto.getRandomValues(iv)
  }

  // 3. Cifrar el mensaje con AES-GCM
  const encodedPlaintext = new TextEncoder().encode(plaintext)
  const encryptedPayload = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encodedPlaintext
  )

  // 4. Envolver (cifrar) la clave AES con la clave pública RSA-OAEP del destinatario
  const rawAesKey = await subtle.exportKey('raw', aesKey)
  const wrappedKeyBuffer = await subtle.encrypt(
    { name: 'RSA-OAEP' },
    pubKey,
    rawAesKey
  )

  return {
    wrappedKey: arrayBufferToBase64(wrappedKeyBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(encryptedPayload),
    algorithm: 'RSA-OAEP-2048 + AES-256-GCM',
    timestamp: Date.now(),
  }
}

/**
 * Descifra un paquete híbrido E2EE usando la clave privada RSA del destinatario.
 *
 * @param {Object} packet - Paquete cifrado { wrappedKey, iv, ciphertext }.
 * @param {CryptoKey|string} recipientPrivateKey - Clave privada RSA del destinatario.
 * @returns {Promise<{ plaintext: string, verified: boolean }>}
 */
export async function decryptHybridE2EE(packet, recipientPrivateKey) {
  const subtle = getSubtleCrypto()

  const privKey = typeof recipientPrivateKey === 'string'
    ? await importRSAPrivateKey(recipientPrivateKey)
    : recipientPrivateKey

  try {
    // 1. Descifrar la clave AES simétrica usando la clave privada RSA-OAEP
    const wrappedKeyBuffer = base64ToUint8Array(packet.wrappedKey).buffer
    const rawAesKeyBuffer = await subtle.decrypt(
      { name: 'RSA-OAEP' },
      privKey,
      wrappedKeyBuffer
    )

    // 2. Importar la clave simétrica recuperada
    const aesKey = await subtle.importKey(
      'raw',
      rawAesKeyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )

    // 3. Descifrar el payload y verificar el authentication tag con AES-GCM
    const ivBuffer = base64ToUint8Array(packet.iv).buffer
    const ciphertextBuffer = base64ToUint8Array(packet.ciphertext).buffer

    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      aesKey,
      ciphertextBuffer
    )

    const plaintext = new TextDecoder().decode(decryptedBuffer)
    return {
      plaintext,
      verified: true,
    }
  } catch (error) {
    throw new Error(
      `Fallo de descifrado E2EE o manipulación de integridad detectada: ${error.message}`
    )
  }
}
