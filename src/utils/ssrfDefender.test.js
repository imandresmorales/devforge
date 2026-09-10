/**
 * @fileoverview Tests unitarios para el Motor Anti-SSRF (Mejora 77).
 * @module utils/ssrfDefender.test
 */
import { describe, it, expect } from 'vitest'
import {
  ipToNumber,
  normalizeHost,
  isPrivateOrReservedIp,
  validateSafeUrl,
} from './ssrfDefender'

describe('Motor de Protección y Mitigación Anti-SSRF (ssrfDefender.js)', () => {
  describe('Conversión de IPs y Desofuscación de Hosts', () => {
    it('convierte cadenas IPv4 a enteros de 32 bits', () => {
      expect(ipToNumber('127.0.0.1')).toBe(2130706433)
      expect(ipToNumber('192.168.1.1')).toBe(3232235777)
      expect(ipToNumber('invalid.ip')).toBeNull()
    })

    it('desofusca representaciones hexadecimales y decimales de IP', () => {
      expect(normalizeHost('2130706433')).toBe('127.0.0.1')
      expect(normalizeHost('0x7f000001')).toBe('127.0.0.1')
      expect(normalizeHost('localhost')).toBe('127.0.0.1')
      expect(normalizeHost('::1')).toBe('127.0.0.1')
    })
  })

  describe('Detección de Rangos Reservados y Privados (RFC 1918, RFC 3927, RFC 5735)', () => {
    it('identifica direcciones de Loopback (127.0.0.0/8)', () => {
      expect(isPrivateOrReservedIp('127.0.0.1').isPrivate).toBe(true)
      expect(isPrivateOrReservedIp('127.1.2.3').isPrivate).toBe(true)
    })

    it('identifica redes privadas RFC 1918 (10.x, 172.16.x, 192.168.x)', () => {
      expect(isPrivateOrReservedIp('10.0.0.5').isPrivate).toBe(true)
      expect(isPrivateOrReservedIp('172.20.1.1').isPrivate).toBe(true)
      expect(isPrivateOrReservedIp('192.168.0.1').isPrivate).toBe(true)
    })

    it('identifica rangos de Cloud Metadata Link-Local (169.254.169.254)', () => {
      expect(isPrivateOrReservedIp('169.254.169.254').isPrivate).toBe(true)
    })

    it('permite direcciones IP públicas globales legítimas', () => {
      expect(isPrivateOrReservedIp('8.8.8.8').isPrivate).toBe(false)
      expect(isPrivateOrReservedIp('1.1.1.1').isPrivate).toBe(false)
      expect(isPrivateOrReservedIp('104.244.42.1').isPrivate).toBe(false)
    })
  })

  describe('Validador de URLs y Firewall Anti-SSRF (validateSafeUrl)', () => {
    it('bloquea protocolos peligrosos no HTTP (file, gopher, dict, ftp)', () => {
      const resFile = validateSafeUrl('file:///etc/passwd')
      expect(resFile.isValid).toBe(false)
      expect(resFile.verdict).toBe('BLOCKED_SSRF')
      expect(resFile.issues.some((i) => i.title.includes('Protocolo'))).toBe(true)

      const resGopher = validateSafeUrl('gopher://127.0.0.1:6379/_flushall')
      expect(resGopher.isValid).toBe(false)
    })

    it('bloquea intentos de robo de credenciales de AWS Metadata IMDSv1', () => {
      const res = validateSafeUrl('http://169.254.169.254/latest/meta-data/iam/security-credentials/')
      expect(res.isValid).toBe(false)
      expect(res.issues.some((i) => i.title.includes('Cloud Metadata'))).toBe(true)
    })

    it('bloquea accesos ofuscados a localhost con notación decimal entera', () => {
      const res = validateSafeUrl('http://2130706433:8080/admin/delete')
      expect(res.isValid).toBe(false)
      expect(res.parsed.normalizedIp).toBe('127.0.0.1')
    })

    it('aprueba URLs públicas legítimas y seguras', () => {
      const res = validateSafeUrl('https://api.github.com/repos/devforge/app')
      expect(res.isValid).toBe(true)
      expect(res.verdict).toBe('ALLOWED_SAFE')
      expect(res.issues).toHaveLength(0)
    })
  })
})
