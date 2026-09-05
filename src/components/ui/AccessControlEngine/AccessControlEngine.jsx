/**
 * @fileoverview Componente AccessControlEngine — Motor interactivo de evaluación de políticas RBAC y ABAC (Mejora 61).
 *
 * CARACTERÍSTICAS:
 * - Evaluación de decisiones de autorización Zero Trust en tiempo real (200 OK vs 403 Forbidden).
 * - Selector interactivo de Sujeto (Rol, MFA, Tenant), Recurso (Clasificación, Owner) y Entorno (Red, Horario).
 * - Algoritmo Deny-Overrides con traza detallada de auditoría paso a paso.
 * - Presets de ataques y accesos legítimos para demostración de ciberseguridad.
 *
 * @module components/ui/AccessControlEngine
 */
import { useState, useMemo } from 'react'
import {
  evaluateAccess,
  RBAC_ROLES,
  DEFAULT_ABAC_POLICIES,
} from '../../../utils/accessControl'
import { useToast } from '../../../context/ToastContext'
import './AccessControlEngine.css'

const PRESET_SCENARIOS = [
  {
    label: 'Desarrollador en Red Interna (Acceso Legítimo)',
    type: 'Permitido',
    subject: { id: 'usr_101', name: 'Carlos Morales', role: 'developer', department: 'Engineering', isMfaVerified: true, tenantId: 'tenant_devforge' },
    resource: { id: 'repo_backend_api', type: 'repo', classification: 'INTERNAL', ownerId: 'usr_101', tenantId: 'tenant_devforge' },
    action: 'repo:read',
    environment: { clientIp: '10.0.4.15', isCorporateNetwork: true, isWorkingHours: true },
  },
  {
    label: 'Intento de Fuga Multi-Tenant (Cross-Tenant)',
    type: 'Bloqueado',
    subject: { id: 'usr_202', name: 'Auditor Externo', role: 'security_auditor', department: 'Compliance', isMfaVerified: true, tenantId: 'tenant_acme' },
    resource: { id: 'db_financial_records', type: 'billing', classification: 'CONFIDENTIAL', ownerId: 'usr_888', tenantId: 'tenant_devforge' },
    action: 'billing:read',
    environment: { clientIp: '192.168.1.50', isCorporateNetwork: true, isWorkingHours: true },
  },
  {
    label: 'Datos Confidenciales Sin MFA Verificado',
    type: 'Bloqueado',
    subject: { id: 'usr_303', name: 'Lucia CFO', role: 'billing_manager', department: 'Finance', isMfaVerified: false, tenantId: 'tenant_devforge' },
    resource: { id: 'invoices_stripe_q3', type: 'invoices', classification: 'CONFIDENTIAL', ownerId: 'usr_303', tenantId: 'tenant_devforge' },
    action: 'invoices:read',
    environment: { clientIp: '10.0.1.20', isCorporateNetwork: true, isWorkingHours: true },
  },
  {
    label: 'Despliegue a Prod Fuera de Horario Laboral',
    type: 'Bloqueado',
    subject: { id: 'usr_404', name: 'Alex Root', role: 'admin', department: 'Operations', isMfaVerified: true, tenantId: 'tenant_devforge' },
    resource: { id: 'cluster_k8s_prod', type: 'deploy', classification: 'RESTRICTED', ownerId: 'usr_404', tenantId: 'tenant_devforge' },
    action: 'deploy:production',
    environment: { clientIp: '10.0.1.5', isCorporateNetwork: true, isWorkingHours: false },
  },
]

function AccessControlEngine() {
  const { addToast } = useToast()

  // Estados de los atributos
  const [role, setRole] = useState('developer')
  const [isMfa, setIsMfa] = useState(true)
  const [userTenant, setUserTenant] = useState('tenant_devforge')
  const [resourceClass, setResourceClass] = useState('INTERNAL')
  const [resourceTenant, setResourceTenant] = useState('tenant_devforge')
  const [action, setAction] = useState('repo:read')
  const [isCorporateNet, setIsCorporateNet] = useState(true)
  const [isWorkHours, setIsWorkHours] = useState(true)

  // Contexto de evaluación reactivo
  const decision = useMemo(() => {
    const subject = {
      id: 'usr_active',
      name: 'Usuario Evaluado',
      role,
      department: 'Engineering',
      isMfaVerified: isMfa,
      tenantId: userTenant,
    }

    const resource = {
      id: 'res_target_01',
      type: action.split(':')[0] || 'repo',
      classification: resourceClass,
      ownerId: 'usr_active',
      tenantId: resourceTenant,
    }

    const environment = {
      clientIp: isCorporateNet ? '10.0.4.15' : '198.51.100.22',
      isCorporateNetwork: isCorporateNet,
      isWorkingHours: isWorkHours,
    }

    return evaluateAccess({ subject, action, resource, environment }, DEFAULT_ABAC_POLICIES)
  }, [role, isMfa, userTenant, resourceClass, resourceTenant, action, isCorporateNet, isWorkHours])

  const handleLoadPreset = (p) => {
    setRole(p.subject.role)
    setIsMfa(p.subject.isMfaVerified)
    setUserTenant(p.subject.tenantId)
    setResourceClass(p.resource.classification)
    setResourceTenant(p.resource.tenantId)
    setAction(p.action)
    setIsCorporateNet(p.environment.isCorporateNetwork)
    setIsWorkHours(p.environment.isWorkingHours)

    addToast({
      type: 'info',
      title: 'Escenario Cargado',
      message: `${p.label} cargado para auditoría.`,
    })
  }

  return (
    <section className="access-control-section" aria-label="Motor de Control de Acceso RBAC & ABAC">
      {/* ── Encabezado ── */}
      <div className="access-control-header">
        <div>
          <div className="ac-badge-wrapper">
            <span className="badge badge--brand">🛡️ Zero Trust Architecture</span>
            <span className="badge badge--success">RBAC + ABAC Policy Engine</span>
          </div>
          <h2 className="access-control-title">
            Motor de Control de Acceso Granular (RBAC & ABAC)
          </h2>
          <p className="access-control-subtitle">
            Evalúa autorizaciones complejas combinando roles, permisos jerárquicos y atributos contextuales del sujeto, recurso y entorno mediante el algoritmo Deny-Overrides.
          </p>
        </div>

        {/* Presets */}
        <div className="ac-presets-bar">
          {PRESET_SCENARIOS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="ac-preset-btn"
              onClick={() => handleLoadPreset(p)}
            >
              <span className="ac-preset-title">{p.label}</span>
              <span className={`ac-preset-chip ac-preset-chip--${p.type === 'Permitido' ? 'allow' : 'deny'}`}>
                {p.type}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Banner de Decisión en Vivo ── */}
      <div className={`ac-decision-banner ${decision.isAllowed ? 'ac-decision-banner--allow' : 'ac-decision-banner--deny'}`}>
        <div className="ac-decision-left">
          <span className="ac-decision-icon">{decision.isAllowed ? '🛡️' : '🚫'}</span>
          <div>
            <div className="ac-decision-status">{decision.statusText}</div>
            <div className="ac-decision-reasons">
              {decision.reasons.join(' | ')}
            </div>
          </div>
        </div>
        <div className="ac-decision-badge">
          Algoritmo: Deny-Overrides
        </div>
      </div>

      {/* ── Panel de Configuración de Atributos ── */}
      <div className="ac-attributes-grid">
        {/* Atributos del Sujeto (Subject) */}
        <div className="ac-card">
          <h3 className="ac-card-title">👤 Atributos del Sujeto (Usuario)</h3>
          <div className="ac-form-group">
            <label className="ac-label">Rol RBAC:</label>
            <select
              className="ac-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {Object.keys(RBAC_ROLES).map((k) => (
                <option key={k} value={k}>{RBAC_ROLES[k].name} ({k})</option>
              ))}
            </select>
          </div>

          <div className="ac-form-group">
            <label className="ac-label">Tenant del Usuario:</label>
            <select
              className="ac-select"
              value={userTenant}
              onChange={(e) => setUserTenant(e.target.value)}
            >
              <option value="tenant_devforge">tenant_devforge (Principal)</option>
              <option value="tenant_acme">tenant_acme (Secundario)</option>
            </select>
          </div>

          <div className="ac-checkbox-group">
            <label className="ac-checkbox-label">
              <input
                type="checkbox"
                checked={isMfa}
                onChange={(e) => setIsMfa(e.target.checked)}
              />
              <span>Autenticación 2FA / MFA Verificada</span>
            </label>
          </div>
        </div>

        {/* Atributos del Recurso y Acción (Resource & Action) */}
        <div className="ac-card">
          <h3 className="ac-card-title">📦 Atributos del Recurso & Acción</h3>
          <div className="ac-form-group">
            <label className="ac-label">Acción Solicitada:</label>
            <select
              className="ac-select"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="repo:read">repo:read (Lectura de código)</option>
              <option value="repo:write">repo:write (Push a repositorio)</option>
              <option value="billing:read">billing:read (Lectura financiera)</option>
              <option value="invoices:export">invoices:export (Exportar facturas)</option>
              <option value="deploy:production">deploy:production (Despliegue a Producción)</option>
              <option value="security:audit">security:audit (Auditoría de seguridad)</option>
            </select>
          </div>

          <div className="ac-form-group">
            <label className="ac-label">Clasificación de Seguridad:</label>
            <select
              className="ac-select"
              value={resourceClass}
              onChange={(e) => setResourceClass(e.target.value)}
            >
              <option value="PUBLIC">PUBLIC (Acceso General)</option>
              <option value="INTERNAL">INTERNAL (Uso Interno)</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL (Datos Sensibles / PII)</option>
              <option value="RESTRICTED">RESTRICTED (Máxima Criticidad)</option>
            </select>
          </div>

          <div className="ac-form-group">
            <label className="ac-label">Tenant Propietario del Recurso:</label>
            <select
              className="ac-select"
              value={resourceTenant}
              onChange={(e) => setResourceTenant(e.target.value)}
            >
              <option value="tenant_devforge">tenant_devforge (Mismo Tenant)</option>
              <option value="tenant_acme">tenant_acme (Otro Tenant)</option>
            </select>
          </div>
        </div>

        {/* Atributos del Entorno (Environment) */}
        <div className="ac-card">
          <h3 className="ac-card-title">🌐 Atributos del Entorno</h3>
          <div className="ac-checkbox-list">
            <label className="ac-checkbox-label">
              <input
                type="checkbox"
                checked={isCorporateNet}
                onChange={(e) => setIsCorporateNet(e.target.checked)}
              />
              <span>Conexión desde Red Corporativa / VPN</span>
            </label>

            <label className="ac-checkbox-label">
              <input
                type="checkbox"
                checked={isWorkHours}
                onChange={(e) => setIsWorkHours(e.target.checked)}
              />
              <span>Dentro del Horario Laboral (08:00 - 18:00)</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Traza de Auditoría y Evaluación de Reglas ── */}
      <div className="ac-audit-card">
        <h3 className="ac-audit-title">📋 Traza de Evaluación de Políticas (Policy Decision Point)</h3>
        <div className="ac-rules-table-wrapper">
          <table className="ac-rules-table">
            <thead>
              <tr>
                <th>Regla / Política</th>
                <th>Efecto Declarado</th>
                <th>Evaluación</th>
                <th>Motivo / Diagnóstico</th>
              </tr>
            </thead>
            <tbody>
              {decision.evaluatedRules.map((rule) => (
                <tr key={rule.id}>
                  <td><strong>{rule.name}</strong></td>
                  <td>
                    <span className={`badge badge--${rule.effect === 'PERMIT' ? 'success' : rule.effect === 'DENY' ? 'danger' : 'neutral'}`}>
                      {rule.effect}
                    </span>
                  </td>
                  <td>
                    <span className={`ac-match-badge ${rule.matched ? 'ac-match-badge--matched' : 'ac-match-badge--unmatched'}`}>
                      {rule.matched ? 'APLICADA' : 'NO APLICA'}
                    </span>
                  </td>
                  <td>{rule.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default AccessControlEngine
