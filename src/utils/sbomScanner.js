/**
 * @fileoverview Escáner de Dependencias y Generador SBOM CycloneDX / SPDX (Mejora 89).
 *
 * ESTÁNDARES Y SEGURIDAD EN SUPPLY CHAIN:
 * - Executive Order 14028 & NIST SP 800-218 (SSDF).
 * - CycloneDX v1.5 JSON & SPDX v2.3 Specification.
 * - Detección de vulnerabilidades conocidas (CVEs / CVSS v3.1), riesgos de licencia (GPL/AGPL vs Permisivas)
 *   y mitigación de ataques a la cadena de suministro de software.
 *
 * @module utils/sbomScanner
 */

/**
 * Base de datos de vulnerabilidades conocidas y advisories para simulación realista.
 */
export const VULNERABILITY_DATABASE = {
  'lodash': [
    {
      cve: 'CVE-2021-23337',
      cvss: 7.2,
      severity: 'HIGH',
      affectedRange: '<4.17.21',
      title: 'Command Injection via template()',
      fixedVersion: '4.17.21',
      description: 'Inyección de comandos arbitrarios a través de la función template() al procesar variables no sanitizadas.',
    },
    {
      cve: 'CVE-2019-10744',
      cvss: 9.8,
      severity: 'CRITICAL',
      affectedRange: '<4.17.12',
      title: 'Prototype Pollution via defaultsDeep()',
      fixedVersion: '4.17.12',
      description: 'Modificación no autorizada de Object.prototype mediante payloads recursivos maliciosos.',
    },
  ],
  'axios': [
    {
      cve: 'CVE-2023-45857',
      cvss: 6.5,
      severity: 'MEDIUM',
      affectedRange: '<1.6.0',
      title: 'Cross-Site Request Forgery / SSRF via follow-redirects',
      fixedVersion: '1.6.0',
      description: 'Fuga de cabeceras de autorización HTTP Authorization al seguir redirecciones automáticas跨origen.',
    },
  ],
  'jsonwebtoken': [
    {
      cve: 'CVE-2022-23529',
      cvss: 9.8,
      severity: 'CRITICAL',
      affectedRange: '<=8.5.1',
      title: 'Arbitrary Code Execution via toString() spoofing',
      fixedVersion: '9.0.0',
      description: 'Ejecución remota de código en verify() si se pasa un objeto malicioso como secret/publicKey.',
    },
  ],
  'express': [
    {
      cve: 'CVE-2024-29041',
      cvss: 5.3,
      severity: 'MEDIUM',
      affectedRange: '<4.19.2',
      title: 'Open Redirect in express res.location()',
      fixedVersion: '4.19.2',
      description: 'Bypass de validación de URLs permitiendo redirecciones no seguras.',
    },
  ],
}

/**
 * Proyectos y manifiestos de dependencias preconfigurados para auditoría.
 */
export const SAMPLE_PROJECTS = {
  DEVFORGE_PROD: {
    id: 'devforge-prod',
    name: 'DevForge Web Application (Producción)',
    version: '1.0.0',
    description: 'Plataforma educativa de alta seguridad y sistemas distribuidos.',
    dependencies: [
      { name: 'react', version: '18.3.1', license: 'MIT', type: 'framework' },
      { name: 'react-dom', version: '18.3.1', license: 'MIT', type: 'framework' },
      { name: 'react-router-dom', version: '6.26.2', license: 'MIT', type: 'routing' },
      { name: 'dompurify', version: '3.1.6', license: 'Apache-2.0', type: 'security' },
      { name: 'qrcode', version: '1.5.4', license: 'MIT', type: 'utility' },
      { name: 'vitest', version: '2.1.1', license: 'MIT', type: 'devDependency' },
    ],
  },
  LEGACY_VULNERABLE: {
    id: 'legacy-vulnerable',
    name: 'Legacy Cloud Microservice (Con Vulnerabilidades)',
    version: '0.4.2',
    description: 'Servicio heredado con dependencias obsoletas y alto riesgo de supply chain.',
    dependencies: [
      { name: 'express', version: '4.18.1', license: 'MIT', type: 'framework' },
      { name: 'lodash', version: '4.17.11', license: 'MIT', type: 'utility' },
      { name: 'jsonwebtoken', version: '8.5.1', license: 'MIT', type: 'security' },
      { name: 'axios', version: '1.5.0', license: 'MIT', type: 'http' },
      { name: 'gpl-restricted-lib', version: '1.0.0', license: 'GPL-3.0-only', type: 'library' },
    ],
  },
}

/**
 * Analiza un manifiesto de dependencias y calcula vulnerabilidades y riesgos de licenciamiento.
 *
 * @param {Object} projectManifest
 * @returns {{
 *   totalDependencies: number,
 *   vulnerabilities: Array<Object>,
 *   criticalCount: number,
 *   highCount: number,
 *   mediumCount: number,
 *   lowCount: number,
 *   supplyChainScore: number,
 *   licenseRisks: Array<Object>,
 *   isCompliant: boolean
 * }}
 */
export function scanDependencies(projectManifest) {
  if (!projectManifest || !Array.isArray(projectManifest.dependencies)) {
    throw new Error('Manifiesto de proyecto inválido.')
  }

  const vulnerabilities = []
  const licenseRisks = []

  let criticalCount = 0
  let highCount = 0
  let mediumCount = 0
  let lowCount = 0

  projectManifest.dependencies.forEach((dep) => {
    // 1. Auditoría de Vulnerabilidades CVE
    const knownCves = VULNERABILITY_DATABASE[dep.name] || []
    knownCves.forEach((vuln) => {
      // Comparación simple de versiones simulada
      vulnerabilities.push({
        packageName: dep.name,
        installedVersion: dep.version,
        cve: vuln.cve,
        cvss: vuln.cvss,
        severity: vuln.severity,
        title: vuln.title,
        description: vuln.description,
        fixedVersion: vuln.fixedVersion,
      })

      if (vuln.severity === 'CRITICAL') criticalCount++
      else if (vuln.severity === 'HIGH') highCount++
      else if (vuln.severity === 'MEDIUM') mediumCount++
      else lowCount++
    })

    // 2. Auditoría de Licencias (Identificación de licencias restrictivas Copyleft)
    const RESTRICTIVE_LICENSES = ['GPL-3.0-only', 'GPL-2.0-only', 'AGPL-3.0-only', 'AGPL-1.0-only']
    if (RESTRICTIVE_LICENSES.includes(dep.license)) {
      licenseRisks.push({
        packageName: dep.name,
        license: dep.license,
        risk: 'COPYLEFT_VIRAL_RISK',
        description: 'Licencia GPL/AGPL requiere divulgación obligatoria del código fuente en aplicaciones distribuidas.',
      })
    }
  })

  // Cálculo de Puntuación de Seguridad de la Cadena de Suministro [0 - 100]
  let penalty = criticalCount * 30 + highCount * 15 + mediumCount * 5 + licenseRisks.length * 10
  const supplyChainScore = Math.max(0, 100 - penalty)
  const isCompliant = supplyChainScore >= 85 && criticalCount === 0

  return {
    totalDependencies: projectManifest.dependencies.length,
    vulnerabilities,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    supplyChainScore,
    licenseRisks,
    isCompliant,
  }
}

/**
 * Genera un Software Bill of Materials (SBOM) en formato CycloneDX v1.5 JSON.
 *
 * @param {Object} projectManifest
 * @returns {Object} Estructura CycloneDX estándar
 */
export function generateCycloneDXSbom(projectManifest) {
  const serialNumber = `urn:uuid:df-${Math.abs(Math.sin(Date.now())).toString(36).substring(2, 14)}`

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: 'DevForge Security Labs',
          name: 'DevForge SBOM Generator & Supply Chain Scanner',
          version: '1.0.0',
        },
      ],
      component: {
        type: 'application',
        name: projectManifest.name,
        version: projectManifest.version,
        description: projectManifest.description,
      },
    },
    components: projectManifest.dependencies.map((dep, idx) => ({
      type: 'library',
      'bom-ref': `pkg:npm/${dep.name}@${dep.version}`,
      name: dep.name,
      version: dep.version,
      purl: `pkg:npm/${dep.name}@${dep.version}`,
      licenses: [
        {
          license: {
            id: dep.license,
          },
        },
      ],
      properties: [
        { name: 'devforge:dependency-type', value: dep.type },
        { name: 'devforge:component-index', value: String(idx + 1) },
      ],
    })),
  }
}

/**
 * Genera un Software Bill of Materials (SBOM) en formato SPDX v2.3 Tag-Value.
 *
 * @param {Object} projectManifest
 * @returns {string} Formato SPDX estándar en texto plano
 */
export function generateSpdxTagValueSbom(projectManifest) {
  const lines = [
    'SPDXVersion: SPDX-2.3',
    'DataLicense: CC0-1.0',
    'SPDXID: SPDXRef-DOCUMENT',
    `DocumentName: ${projectManifest.name.replace(/\s+/g, '_')}`,
    `DocumentNamespace: https://devforge.app/spdx/${projectManifest.id}-${projectManifest.version}`,
    'Creator: Tool: DevForge-SBOM-Scanner-1.0',
    `Created: ${new Date().toISOString()}`,
    '',
    `PackageName: ${projectManifest.name}`,
    'SPDXID: SPDXRef-RootPackage',
    `PackageVersion: ${projectManifest.version}`,
    'PackageDownloadLocation: NOASSERTION',
    'FilesAnalyzed: false',
    'PackageLicenseConcluded: MIT',
    'PackageLicenseDeclared: MIT',
    '',
    '# Componentes del Grafo de Dependencias:',
  ]

  projectManifest.dependencies.forEach((dep, idx) => {
    lines.push(
      `PackageName: ${dep.name}`,
      `SPDXID: SPDXRef-Package-${idx + 1}-${dep.name.replace(/\W+/g, '-')}`,
      `PackageVersion: ${dep.version}`,
      `PackageDownloadLocation: https://registry.npmjs.org/${dep.name}/-/${dep.name}-${dep.version}.tgz`,
      'FilesAnalyzed: false',
      `PackageLicenseConcluded: ${dep.license}`,
      `PackageLicenseDeclared: ${dep.license}`,
      `ExternalRef: PACKAGE-MANAGER purl pkg:npm/${dep.name}@${dep.version}`,
      `Relationship: SPDXRef-RootPackage DEPENDS_ON SPDXRef-Package-${idx + 1}-${dep.name.replace(/\W+/g, '-')}`,
      ''
    )
  })

  return lines.join('\n')
}
