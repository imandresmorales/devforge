/**
 * @fileoverview Tests unitarios para el Auditor de Inyección SQL de Segundo Orden (Mejora 92).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  SimulatedDatabase,
  SECOND_ORDER_SQLI_PAYLOADS,
} from './secondOrderSqliAuditor'

describe('Second-Order SQL Injection & Parameterized Engine (secondOrderSqliAuditor.js)', () => {
  let db

  beforeEach(() => {
    db = new SimulatedDatabase()
  })

  describe('Flujo de Ataque en 2 Pasos: Almacenamiento y Disparo', () => {
    it('debe registrar el payload de forma inocua en el paso 1', () => {
      const payload = "admin'--"
      const user = db.insertUser(payload, 'attacker@evil.com')

      expect(user.id).toBe(4)
      expect(user.username).toBe("admin'--")
      expect(db.users.length).toBe(4)
    })

    it('la consulta vulnerable debe desbordarse al ejecutar el payload almacenado (Paso 2)', () => {
      const payload = "' OR '1'='1"
      db.insertUser(payload, 'attacker@evil.com')

      const vulnRes = db.executeVulnerableProfileAudit(payload)
      expect(vulnRes.isCompromised).toBe(true)
      expect(vulnRes.affectedRows.length).toBeGreaterThan(1) // Expone toda la tabla
      expect(vulnRes.rawSql).toContain("WHERE username = '' OR '1'='1'")
    })

    it('la consulta parametrizada debe neutralizar el ataque tratando el payload como texto literal plano', () => {
      const payload = "' OR '1'='1"
      db.insertUser(payload, 'attacker@evil.com')

      const secureRes = db.executeParameterizedProfileAudit(payload)
      expect(secureRes.isCompromised).toBe(false)
      expect(secureRes.preparedSql).toBe('SELECT id, username, email, role, balance FROM users WHERE username = $1')
      expect(secureRes.params).toEqual([payload])
      expect(secureRes.affectedRows.length).toBe(1) // Solo el usuario con ese nombre exacto
      expect(secureRes.affectedRows[0].username).toBe(payload)
    })
  })

  describe('Ejecución de Consultas Legítimas', () => {
    it('debe retornar correctamente el usuario solicitado sin alertas para nombres válidos', () => {
      const secureRes = db.executeParameterizedProfileAudit('john_dev')
      expect(secureRes.isCompromised).toBe(false)
      expect(secureRes.affectedRows.length).toBe(1)
      expect(secureRes.affectedRows[0].username).toBe('john_dev')
    })
  })
})
