/**
 * @fileoverview Tests unitarios para el Motor de Cifrado Extremo a Extremo E2EE (Mejora 66).
 * @module utils/e2eeEngine.test
 */
import { describe, it, expect } from 'vitest'
import {
  generateRSAKeyPair,
  importRSAPublicKey,
  importRSAPrivateKey,
  encryptHybridE2EE,
  decryptHybridE2EE,
} from './e2eeEngine'

describe('Motor de Cifrado Extremo a Extremo E2EE (e2eeEngine.js)', () => {
  it('genera pares de claves RSA y las exporta/importa en Base64 correctamente', async () => {
    const keyPair = await generateRSAKeyPair({ modulusLength: 2048 })
    expect(keyPair.publicKeyBase64).toBeDefined()
    expect(keyPair.privateKeyBase64).toBeDefined()

    const importedPub = await importRSAPublicKey(keyPair.publicKeyBase64)
    const importedPriv = await importRSAPrivateKey(keyPair.privateKeyBase64)

    expect(importedPub.type).toBe('public')
    expect(importedPriv.type).toBe('private')
  })

  it('cifra y descifra mensajes de texto plano con verificación de integridad', async () => {
    const alice = await generateRSAKeyPair()
    const bob = await generateRSAKeyPair()

    const secretMessage = 'CONFIDENCIAL: Las credenciales de base de datos son super_secret_123'
    const packet = await encryptHybridE2EE(secretMessage, bob.publicKeyBase64)

    expect(packet.wrappedKey).toBeDefined()
    expect(packet.ciphertext).toBeDefined()
    expect(packet.iv).toBeDefined()
    expect(packet.ciphertext).not.toContain('super_secret_123')

    const decrypted = await decryptHybridE2EE(packet, bob.privateKeyBase64)
    expect(decrypted.verified).toBe(true)
    expect(decrypted.plaintext).toBe(secretMessage)
  })

  it('rechaza el descifrado si un tercero intenta descifrar con una clave privada equivocada', async () => {
    const bob = await generateRSAKeyPair()
    const eve = await generateRSAKeyPair()

    const packet = await encryptHybridE2EE('Mensaje privado para Bob', bob.publicKeyBase64)

    // Eve intenta descifrar con su propia clave privada
    await expect(decryptHybridE2EE(packet, eve.privateKeyBase64)).rejects.toThrow()
  })

  it('detecta manipulación de datos en tránsito (Ataque MitM / Tag de Autenticación inválido)', async () => {
    const bob = await generateRSAKeyPair()
    const packet = await encryptHybridE2EE('Transferir $1,000,000 a cuenta #8849', bob.publicKeyBase64)

    // Simular que el atacante altera 1 byte del texto cifrado
    const tamperedCiphertext = packet.ciphertext.substring(0, packet.ciphertext.length - 4) + 'AAAA'
    const tamperedPacket = {
      ...packet,
      ciphertext: tamperedCiphertext,
    }

    await expect(decryptHybridE2EE(tamperedPacket, bob.privateKeyBase64)).rejects.toThrow(/Fallo de descifrado E2EE/)
  })
})
