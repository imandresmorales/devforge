/**
 * @fileoverview Página de documentación — referencia de mejoras implementadas.
 * @module pages/DocsPage
 */
import FetchDemo from '../../components/ui/FetchDemo/FetchDemo.jsx'
import CodePlayground from '../../components/ui/CodePlayground/CodePlayground.jsx'
import RegexTester from '../../components/ui/RegexTester/RegexTester.jsx'
import WebSocketLiveDemo from '../../components/ui/WebSocketLiveDemo/WebSocketLiveDemo.jsx'
import ProjectTreeGenerator from '../../components/ui/ProjectTreeGenerator/ProjectTreeGenerator.jsx'
import CodeDiffViewer from '../../components/ui/CodeDiffViewer/CodeDiffViewer.jsx'
import SecurityHeadersInspector from '../../components/ui/SecurityHeadersInspector/SecurityHeadersInspector.jsx'
import SQLQueryBuilder from '../../components/ui/SQLQueryBuilder/SQLQueryBuilder.jsx'
import JWTInspector from '../../components/ui/JWTInspector/JWTInspector.jsx'
import PasswordCryptoExplorer from '../../components/ui/PasswordCryptoExplorer/PasswordCryptoExplorer.jsx'
import AccessControlEngine from '../../components/ui/AccessControlEngine/AccessControlEngine.jsx'
import PKIExplorer from '../../components/ui/PKIExplorer/PKIExplorer.jsx'
import CORSAuditor from '../../components/ui/CORSAuditor/CORSAuditor.jsx'
import ZKPSimulator from '../../components/ui/ZKPSimulator/ZKPSimulator.jsx'
import E2EEExplorer from '../../components/ui/E2EEExplorer/E2EEExplorer.jsx'
import PrototypePollutionAnalyzer from '../../components/ui/PrototypePollutionAnalyzer/PrototypePollutionAnalyzer.jsx'
import CSRFAuditor from '../../components/ui/CSRFAuditor/CSRFAuditor.jsx'
import ReactPerformanceProfiler from '../../components/ui/ReactPerformanceProfiler/ReactPerformanceProfiler.jsx'
import WebAuthnExplorer from '../../components/ui/WebAuthnExplorer/WebAuthnExplorer.jsx'
import SSRFDefender from '../../components/ui/SSRFDefender/SSRFDefender.jsx'
import MerkleTreeSimulator from '../../components/ui/MerkleTreeSimulator/MerkleTreeSimulator.jsx'
import InvertedIndexSearch from '../../components/ui/InvertedIndexSearch/InvertedIndexSearch.jsx'
import DLPScanner from '../../components/ui/DLPScanner/DLPScanner.jsx'
import CDNSimulator from '../../components/ui/CDNSimulator/CDNSimulator.jsx'
import WebRTCSimulator from '../../components/ui/WebRTCSimulator/WebRTCSimulator.jsx'
import TimingAttackAuditor from '../../components/ui/TimingAttackAuditor/TimingAttackAuditor.jsx'
import SBOMScannerExplorer from '../../components/ui/SBOMScannerExplorer/SBOMScannerExplorer.jsx'
import ContainerOrchestrationSimulator from '../../components/ui/ContainerOrchestrationSimulator/ContainerOrchestrationSimulator.jsx'
import SecondOrderSQLiExplorer from '../../components/ui/SecondOrderSQLiExplorer/SecondOrderSQLiExplorer.jsx'
import OpenTelemetryExplorer from '../../components/ui/OpenTelemetryExplorer/OpenTelemetryExplorer.jsx'
import PBFTExplorer from '../../components/ui/PBFTExplorer/PBFTExplorer.jsx'
import HomomorphicCryptoExplorer from '../../components/ui/HomomorphicCryptoExplorer/HomomorphicCryptoExplorer.jsx'
import NeuralNetworkExplorer from '../../components/ui/NeuralNetworkExplorer/NeuralNetworkExplorer.jsx'
import OAuthPKCEExplorer from '../../components/ui/OAuthPKCEExplorer/OAuthPKCEExplorer.jsx'
import ChaosSimulator from '../../components/ui/ChaosSimulator/ChaosSimulator.jsx'
import ComplianceAuditor from '../../components/ui/ComplianceAuditor/ComplianceAuditor.jsx'
import GoldMasterCeremony from '../../components/ui/GoldMasterCeremony/GoldMasterCeremony.jsx'
import GlobalMeshTelemetry from '../../components/ui/GlobalMeshTelemetry/GlobalMeshTelemetry.jsx'
import PwaCacheManager from '../../components/ui/PwaCacheManager/PwaCacheManager.jsx'
import OfflineSyncManager from '../../components/ui/OfflineSyncManager/OfflineSyncManager.jsx'
import PeriodicSyncSimulator from '../../components/ui/PeriodicSyncSimulator/PeriodicSyncSimulator.jsx'
import ProtocolHandlerTester from '../../components/ui/ProtocolHandlerTester/ProtocolHandlerTester.jsx'
import PwaBadgingManager from '../../components/ui/PwaBadgingManager/PwaBadgingManager.jsx'
import SEOMetaInspector from '../../components/ui/SEOMetaInspector/SEOMetaInspector.jsx'
import SchemaJsonLdViewer from '../../components/ui/SchemaJsonLdViewer/SchemaJsonLdViewer.jsx'

/** Lista de mejoras completadas */
const COMPLETED = [
  { num: 1,  title: 'Scaffolding inicial',                 desc: 'Estructura de carpetas, .gitignore, README, .env.example' },
  { num: 2,  title: 'Design tokens CSS',                   desc: 'variables.css, reset.css, utilities.css — paleta HSL, tipografía, espaciado' },
  { num: 3,  title: 'Layout base y React Router',          desc: 'Header, Footer, rutas /, /about, /docs, /dashboard, /contact, 404' },
  { num: 4,  title: 'Hero Section con animaciones',        desc: 'Keyframes, botones CTA, diseño visual premium, responsive' },
  { num: 5,  title: 'Dark Mode con useTheme',              desc: 'Toggle dark/light, localStorage, CSS variables, sin dependencias' },
  { num: 6,  title: 'Formulario controlado',               desc: 'Validación en tiempo real, aria-live, mensajes de error accesibles' },
  { num: 7,  title: 'Hook useFetch con AbortController',   desc: 'Peticiones HTTP con loading/error/data, cancelación correcta' },
  { num: 8,  title: 'Context API — Estado global usuario', desc: 'UserContext + useReducer para autenticación y estado global' },
  { num: 9,  title: 'Tabla dinámica DataTable',            desc: 'Paginación, ordenación por columna y búsqueda integrada' },
  { num: 10, title: 'Lazy loading y Code Splitting',       desc: 'React.lazy + Suspense para optimización de bundles JS' },
  { num: 11, title: 'Error Boundaries',                    desc: 'Captura y aislamiento de errores de renderizado en React' },
  { num: 12, title: 'Accesibilidad (a11y)',                desc: 'Skip-links, WAI-ARIA, soporte teclado y hoja a11y.css' },
  { num: 13, title: 'Internacionalización (i18n)',         desc: 'i18next + react-i18next con soporte Español/Inglés' },
  { num: 14, title: 'Testing unitario con Vitest',         desc: 'Vitest + React Testing Library y suite de pruebas automatizada' },
  { num: 15, title: 'Seguridad Web I (DOMPurify & CSP)',   desc: 'Sanitización estricta XSS con DOMPurify y cabeceras CSP' },
  { num: 16, title: 'Hook useLocalStorage seguro',         desc: 'Manejo de errores, cuota y sincronización en tiempo real entre pestañas' },
  { num: 17, title: 'Notificaciones Toast accesibles',     desc: 'ToastContext global, animaciones CSS y soporte aria-live' },
  { num: 18, title: 'Componente Modal accesible',          desc: 'Renderizado con createPortal, focus trap y atajos de teclado (Esc)' },
  { num: 19, title: 'Exportación CSV defensiva',           desc: 'Protección contra inyección de fórmulas CSV y descarga directa' },
  { num: 20, title: 'Página de Perfil y Medidor 2FA',      desc: 'Vista /profile, medidor de fuerza de contraseñas y simulación 2FA' },
]

/** Lista de próximas mejoras */
const UPCOMING = [
  { num: 21, title: 'Storybook — Documentación interactiva de componentes' },
  { num: 22, title: 'Middleware de Autenticación y Rutas Protegidas' },
  { num: 23, title: 'Infinite Scroll con Intersection Observer' },
  { num: 24, title: 'Drag and Drop accesible para gestión de listas' },
]

function DocsPage() {
  return (
    <main id="main-content" className="page-main">
      <div className="container">

        <section className="page-hero" aria-labelledby="docs-title">
          <span className="badge badge--brand">📚 Documentación</span>
          <h1 id="docs-title">Referencia del <span className="text-gradient">Proyecto</span></h1>
          <p>
            Historial de mejoras implementadas y el plan de las próximas.
            Cada mejora es atómica — una sola cosa, un solo commit.
          </p>
        </section>

        {/* Mejoras completadas */}
        <section aria-labelledby="completed-title" style={{ marginTop: 'var(--space-12)' }}>
          <h2 id="completed-title" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--color-text-primary)' }}>
            ✅ Implementadas
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {COMPLETED.map((item) => (
              <article
                key={item.num}
                style={{
                  display: 'flex',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-5)',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-xl)',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{
                  flexShrink: 0,
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--gradient-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-bold)',
                  color: 'white',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {item.num}
                </span>
                <div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {item.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Próximas mejoras */}
        <section aria-labelledby="upcoming-title" style={{ marginTop: 'var(--space-10)' }}>
          <h2 id="upcoming-title" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--color-text-primary)' }}>
            🔜 Próximas
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {UPCOMING.map((item) => (
              <div
                key={item.num}
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-4)',
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  alignItems: 'center',
                  opacity: 0.7,
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', minWidth: '28px' }}>
                  #{item.num}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Demo interactivo del hook useFetch — Mejora 7 */}
        <FetchDemo />

        {/* Live Code Playground interactivo — Mejora 35 */}
        <CodePlayground />

        {/* Regex Tester interactivo en vivo — Mejora 43 */}
        <RegexTester />

        {/* Cliente WebSocket en vivo — Mejora 46 */}
        <WebSocketLiveDemo />

        {/* Generador de Árboles ASCII — Mejora 47 */}
        <ProjectTreeGenerator />

        {/* Comparador de Diferencias de Código — Mejora 50 */}
        <CodeDiffViewer />

        {/* Auditor de Cabeceras de Seguridad HTTP — Mejora 53 */}
        <SecurityHeadersInspector />

        {/* Generador SQL Parametrizado & Anti-SQLi — Mejora 54 */}
        <SQLQueryBuilder />

        {/* Inspector y Validador de Tokens JWT — Mejora 56 */}
        <JWTInspector />

        {/* Explorador de Hashing KDF & Entropía NIST — Mejora 58 */}
        <PasswordCryptoExplorer />

        {/* Motor de Control de Acceso Granular RBAC & ABAC — Mejora 61 */}
        <AccessControlEngine />

        {/* Inspector de Certificados X.509 y Cadena de Confianza SSL/TLS — Mejora 62 */}
        <PKIExplorer />

        {/* Auditor de Seguridad CORS y Escáner de Misconfigurations — Mejora 64 */}
        <CORSAuditor />

        {/* Simulador de Pruebas de Cero Conocimiento ZKP & Protocolo Schnorr — Mejora 65 */}
        <ZKPSimulator />

        {/* Motor de Cifrado Extremo a Extremo E2EE (RSA-OAEP + AES-GCM) — Mejora 66 */}
        <E2EEExplorer />

        {/* Analizador y Mitigador de Prototype Pollution y Deserialización — Mejora 68 */}
        <PrototypePollutionAnalyzer />

        {/* Auditor de Seguridad CSRF y Cookies SameSite — Mejora 71 */}
        <CSRFAuditor />

        {/* Monitor y Profiler de Rendimiento React & Memory Leaks — Mejora 73 */}
        <ReactPerformanceProfiler />

        {/* Motor de Autenticación Biométrica WebAuthn & FIDO2 Passkeys — Mejora 75 */}
        <WebAuthnExplorer />

        {/* Analizador y Firewall Anti-SSRF — Mejora 77 */}
        <SSRFDefender />

        {/* Simulador de Árboles de Merkle & Pruebas Criptográficas — Mejora 78 */}
        <MerkleTreeSimulator />

        {/* Motor de Búsqueda de Texto Completo e Índice Invertido BM25 — Mejora 80 */}
        <InvertedIndexSearch />

        {/* Monitor y Auditor de Fugas de Información PII & DLP — Mejora 83 */}
        <DLPScanner />

        {/* Simulador de CDN Edge Caching y Anycast Routing — Mejora 84 */}
        <CDNSimulator />

        {/* Simulador de Protocolo P2P WebRTC & DataChannels — Mejora 86 */}
        <WebRTCSimulator />

        {/* Motor de Auditoría y Comparador Criptográfico en Tiempo Constante — Mejora 87 */}
        <TimingAttackAuditor />

        {/* Escáner de Dependencias & Generador SBOM — Mejora 89 */}
        <SBOMScannerExplorer />

        {/* Simulador de Orquestación de Contenedores y Health Checks — Mejora 91 */}
        <ContainerOrchestrationSimulator />

        {/* Auditor de Inyección SQL de Segundo Orden — Mejora 92 */}
        <SecondOrderSQLiExplorer />

        {/* Motor de Observabilidad OpenTelemetry y Trazabilidad Distribuida — Mejora 93 */}
        <OpenTelemetryExplorer />

        {/* Simulador de Algoritmos de Consenso Byzantine Fault Tolerance — Mejora 94 */}
        <PBFTExplorer />

        {/* Motor de Criptografía Homomórfica y Cómputo Seguro — Mejora 95 */}
        <HomomorphicCryptoExplorer />

        {/* Simulador de Red Neuronal en Navegador — Mejora 96 */}
        <NeuralNetworkExplorer />

        {/* Auditor de Seguridad OAuth 2.0 con PKCE — Mejora 97 */}
        <OAuthPKCEExplorer />

        {/* Simulador de Chaos Engineering y Resiliencia Distribuida — Mejora 98 */}
        <ChaosSimulator />

        {/* Motor de Informes de Conformidad ISO 27001 & SOC 2 Type II — Mejora 99 */}
        <ComplianceAuditor />

        {/* Ceremonia y Certificación Gold Master DevForge 1.0 — Mejora 100 */}
        <GoldMasterCeremony />

        {/* Centro de Comando Service Mesh & Telemetría Global — Mejora 101 */}
        <GlobalMeshTelemetry />

        {/* Gestor de Estrategias de Caché PWA (TTL & LRU) — Mejora 102 */}
        <PwaCacheManager />

        {/* Gestor de Background Sync API & Mutaciones Offline — Mejora 103 */}
        <OfflineSyncManager />

        {/* Periodic Background Sync & Prefetching Inteligente — Mejora 104 */}
        <PeriodicSyncSimulator />

        {/* Probador de Protocol Handlers & Manifest PWA — Mejora 105 */}
        <ProtocolHandlerTester />

        {/* PWA Badging API & Notificaciones Push Interactivas — Mejora 107 */}
        <PwaBadgingManager />

        {/* Gestor Dinámico de Meta Tags SEO & Social Graph — Mejora 108 */}
        <SEOMetaInspector />

        {/* Inyector de Datos Estructurados JSON-LD (Schema.org) — Mejora 109 */}
        <SchemaJsonLdViewer />

      </div>
    </main>
  )
}

export default DocsPage
