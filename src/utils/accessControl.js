/**
 * @fileoverview Motor de Control de Acceso Granular Basado en Roles y Atributos (RBAC & ABAC) (Mejora 61).
 *
 * CARACTERÍSTICAS:
 * - Modelo Híbrido: Control de Acceso Basado en Roles (RBAC) + Atributos Contextuales (ABAC / XACML).
 * - Cumplimiento del Principio de Menor Privilegio (PoLP) y Arquitectura Zero Trust.
 * - Algoritmo de combinación "Deny-Overrides" (cualquier regla de denegación explícita prevalece).
 * - Dimensiones de evaluación ABAC:
 *     - Sujeto: Rol, Departamento, Autenticación MFA, Nivel de autorización.
 *     - Recurso: Tipo, Clasificación (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED), Tenant ID, Propietario.
 *     - Entorno: Red corporativa vs externa, Horario laboral (08:00 - 18:00), Confianza del dispositivo.
 *     - Acción: read, create, update, delete, export, deploy.
 * - Traza de auditoría explicativa paso a paso para cumplimiento normativo (SOC2, ISO 27001).
 *
 * @module utils/accessControl
 */

/**
 * Roles predefinidos y sus permisos base en RBAC.
 */
export const RBAC_ROLES = {
  admin: {
    name: 'Administrador Global',
    description: 'Acceso total a todos los módulos y configuraciones del sistema.',
    permissions: ['*'],
  },
  security_auditor: {
    name: 'Auditor de Seguridad',
    description: 'Acceso de lectura a logs, certificados, reportes y métricas de seguridad.',
    permissions: ['audit:read', 'logs:read', 'reports:*', 'security:*', 'users:read'],
  },
  developer: {
    name: 'Ingeniero de Software',
    description: 'Acceso a repositorios, despliegues en staging y lectura de logs técnicos.',
    permissions: ['repo:*', 'deploy:staging', 'logs:read', 'content:read'],
  },
  billing_manager: {
    name: 'Gerente Financiero',
    description: 'Gestión de planes, facturas y pasarelas de pago.',
    permissions: ['billing:*', 'reports:read', 'invoices:*'],
  },
  viewer: {
    name: 'Observador (Solo Lectura)',
    description: 'Visualización básica sin capacidad de modificación.',
    permissions: ['*:read', 'content:read'],
  },
}

/**
 * Políticas de autorización ABAC predeterminadas.
 */
export const DEFAULT_ABAC_POLICIES = [
  {
    id: 'pol-tenant-isolation',
    name: 'Aislamiento Estricto Multi-Tenant',
    description: 'Bloquea cualquier acceso a recursos que pertenezcan a un tenant diferente al del usuario autenticado.',
    effect: 'DENY',
    evaluate: ({ subject, resource }) => {
      if (subject.role === 'admin') return false // Superadmin puede omitir si aplica
      return subject.tenantId !== resource.tenantId
    },
    denyReason: 'Violación de Multi-Tenancy: El recurso pertenece a otra organización o tenant.',
  },
  {
    id: 'pol-mfa-confidential',
    name: 'Requisito de MFA para Datos Confidenciales',
    description: 'Exige autenticación de doble factor activa para acceder a recursos CONFIDENTIAL o RESTRICTED.',
    effect: 'DENY',
    evaluate: ({ subject, resource }) => {
      const isSensitive = resource.classification === 'CONFIDENTIAL' || resource.classification === 'RESTRICTED'
      return isSensitive && !subject.isMfaVerified
    },
    denyReason: 'MFA Requerido: Se requiere autenticación 2FA/MFA verificada para consultar datos confidenciales.',
  },
  {
    id: 'pol-corporate-network-restricted',
    name: 'Restricción de Red para Recursos Críticos',
    description: 'Los recursos RESTRICTED solo pueden ser operados desde la red corporativa o VPN autorizada.',
    effect: 'DENY',
    evaluate: ({ resource, environment }) => {
      return resource.classification === 'RESTRICTED' && !environment.isCorporateNetwork
    },
    denyReason: 'Restricción de Red: El recurso clasificado como RESTRICTED solo es accesible desde la VPN o red corporativa.',
  },
  {
    id: 'pol-working-hours-prod-deploy',
    name: 'Ventana de Mantenimiento para Despliegues a Prod',
    description: 'Los despliegues a producción (deploy:production) solo se permiten en horario laboral (08:00 a 18:00).',
    effect: 'DENY',
    evaluate: ({ action, environment }) => {
      const isProdDeploy = action === 'deploy' || action === 'deploy:production'
      return isProdDeploy && !environment.isWorkingHours
    },
    denyReason: 'Fuera de Horario Laboral: Despliegues a producción restringidos fuera de la ventana operativa autorizada.',
  },
  {
    id: 'pol-owner-edit',
    name: 'Control de Propiedad de Recurso (Ownership)',
    description: 'Permite al creador/propietario original modificar o eliminar sus propios recursos.',
    effect: 'PERMIT',
    evaluate: ({ subject, resource, action }) => {
      const isOwner = subject.id === resource.ownerId
      const isEditAction = action === 'update' || action === 'delete' || action === 'edit'
      return isOwner && isEditAction
    },
    permitReason: 'Acceso Concedido: El usuario es el propietario registrado del recurso (Ownership Rule).',
  },
]

/**
 * Comprueba si un permiso específico está cubierto por la lista de permisos RBAC (soporta wildcards).
 *
 * @param {string[]} rolePermissions - Permisos del rol.
 * @param {string} requestedPermission - Permiso solicitado (ej. "repo:write").
 * @returns {boolean}
 */
export function checkRbacPermission(rolePermissions, requestedPermission) {
  if (!rolePermissions || !Array.isArray(rolePermissions)) return false
  if (rolePermissions.includes('*')) return true

  const [reqNamespace, reqAction] = requestedPermission.split(':')

  return rolePermissions.some((p) => {
    if (p === requestedPermission) return true
    if (p === `${reqNamespace}:*`) return true
    if (p === `*:${reqAction}`) return true
    return false
  })
}

/**
 * Evalúa una solicitud de acceso contra las capas RBAC y ABAC utilizando el algoritmo Deny-Overrides.
 *
 * @param {Object} context
 * @param {Object} context.subject - Datos del usuario solicitante.
 * @param {string} context.action - Acción solicitada.
 * @param {Object} context.resource - Recurso objetivo.
 * @param {Object} context.environment - Variables de contexto del entorno.
 * @param {Array} [customPolicies] - Lista opcional de políticas ABAC.
 * @returns {Object} Informe de decisión y traza de auditoría.
 */
export function evaluateAccess(context, customPolicies = DEFAULT_ABAC_POLICIES) {
  const { subject, action, resource, environment } = context

  const roleDef = RBAC_ROLES[subject?.role] || RBAC_ROLES.viewer
  const requestedPermission = action.includes(':') ? action : `${resource.type}:${action}`

  const evaluatedRules = []
  const denyReasons = []
  const permitReasons = []

  // ── 1. Evaluación RBAC Base ──
  const hasRbac = checkRbacPermission(roleDef.permissions, requestedPermission)
  if (hasRbac) {
    permitReasons.push(`Permiso concedido por rol RBAC "${roleDef.name}" (${requestedPermission}).`)
    evaluatedRules.push({
      id: 'rbac-base',
      name: `RBAC: Rol ${roleDef.name}`,
      effect: 'PERMIT',
      matched: true,
      reason: `Rol "${subject.role}" autoriza la acción "${requestedPermission}".`,
    })
  } else {
    evaluatedRules.push({
      id: 'rbac-base',
      name: `RBAC: Rol ${roleDef.name}`,
      effect: 'NOT_MATCHED',
      matched: false,
      reason: `Rol "${subject.role}" no posee el permiso "${requestedPermission}".`,
    })
  }

  // ── 2. Evaluación de Políticas ABAC ──
  customPolicies.forEach((policy) => {
    try {
      const isMatched = policy.evaluate({ subject, action, resource, environment })

      if (isMatched) {
        if (policy.effect === 'DENY') {
          denyReasons.push(policy.denyReason || `Denegado por política ABAC: ${policy.name}`)
          evaluatedRules.push({
            id: policy.id,
            name: policy.name,
            effect: 'DENY',
            matched: true,
            reason: policy.denyReason,
          })
        } else if (policy.effect === 'PERMIT') {
          permitReasons.push(policy.permitReason || `Permitido por política ABAC: ${policy.name}`)
          evaluatedRules.push({
            id: policy.id,
            name: policy.name,
            effect: 'PERMIT',
            matched: true,
            reason: policy.permitReason,
          })
        }
      } else {
        evaluatedRules.push({
          id: policy.id,
          name: policy.name,
          effect: 'NOT_APPLICABLE',
          matched: false,
          reason: 'Condición no aplicable a este contexto.',
        })
      }
    } catch (err) {
      denyReasons.push(`Error en evaluación de política ${policy.name}: ${err.message}`)
    }
  })

  // ── 3. Decisión Final: Deny-Overrides ──
  const isExplicitlyDenied = denyReasons.length > 0
  const isExplicitlyPermitted = hasRbac || permitReasons.length > 0
  const isAllowed = !isExplicitlyDenied && isExplicitlyPermitted

  return {
    isAllowed,
    decision: isAllowed ? 'PERMIT' : 'DENY',
    statusCode: isAllowed ? 200 : 403,
    statusText: isAllowed ? '200 OK (Acceso Autorizado)' : '403 Forbidden (Acceso Denegado)',
    reasons: isAllowed ? permitReasons : denyReasons.length > 0 ? denyReasons : ['Acceso denegado por defecto: No coincide con ningún permiso RBAC o regla ABAC.'],
    evaluatedRules,
    contextSummary: {
      user: `${subject.name} (${subject.role})`,
      action: requestedPermission,
      resource: `${resource.type}:${resource.id} [${resource.classification}]`,
      environment: `${environment.isCorporateNetwork ? 'Red Corp' : 'Red Externa'} | MFA: ${subject.isMfaVerified ? 'SI' : 'NO'}`,
    },
  }
}
