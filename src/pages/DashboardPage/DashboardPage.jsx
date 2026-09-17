/**
 * @fileoverview Página Dashboard — área privada protegida con autenticación JWT.
 *
 * MEJORA 21: Esta ruta ahora está protegida por PrivateRoute.
 * MEJORA 22: Dashboard rediseñado con gráficos SVG puros (BarChart, DonutChart, LineChart).
 *
 * Los datos son estáticos/simulados para demostrar los patrones de visualización.
 * En una app de producción provendrían de una API (ej. GET /api/dashboard/stats).
 *
 * @module pages/DashboardPage
 */
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { BarChart, DonutChart, LineChart } from '../../components/ui/Charts'
import DataTable from '../../components/ui/DataTable/DataTable.jsx'
import KanbanBoard from '../../components/ui/KanbanBoard/KanbanBoard.jsx'
import WebhookManager from '../../components/ui/WebhookManager/WebhookManager.jsx'
import RateLimitSimulator from '../../components/ui/RateLimitSimulator/RateLimitSimulator.jsx'
import CircuitBreakerSimulator from '../../components/ui/CircuitBreakerSimulator/CircuitBreakerSimulator.jsx'
import SagaSimulator from '../../components/ui/SagaSimulator/SagaSimulator.jsx'
import CacheSimulator from '../../components/ui/CacheSimulator/CacheSimulator.jsx'
import LoadBalancerSimulator from '../../components/ui/LoadBalancerSimulator/LoadBalancerSimulator.jsx'
import EventBusSimulator from '../../components/ui/EventBusSimulator/EventBusSimulator.jsx'
import ACIDSimulator from '../../components/ui/ACIDSimulator/ACIDSimulator.jsx'
import RaftSimulator from '../../components/ui/RaftSimulator/RaftSimulator.jsx'
import VectorDbSimulator from '../../components/ui/VectorDbSimulator/VectorDbSimulator.jsx'
import GossipSimulator from '../../components/ui/GossipSimulator/GossipSimulator.jsx'
import CRDTSimulator from '../../components/ui/CRDTSimulator/CRDTSimulator.jsx'
import CICDPipelineSimulator from '../../components/ui/CICDPipelineSimulator/CICDPipelineSimulator.jsx'
import ConsistentHashingSimulator from '../../components/ui/ConsistentHashingSimulator/ConsistentHashingSimulator.jsx'
import KafkaBrokerSimulator from '../../components/ui/KafkaBrokerSimulator/KafkaBrokerSimulator.jsx'
import FeatureFlagsExplorer from '../../components/ui/FeatureFlagsExplorer/FeatureFlagsExplorer.jsx'
import RetryResilienceSimulator from '../../components/ui/RetryResilienceSimulator/RetryResilienceSimulator.jsx'
import TransactionalOutboxSimulator from '../../components/ui/TransactionalOutboxSimulator/TransactionalOutboxSimulator.jsx'
import SchemaValidatorExplorer from '../../components/ui/SchemaValidatorExplorer/SchemaValidatorExplorer.jsx'
import VirtualListExplorer from '../../components/ui/VirtualListExplorer/VirtualListExplorer.jsx'
import BinarySerializationExplorer from '../../components/ui/BinarySerializationExplorer/BinarySerializationExplorer.jsx'
import ReportModal from '../../components/ui/ReportModal/ReportModal.jsx'
import './DashboardPage.css'

/* ─── Datos de los gráficos ────────────────────────────────── */

/** BarChart: mejoras completadas por fase */
const PHASE_DATA = [
  { label: 'Fase 1',  value: 14, color: 'hsl(239, 84%, 64%)' },
  { label: 'Fase 2',  value: 11, color: 'hsl(262, 80%, 65%)' },
  { label: 'Fase 3',  value: 20, color: 'hsl(142, 71%, 45%)' },
  { label: 'Fase 4',  value: 8,  color: 'hsl(280, 85%, 65%)' },
  { label: 'Fase 5',  value: 0,  color: 'hsl(215, 20%, 65%)' },
]

/** DonutChart: distribución de tecnologías del roadmap */
const TECH_SEGMENTS = [
  { label: 'React / JS',  value: 35, color: 'hsl(192, 95%, 68%)' },
  { label: 'Seguridad',   value: 20, color: 'hsl(0,   72%, 65%)' },
  { label: 'Next.js',     value: 20, color: 'hsl(239, 84%, 64%)' },
  { label: 'APIs & Stripe', value: 15, color: 'hsl(142, 71%, 45%)' },
  { label: 'DevOps',      value: 10, color: 'hsl(38,  92%, 55%)' },
]

/** LineChart: commits por semana (últimas 8 semanas) */
const WEEKLY_COMMITS = [
  { label: 'S1', value: 3 },
  { label: 'S2', value: 5 },
  { label: 'S3', value: 4 },
  { label: 'S4', value: 8 },
  { label: 'S5', value: 6 },
  { label: 'S6', value: 10 },
  { label: 'S7', value: 9 },
  { label: 'S8', value: 32 },
]

/* ─── Stats cards ───────────────────────────────────────────── */
const STATS = [
  { id: 'mejoras',     label: 'Mejoras implementadas', value: '98',   unit: 'de 100', icon: '✅', color: 'hsl(142, 71%, 45%)' },
  { id: 'commits',     label: 'Commits en GitHub',     value: '98',   unit: 'commits', icon: '📦', color: 'hsl(239, 84%, 64%)' },
  { id: 'componentes', label: 'Componentes UI',        value: '87',   unit: 'archivos', icon: '🧩', color: 'hsl(262, 80%, 65%)' },
  { id: 'cobertura',   label: 'Tests automatizados',   value: '482',  unit: 'pasando', icon: '🧪', color: 'hsl(142, 71%, 45%)' },
]

/* ─── Tabla de mejoras ──────────────────────────────────────── */
const COLUMNS = [
  {
    key: 'num', label: '#', sortable: true,
    render: (v) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand-500)', fontSize: 'var(--text-xs)' }}>{v}</span>,
  },
  { key: 'title',  label: 'Mejora',  sortable: true },
  {
    key: 'status', label: 'Estado', sortable: true,
    render: (v) => (
      <span className={`badge badge--${v === 'done' ? 'success' : v === 'wip' ? 'warning' : 'neutral'}`}>
        {v === 'done' ? '✅ Listo' : v === 'wip' ? '🔄 En curso' : '⏳ Pendiente'}
      </span>
    ),
  },
  {
    key: 'commit', label: 'Commit', sortable: false,
    render: (v) => v
      ? <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-brand-500)' }}>{v}</code>
      : '—',
  },
]

const IMPROVEMENTS_DATA = [
  { id: 1,  num: '01', title: 'Scaffolding inicial',             status: 'done', commit: '4a366c2' },
  { id: 2,  num: '02', title: 'Design tokens CSS',               status: 'done', commit: 'e46bc65' },
  { id: 3,  num: '03', title: 'React Router + Layout',           status: 'done', commit: 'f8900fa' },
  { id: 4,  num: '04', title: 'Hero section con animaciones',    status: 'done', commit: '7701c5e' },
  { id: 5,  num: '05', title: 'Dark Mode con useTheme',          status: 'done', commit: '24cc94f' },
  { id: 6,  num: '06', title: 'Formulario controlado',           status: 'done', commit: 'c8a1ae7' },
  { id: 7,  num: '07', title: 'Hook useFetch + AbortController', status: 'done', commit: '1f138a0' },
  { id: 8,  num: '08', title: 'Context API + useReducer',        status: 'done', commit: '2fd51b9' },
  { id: 9,  num: '09', title: 'Tabla dinámica paginada',         status: 'done', commit: 'c4ea2fb' },
  { id: 10, num: '10', title: 'Lazy loading y Code Splitting',   status: 'done', commit: 'd4c5334' },
  { id: 11, num: '11', title: 'Error Boundaries',                status: 'done', commit: 'd4f5bd9' },
  { id: 12, num: '12', title: 'Accesibilidad (a11y)',            status: 'done', commit: '184a461' },
  { id: 13, num: '13', title: 'Internacionalización (i18n)',      status: 'done', commit: '160c331' },
  { id: 14, num: '14', title: 'Tests con Vitest',                status: 'done', commit: '2354efb' },
  { id: 15, num: '15', title: 'Sanitización XSS + CSP headers',  status: 'done', commit: '6d8452e' },
  { id: 16, num: '16', title: 'hook useLocalStorage seguro',     status: 'done', commit: '04482d0' },
  { id: 17, num: '17', title: 'Toast notifications globales',    status: 'done', commit: '03f7f72' },
  { id: 18, num: '18', title: 'Modal reutilizable con portal',   status: 'done', commit: '1f7b4bb' },
  { id: 19, num: '19', title: 'Exportación CSV segura',          status: 'done', commit: '804c61f' },
  { id: 20, num: '20', title: 'Página de perfil + 2FA + medidor',status: 'done', commit: '78b5e08' },
  { id: 21, num: '21', title: 'Auth JWT + PrivateRoute',         status: 'done', commit: '73dd0b2' },
  { id: 22, num: '22', title: 'Dashboard con gráficos SVG',      status: 'done', commit: '405b7c5' },
  { id: 23, num: '23', title: 'GitHub REST API real',            status: 'done', commit: '03cefa2' },
  { id: 24, num: '24', title: 'Cobertura de tests completa',     status: 'done', commit: 'ab2ba25' },
  { id: 25, num: '25', title: 'PWA + Service Worker nativo',     status: 'done', commit: '166f4c4' },
  { id: 26, num: '26', title: 'Pasarela Stripe + Checkout Luhn', status: 'done', commit: 'e875c75' },
  { id: 27, num: '27', title: 'Buscador Global Ctrl+K Palette',  status: 'done', commit: '7e7747c' },
  { id: 28, num: '28', title: 'Centro de Alertas & Web Push API',status: 'done', commit: '3dfd46c' },
  { id: 29, num: '29', title: 'Tour Guiado Interactivo Onboarding', status: 'done', commit: '80c9ff4' },
  { id: 30, num: '30', title: 'OAuth 2.0 Google & GitHub Login',  status: 'done', commit: '03aad46' },
  { id: 31, num: '31', title: 'WhatsApp Cloud API & Chat Widget', status: 'done', commit: 'd358246' },
  { id: 32, num: '32', title: 'Modo Zen / Lectura Inmersiva',     status: 'done', commit: 'e990f5e' },
  { id: 33, num: '33', title: 'Generador de Códigos QR SVG/PNG',  status: 'done', commit: '567efc8' },
  { id: 34, num: '34', title: 'Tablero Kanban Drag and Drop',     status: 'done', commit: '4abafa5' },
  { id: 35, num: '35', title: 'Playground Código Sandbox Seguro', status: 'done', commit: '4bafb45' },
  { id: 36, num: '36', title: 'Tipado TypeScript & Validador',    status: 'done', commit: 'e4b34cb' },
  { id: 37, num: '37', title: 'Módulo Feedback & Métricas NPS',   status: 'done', commit: 'fe2c77e' },
  { id: 38, num: '38', title: 'Reportes y Certificados PDF',      status: 'done', commit: 'f7a46a4' },
  { id: 39, num: '39', title: 'Monitor de Core Web Vitals en Vivo', status: 'done', commit: '92d6f2c' },
  { id: 40, num: '40', title: 'Terminal Interactiva CLI Emulada', status: 'done', commit: '4f6cd75' },
  { id: 41, num: '41', title: 'Sistema de Logros y Gamificación', status: 'done', commit: '0287c23' },
  { id: 42, num: '42', title: 'Gestor de Webhooks y Verif. HMAC', status: 'done', commit: '1387dad' },
  { id: 43, num: '43', title: 'Tester de Regex en Vivo (Anti-ReDoS)', status: 'done', commit: '1325b2d' },
  { id: 44, num: '44', title: 'Centro de Exportación Multi-formato', status: 'done', commit: '945e7a8' },
  { id: 45, num: '45', title: 'Simulador Rate Limiting & Token Bucket', status: 'done', commit: '00a2169' },
  { id: 46, num: '46', title: 'Cliente WebSocket en Tiempo Real',    status: 'done', commit: 'b29c3c7' },
  { id: 47, num: '47', title: 'Generador de Árboles ASCII / MD',      status: 'done', commit: '53a324e' },
  { id: 48, num: '48', title: 'Tokens UUIDv7 y NanoID Seguro',        status: 'done', commit: '02f5b56' },
  { id: 49, num: '49', title: 'Patrón Circuit Breaker Resiliente',    status: 'done', commit: '35a5440' },
  { id: 50, num: '50', title: 'Comparador Visual Code Diff Viewer',   status: 'done', commit: 'ecf506f' },
  { id: 51, num: '51', title: 'Generador 2FA TOTP con Temporizador',   status: 'done', commit: '9506416' },
  { id: 52, num: '52', title: 'Patrón Saga Transacciones Distribuidas', status: 'done', commit: '33695dc' },
  { id: 53, num: '53', title: 'Auditor Cabeceras HTTP de Seguridad',   status: 'done', commit: 'a3055ce' },
  { id: 54, num: '54', title: 'Consultas SQL Seguras & Anti-SQLi',     status: 'done', commit: 'a1295c4' },
  { id: 55, num: '55', title: 'Simulador Caché Distribuida (LRU/TTL)', status: 'done', commit: 'b599712' },
  { id: 56, num: '56', title: 'Inspector & Validador Tokens JWT',     status: 'done', commit: '057fe68' },
  { id: 57, num: '57', title: 'Balanceador de Carga & Alta Disponibilidad', status: 'done', commit: 'bc2d6d5' },
  { id: 58, num: '58', title: 'Explorador Hashes KDF y Entropía NIST', status: 'done', commit: 'f359ac0' },
  { id: 59, num: '59', title: 'Event Bus Pub/Sub & Dead Letter Queue', status: 'done', commit: '774e048' },
  { id: 60, num: '60', title: 'Transacciones ACID y Aislamiento SQL', status: 'done', commit: '7d54958' },
  { id: 61, num: '61', title: 'Control de Acceso Granular RBAC & ABAC', status: 'done', commit: '8ae0ebc' },
  { id: 62, num: '62', title: 'Inspector Certificados X.509 y PKI',    status: 'done', commit: 'a5185a2' },
  { id: 63, num: '63', title: 'Simulador Consenso Distribuido Raft',   status: 'done', commit: 'e84e9c9' },
  { id: 64, num: '64', title: 'Auditor de Seguridad CORS (OWASP)',    status: 'done', commit: '1c5d1f8' },
  { id: 65, num: '65', title: 'Simulador Pruebas Cero Conocimiento ZKP', status: 'done', commit: '150d04e' },
  { id: 66, num: '66', title: 'Cifrado Extremo a Extremo E2EE (Web Crypto)', status: 'done', commit: '9e71892' },
  { id: 67, num: '67', title: 'Base de Datos Vectorial k-NN & Embeddings', status: 'done', commit: '669ed9f' },
  { id: 68, num: '68', title: 'Analizador Prototype Pollution (Anti-Pollution)', status: 'done', commit: '3f55d0b' },
  { id: 69, num: '69', title: 'Simulador Protocolo Gossip & SWIM P2P', status: 'done', commit: '7f844df' },
  { id: 70, num: '70', title: 'Simulador de CRDTs & Edición Colaborativa', status: 'done', commit: '4e79feb' },
  { id: 71, num: '71', title: 'Auditor de Seguridad CSRF & Cookies SameSite', status: 'done', commit: '15e8268' },
  { id: 72, num: '72', title: 'Simulador de Pipeline CI/CD con SAST (DevSecOps)', status: 'done', commit: 'ba5f858' },
  { id: 73, num: '73', title: 'Monitor y Profiler de Rendimiento React (Memory Leaks)', status: 'done', commit: '5715a9d' },
  { id: 74, num: '74', title: 'Simulador de Sharding y Hash Consistente', status: 'done', commit: '43b8e41' },
  { id: 75, num: '75', title: 'Motor de Autenticación Biométrica WebAuthn & FIDO2', status: 'done', commit: '973253d' },
  { id: 76, num: '76', title: 'Simulador de Message Broker Kafka & Consumer Groups', status: 'done', commit: '936a21e' },
  { id: 77, num: '77', title: 'Analizador y Sanitizador Anti-SSRF', status: 'done', commit: 'aeb1f9f' },
  { id: 78, num: '78', title: 'Simulador de Árboles de Merkle (Merkle Proofs)', status: 'done', commit: '6c942d4' },
  { id: 79, num: '79', title: 'Motor de Feature Flags y Despliegue Progresivo Canary (Rollout Engine)', status: 'done', commit: 'd7b2139' },
  { id: 80, num: '80', title: 'Motor de Búsqueda de Texto Completo con Índice Invertido y Ranking BM25', status: 'done', commit: '54543d8' },
  { id: 81, num: '81', title: 'Motor de Resiliencia con Retry Pattern, Exponential Backoff y Jitter', status: 'done', commit: '111024d' },
  { id: 82, num: '82', title: 'Simulador del Patrón Outbox Transaccional y Sincronización Event-Driven', status: 'done', commit: '8b8b173' },
  { id: 83, num: '83', title: 'Monitor y Auditor de Fugas de Información PII y DLP (Data Loss Prevention)', status: 'done', commit: '088c98e' },
  { id: 84, num: '84', title: 'Simulador de Red de Distribución de Contenidos (CDN Edge Caching & Anycast Routing)', status: 'done', commit: '5bc44b6' },
  { id: 85, num: '85', title: 'Motor de Verificación Formal de Contratos y Validación de Schemas JSON/Zod', status: 'done', commit: '219c372' },
  { id: 86, num: '86', title: 'Simulador de Protocolo P2P WebRTC & DataChannels (ICE, STUN/TURN y SDP)', status: 'done', commit: 'e038326' },
  { id: 87, num: '87', title: 'Motor de Auditoría y Comparador Criptográfico en Tiempo Constante Anti Timing Attacks', status: 'done', commit: 'ae3dd19' },
  { id: 88, num: '88', title: 'Simulador de Virtualización de Listas Grandes y Windowing (100k+ Filas)', status: 'done', commit: 'a4f0397' },
  { id: 89, num: '89', title: 'Escáner de Dependencias Vulnerables y Generador SBOM (CycloneDX / SPDX)', status: 'done', commit: '6b454ad' },
  { id: 90, num: '90', title: 'Motor de Compresión de Datos y Serialización Binaria (Protobuf / MessagePack)', status: 'done', commit: 'd780db2' },
  { id: 91, num: '91', title: 'Simulador de Orquestación de Contenedores y Health Checks (Kubernetes)', status: 'done', commit: '8237cda' },
  { id: 92, num: '92', title: 'Auditor de Inyección SQL de Segundo Orden (CWE-89 Stored SQLi Defender)', status: 'done', commit: '1460123' },
  { id: 93, num: '93', title: 'Motor de Observabilidad OpenTelemetry y Trazabilidad Distribuida (W3C TraceContext)', status: 'done', commit: '7cc4548' },
  { id: 94, num: '94', title: 'Simulador de Algoritmos de Consenso Byzantine Fault Tolerance (PBFT / Castro-Liskov)', status: 'done', commit: '9f39bde' },
  { id: 95, num: '95', title: 'Motor de Criptografía Homomórfica y Cómputo Seguro sobre Datos Cifrados (Paillier)', status: 'done', commit: 'ffc3f4e' },
  { id: 96, num: '96', title: 'Simulador de Red Neuronal en Navegador (Backpropagation & Decision Boundary)', status: 'done', commit: '44df9ce' },
  { id: 97, num: '97', title: 'Auditor de Seguridad en Flujos OAuth 2.0 con PKCE (RFC 7636)', status: 'done', commit: '03696bb' },
  { id: 98, num: '98', title: 'Simulador de Chaos Engineering y Resiliencia ante Fallos Distribuidos (Chaos Monkey)', status: 'done', commit: '19eb73b' },
]

/**
 * Página de Dashboard con gráficos SVG y tabla de mejoras.
 * Protegida por PrivateRoute (requiere autenticación).
 * @returns {JSX.Element}
 */
function DashboardPage() {
  const { user } = useAuth()
  const [isReportOpen, setIsReportOpen] = useState(false)

  return (
    <main id="main-content" className="page-main">
      <div className="container">

        {/* ── Hero ── */}
        <section className="page-hero" aria-labelledby="dashboard-title">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <span className="badge badge--brand">⚡ Área privada</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsReportOpen(true)}
              style={{ fontSize: 'var(--text-xs)' }}
            >
              📄 Generar Certificado PDF
            </button>
          </div>
          <h1 id="dashboard-title">
            Hola, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Desarrollador'}</span> 👋
          </h1>
          <p>
            Aquí está el estado completo del proyecto DevForge —
            <strong> {IMPROVEMENTS_DATA.filter(m => m.status === 'done').length} de 100</strong> mejoras implementadas.
          </p>
        </section>

        {/* ── Stats cards ── */}
        <section aria-labelledby="stats-title" className="dashboard-stats-section">
          <h2 id="stats-title" className="dashboard-section-title">Métricas del proyecto</h2>
          <div className="dashboard-stats-grid">
            {STATS.map((stat) => (
              <article key={stat.id} className="dashboard-stat-card">
                <div className="dashboard-stat-card__icon" aria-hidden="true">{stat.icon}</div>
                <div className="dashboard-stat-card__value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="dashboard-stat-card__unit">{stat.unit}</div>
                <div className="dashboard-stat-card__label">{stat.label}</div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Gráficos — fila de 2 ── */}
        <section aria-labelledby="charts-title" className="dashboard-charts-section">
          <h2 id="charts-title" className="dashboard-section-title">Visualización de datos</h2>

          <div className="dashboard-charts-grid">

            {/* BarChart */}
            <article className="dashboard-chart-card">
              <h3 className="dashboard-chart-card__title">Mejoras por fase</h3>
              <p className="dashboard-chart-card__desc">Número de mejoras completadas en cada fase del roadmap.</p>
              <BarChart
                data={PHASE_DATA}
                title="Mejoras completadas por fase del roadmap DevForge"
                unit=" mejoras"
                height={180}
              />
            </article>

            {/* DonutChart */}
            <article className="dashboard-chart-card">
              <h3 className="dashboard-chart-card__title">Distribución tecnológica</h3>
              <p className="dashboard-chart-card__desc">Peso de cada área del roadmap de 100 mejoras.</p>
              <DonutChart
                segments={TECH_SEGMENTS}
                title="Distribución de tecnologías en el roadmap de DevForge"
                centerLabel="100"
              />
            </article>

            {/* LineChart — fila completa */}
            <article className="dashboard-chart-card dashboard-chart-card--full">
              <h3 className="dashboard-chart-card__title">Actividad semanal (commits)</h3>
              <p className="dashboard-chart-card__desc">Número de commits realizados en las últimas 8 semanas.</p>
              <LineChart
                data={WEEKLY_COMMITS}
                title="Commits por semana en las últimas 8 semanas"
                color="hsl(239, 84%, 64%)"
                unit=" commits"
              />
            </article>

          </div>
        </section>

        {/* ── Tabla de mejoras ── */}
        <section aria-labelledby="table-title" className="dashboard-table-section">
          <h2 id="table-title" className="dashboard-section-title">📋 Registro de mejoras</h2>
          <DataTable
            data={IMPROVEMENTS_DATA}
            columns={COLUMNS}
            caption="Tabla de las 100 mejoras del proyecto DevForge"
            initialPageSize={10}
          />
        </section>

        {/* ── Tablero Kanban (Mejora 34) ── */}
        <KanbanBoard />

        {/* ── Gestor de Webhooks & HMAC (Mejora 42) ── */}
        <WebhookManager />

        {/* ── Simulador de Rate Limiting & Token Bucket (Mejora 45) ── */}
        <RateLimitSimulator />

        {/* ── Simulador de Circuit Breaker para Microservicios (Mejora 49) ── */}
        <CircuitBreakerSimulator />

        {/* ── Simulador del Patrón Saga para Transacciones Distribuidas (Mejora 52) ── */}
        <SagaSimulator />

        {/* ── Simulador de Memoria Caché Distribuida (Mejora 55) ── */}
        <CacheSimulator />

        {/* ── Simulador de Balanceo de Carga y Alta Disponibilidad (Mejora 57) ── */}
        <LoadBalancerSimulator />

        {/* ── Simulador de Event Bus Pub/Sub & DLQ (Mejora 59) ── */}
        <EventBusSimulator />

        {/* ── Simulador de Transacciones ACID y Aislamiento SQL (Mejora 60) ── */}
        <ACIDSimulator />

        {/* ── Simulador de Consenso Distribuido Raft (Mejora 63) ── */}
        <RaftSimulator />

        {/* ── Base de Datos Vectorial k-NN & Embeddings (Mejora 67) ── */}
        <VectorDbSimulator />

        {/* ── Simulador de Protocolo Gossip & SWIM P2P (Mejora 69) ── */}
        <GossipSimulator />

        {/* ── Simulador de CRDTs & Edición Colaborativa (Mejora 70) ── */}
        <CRDTSimulator />

        {/* ── Simulador de Pipeline CI/CD con SAST (Mejora 72) ── */}
        <CICDPipelineSimulator />

        {/* ── Simulador de Sharding y Hash Consistente (Mejora 74) ── */}
        <ConsistentHashingSimulator />

        {/* ── Simulador de Message Broker Kafka & Consumer Groups (Mejora 76) ── */}
        <KafkaBrokerSimulator />

        {/* ── Motor de Feature Flags & Despliegue Canary (Mejora 79) ── */}
        <FeatureFlagsExplorer />

        {/* ── Motor de Resiliencia con Retry Pattern & Jitter (Mejora 81) ── */}
        <RetryResilienceSimulator />

        {/* ── Simulador del Patrón Outbox Transaccional (Mejora 82) ── */}
        <TransactionalOutboxSimulator />

        {/* ── Motor de Verificación de Contratos y Schemas (Mejora 85) ── */}
        <SchemaValidatorExplorer />

        {/* ── Simulador de Virtualización de Listas Grandes (Mejora 88) ── */}
        <VirtualListExplorer />

        {/* ── Motor de Serialización Binaria y Compresión (Mejora 90) ── */}
        <BinarySerializationExplorer />

        {/* ── Modal de Reporte y Certificado de Auditoría (Mejora 38) ── */}
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />

      </div>
    </main>
  )
}

export default DashboardPage
