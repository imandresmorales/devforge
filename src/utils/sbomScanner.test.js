/**
 * @fileoverview Tests unitarios para el Escáner de Dependencias y Generador SBOM (Mejora 89).
 */
import { describe, it, expect } from 'vitest'
import {
  scanDependencies,
  generateCycloneDXSbom,
  generateSpdxTagValueSbom,
  SAMPLE_PROJECTS,
} from './sbomScanner'

describe('SBOM Scanner & Software Supply Chain Auditor (sbomScanner.js)', () => {
  describe('Escaneo de Dependencias y Detección de Vulnerabilidades', () => {
    it('debe certificar como seguro el proyecto DevForge en Producción', () => {
      const scan = scanDependencies(SAMPLE_PROJECTS.DEVFORGE_PROD)

      expect(scan.totalDependencies).toBe(6)
      expect(scan.vulnerabilities.length).toBe(0)
      expect(scan.criticalCount).toBe(0)
      expect(scan.licenseRisks.length).toBe(0)
      expect(scan.supplyChainScore).toBe(100)
      expect(scan.isCompliant).toBe(true)
    })

    it('debe detectar CVEs críticos y riesgos de licencia en proyectos heredados', () => {
      const scan = scanDependencies(SAMPLE_PROJECTS.LEGACY_VULNERABLE)

      expect(scan.vulnerabilities.length).toBeGreaterThanOrEqual(4)
      expect(scan.criticalCount).toBeGreaterThan(0) // jsonwebtoken / lodash
      expect(scan.licenseRisks.length).toBe(1) // GPL-3.0-only
      expect(scan.supplyChainScore).toBeLessThan(50)
      expect(scan.isCompliant).toBe(false)
    })
  })

  describe('Generador de Manifiestos SBOM CycloneDX v1.5 JSON', () => {
    it('debe estructurar correctamente el SBOM CycloneDX con metadata y componentes', () => {
      const sbom = generateCycloneDXSbom(SAMPLE_PROJECTS.DEVFORGE_PROD)

      expect(sbom.bomFormat).toBe('CycloneDX')
      expect(sbom.specVersion).toBe('1.5')
      expect(sbom.serialNumber).toContain('urn:uuid:df-')
      expect(sbom.metadata.component.name).toBe('DevForge Web Application (Producción)')
      expect(sbom.components.length).toBe(6)
      expect(sbom.components[0]).toHaveProperty('purl')
      expect(sbom.components[0].purl).toContain('pkg:npm/react@18.3.1')
    })
  })

  describe('Generador de Manifiestos SPDX v2.3 Tag-Value', () => {
    it('debe generar el formato estándar SPDX con identificadores y relaciones de dependencia', () => {
      const spdx = generateSpdxTagValueSbom(SAMPLE_PROJECTS.DEVFORGE_PROD)

      expect(spdx).toContain('SPDXVersion: SPDX-2.3')
      expect(spdx).toContain('SPDXID: SPDXRef-DOCUMENT')
      expect(spdx).toContain('Relationship: SPDXRef-RootPackage DEPENDS_ON')
      expect(spdx).toContain('PackageLicenseConcluded: MIT')
    })
  })
})
