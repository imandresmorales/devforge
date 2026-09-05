import { describe, it, expect } from 'vitest'
import {
  checkRbacPermission,
  evaluateAccess,
  RBAC_ROLES,
} from './accessControl'

describe('Motor de Control de Acceso RBAC & ABAC (accessControl.js)', () => {
  describe('checkRbacPermission', () => {
    it('permite cualquier acción al rol con wildcard "*"', () => {
      expect(checkRbacPermission(['*'], 'billing:delete')).toBe(true)
      expect(checkRbacPermission(['*'], 'repo:deploy')).toBe(true)
    })

    it('evalúa permisos con namespaces específicos (ej. "repo:*")', () => {
      const devPerms = RBAC_ROLES.developer.permissions
      expect(checkRbacPermission(devPerms, 'repo:push')).toBe(true)
      expect(checkRbacPermission(devPerms, 'repo:clone')).toBe(true)
      expect(checkRbacPermission(devPerms, 'billing:refund')).toBe(false)
    })
  })

  describe('evaluateAccess (Deny-Overrides & ABAC)', () => {
    const baseSubject = {
      id: 'usr_100',
      name: 'Alex Developer',
      role: 'developer',
      department: 'Engineering',
      isMfaVerified: true,
      tenantId: 'tenant_acme',
    }

    const baseResource = {
      id: 'repo_devforge_core',
      type: 'repo',
      classification: 'INTERNAL',
      ownerId: 'usr_100',
      tenantId: 'tenant_acme',
    }

    const baseEnv = {
      clientIp: '10.10.4.5',
      isCorporateNetwork: true,
      isWorkingHours: true,
    }

    it('permite acceso legítimo cuando RBAC coincide y no hay reglas DENY', () => {
      const decision = evaluateAccess({
        subject: baseSubject,
        action: 'repo:read',
        resource: baseResource,
        environment: baseEnv,
      })

      expect(decision.isAllowed).toBe(true)
      expect(decision.decision).toBe('PERMIT')
      expect(decision.statusCode).toBe(200)
    })

    it('bloquea acceso a recursos confidenciales si el usuario no tiene MFA verificado', () => {
      const decision = evaluateAccess({
        subject: { ...baseSubject, isMfaVerified: false },
        action: 'repo:read',
        resource: { ...baseResource, classification: 'CONFIDENTIAL' },
        environment: baseEnv,
      })

      expect(decision.isAllowed).toBe(false)
      expect(decision.decision).toBe('DENY')
      expect(decision.statusCode).toBe(403)
      expect(decision.reasons.some((r) => r.includes('MFA'))).toBe(true)
    })

    it('bloquea acceso a recursos de otro tenant (Aislamiento Multi-Tenant)', () => {
      const decision = evaluateAccess({
        subject: baseSubject,
        action: 'repo:read',
        resource: { ...baseResource, tenantId: 'tenant_other_corp' },
        environment: baseEnv,
      })

      expect(decision.isAllowed).toBe(false)
      expect(decision.reasons.some((r) => r.includes('Multi-Tenancy'))).toBe(true)
    })

    it('bloquea despliegue a producción fuera de horario laboral', () => {
      const decision = evaluateAccess({
        subject: { ...baseSubject, role: 'admin' },
        action: 'deploy:production',
        resource: { ...baseResource, classification: 'RESTRICTED' },
        environment: { ...baseEnv, isWorkingHours: false },
      })

      expect(decision.isAllowed).toBe(false)
      expect(decision.reasons.some((r) => r.includes('Horario Laboral'))).toBe(true)
    })
  })
})
