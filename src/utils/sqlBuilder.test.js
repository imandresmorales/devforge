import { describe, it, expect } from 'vitest'
import {
  sanitizeIdentifier,
  getPlaceholder,
  buildParameterizedQuery,
  detectSQLInjectionRisk,
  generateDriverSnippets,
} from './sqlBuilder'

describe('Motor de Construcción SQL y Scanner Anti-SQLi (sqlBuilder.js)', () => {
  describe('sanitizeIdentifier', () => {
    it('formatea y delimita identificadores válidos según el dialecto', () => {
      expect(sanitizeIdentifier('users', 'postgres')).toBe('"users"')
      expect(sanitizeIdentifier('user_profiles', 'mysql')).toBe('`user_profiles`')
      expect(sanitizeIdentifier('orders', 'mssql')).toBe('[orders]')
      expect(sanitizeIdentifier('items', 'sqlite')).toBe('"items"')
    })

    it('rechaza identificadores con caracteres maliciosos o no permitidos', () => {
      expect(() => sanitizeIdentifier('users; DROP TABLE students; --')).toThrow()
      expect(() => sanitizeIdentifier('users" OR 1=1')).toThrow()
      expect(() => sanitizeIdentifier('users id')).toThrow()
      expect(() => sanitizeIdentifier('')).toThrow()
      expect(() => sanitizeIdentifier('   ')).toThrow()
    })
  })

  describe('getPlaceholder', () => {
    it('devuelve los placeholders adecuados según dialecto', () => {
      expect(getPlaceholder(1, 'postgres')).toBe('$1')
      expect(getPlaceholder(2, 'postgres')).toBe('$2')
      expect(getPlaceholder(1, 'mssql')).toBe('@p1')
      expect(getPlaceholder(1, 'mysql')).toBe('?')
      expect(getPlaceholder(1, 'sqlite')).toBe('?')
    })
  })

  describe('buildParameterizedQuery', () => {
    it('construye una consulta SELECT parametrizada para Postgres', () => {
      const { sql, params } = buildParameterizedQuery({
        type: 'SELECT',
        table: 'users',
        columns: ['id', 'email', 'status'],
        where: [
          { column: 'email', operator: '=', value: 'admin@example.com' },
          { column: 'status', operator: '=', value: 'active' },
        ],
        limit: 10,
        dialect: 'postgres',
      })

      expect(sql).toBe('SELECT "id", "email", "status" FROM "users" WHERE "email" = $1 AND "status" = $2 LIMIT 10;')
      expect(params).toEqual(['admin@example.com', 'active'])
    })

    it('construye una consulta SELECT para MySQL con placeholders "?"', () => {
      const { sql, params } = buildParameterizedQuery({
        type: 'SELECT',
        table: 'products',
        columns: ['id', 'price'],
        where: [{ column: 'price', operator: '>', value: 100 }],
        dialect: 'mysql',
      })

      expect(sql).toBe('SELECT `id`, `price` FROM `products` WHERE `price` > ?;')
      expect(params).toEqual([100])
    })

    it('construye una consulta INSERT parametrizada', () => {
      const { sql, params } = buildParameterizedQuery({
        type: 'INSERT',
        table: 'accounts',
        values: { username: 'john_doe', role: 'developer' },
        dialect: 'postgres',
      })

      expect(sql).toBe('INSERT INTO "accounts" ("username", "role") VALUES ($1, $2);')
      expect(params).toEqual(['john_doe', 'developer'])
    })

    it('construye una consulta UPDATE parametrizada', () => {
      const { sql, params } = buildParameterizedQuery({
        type: 'UPDATE',
        table: 'users',
        values: { status: 'suspended' },
        where: [{ column: 'id', operator: '=', value: 42 }],
        dialect: 'postgres',
      })

      expect(sql).toBe('UPDATE "users" SET "status" = $1 WHERE "id" = $2;')
      expect(params).toEqual(['suspended', 42])
    })

    it('construye una consulta DELETE parametrizada', () => {
      const { sql, params } = buildParameterizedQuery({
        type: 'DELETE',
        table: 'sessions',
        where: [{ column: 'token', operator: '=', value: 'xyz123' }],
        dialect: 'mysql',
      })

      expect(sql).toBe('DELETE FROM `sessions` WHERE `token` = ?;')
      expect(params).toEqual(['xyz123'])
    })

    it('maneja cláusulas IN y IS NULL adecuadamente', () => {
      const { sql, params } = buildParameterizedQuery({
        type: 'SELECT',
        table: 'tasks',
        where: [
          { column: 'status', operator: 'IN', value: ['pending', 'in_progress'] },
          { column: 'deleted_at', operator: 'IS NULL' },
        ],
        dialect: 'postgres',
      })

      expect(sql).toBe('SELECT * FROM "tasks" WHERE "status" IN ($1, $2) AND "deleted_at" IS NULL;')
      expect(params).toEqual(['pending', 'in_progress'])
    })
  })

  describe('detectSQLInjectionRisk (Scanner Anti-SQLi)', () => {
    it('detecta tautologías booleanas clásicas como riesgo CRITICAL', () => {
      const check = detectSQLInjectionRisk("' OR '1'='1")
      expect(check.isVulnerable).toBe(true)
      expect(check.riskLevel).toBe('CRITICAL')
      expect(check.matches.length).toBeGreaterThan(0)
      expect(check.score).toBeGreaterThanOrEqual(90)
    })

    it('detecta ataques basados en UNION SELECT como riesgo CRITICAL', () => {
      const check = detectSQLInjectionRisk("' UNION SELECT username, password_hash FROM users --")
      expect(check.isVulnerable).toBe(true)
      expect(check.riskLevel).toBe('CRITICAL')
    })

    it('detecta consultas apiladas (; DROP TABLE) como riesgo CRITICAL', () => {
      const check = detectSQLInjectionRisk("admin'; DROP TABLE logs; --")
      expect(check.isVulnerable).toBe(true)
      expect(check.riskLevel).toBe('CRITICAL')
    })

    it('detecta inyecciones ciegas basadas en tiempo (pg_sleep / WAITFOR DELAY)', () => {
      const check = detectSQLInjectionRisk("'; SELECT pg_sleep(5); --")
      expect(check.isVulnerable).toBe(true)
      expect(check.matches.some((m) => m.name.includes('Tiempo') || m.name.includes('Consultas Apiladas'))).toBe(true)
    })

    it('califica como SAFE las entradas normales sin patrones de inyección', () => {
      const check = detectSQLInjectionRisk('usuario@empresa.com')
      expect(check.isVulnerable).toBe(false)
      expect(check.riskLevel).toBe('SAFE')
      expect(check.score).toBe(0)
    })
  })

  describe('generateDriverSnippets', () => {
    it('genera snippets correctos para pg, mysql2, sqlite y knex', () => {
      const snippets = generateDriverSnippets('SELECT * FROM "users" WHERE "id" = $1;', [42], 'postgres')
      expect(snippets.pg).toContain('pool.query')
      expect(snippets.mysql2).toContain('connection.execute')
      expect(snippets.betterSqlite).toContain('db.prepare')
      expect(snippets.knex).toContain('db.raw')
    })
  })
})
