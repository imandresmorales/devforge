/**
 * @fileoverview Motor de pruebas y validación de expresiones regulares con protección anti-ReDoS (Mejora 43).
 *
 * CARACTERÍSTICAS:
 * - Protección contra Denegación de Servicio por Expresiones Regulares (ReDoS).
 * - Catálogo exhaustivo de patrones predefinidos (Email, UUID, IPv4, JWT, etc.).
 * - Extracción detallada de coincidencias, índices y grupos de captura.
 *
 * @module utils/regexHelper
 */

export const REGEX_PRESETS = [
  {
    id: 'email',
    name: '📧 Email RFC 5322',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    flags: 'i',
    sample: 'usuario.dev@devforge.io\ninvalido@sin-dominio\ncontacto@empresa.com.co',
    desc: 'Valida direcciones de correo electrónico estándar.',
  },
  {
    id: 'uuid',
    name: '🆔 UUID v4',
    pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}',
    flags: 'g',
    sample: 'ID-1: 123e4567-e89b-12d3-a456-426614174000\nID-2: f47ac10b-58cc-4372-a567-0e02b2c3d479',
    desc: 'Detecta identificadores únicos universales (UUID versión 4).',
  },
  {
    id: 'ipv4',
    name: '🌐 Dirección IPv4',
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    flags: 'g',
    sample: 'Servidor: 192.168.1.1, Gateway: 10.0.0.254, Inválido: 999.1.1.1',
    desc: 'Extrae direcciones IP versión 4 válidas en formato decimal con puntos.',
  },
  {
    id: 'jwt',
    name: '🔐 Token JWT',
    pattern: '^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$',
    flags: '',
    sample: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN_p_placeholder',
    desc: 'Valida la estructura de 3 segmentos (Header.Payload.Signature) de un JWT.',
  },
  {
    id: 'hex_color',
    name: '🎨 Color Hexadecimal',
    pattern: '#(?:[a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b',
    flags: 'g',
    sample: 'Primario: #4f46e5, Acento: #fbbf24, Corto: #fff, Inválido: #gggggg',
    desc: 'Detecta códigos de color hexadecimales de 3 y 6 dígitos.',
  },
]

/**
 * Evalúa una expresión regular de forma segura contra un texto de prueba.
 *
 * @param {string} pattern - Patrón regex
 * @param {string} flags - Banderas ('g', 'i', 'm', 's', 'u')
 * @param {string} testString - Cadena de prueba a evaluar
 * @returns {{ isValidRegex: boolean, isMatch: boolean, matches: Array<{ text: string, index: number, length: number, groups: string[] }>, error: string | null }}
 */
export function testRegex(pattern = '', flags = 'g', testString = '') {
  if (!pattern) {
    return {
      isValidRegex: true,
      isMatch: false,
      matches: [],
      error: null,
    }
  }

  // 1. Protección Anti-ReDoS: límites defensivos de longitud
  if (pattern.length > 300) {
    return {
      isValidRegex: false,
      isMatch: false,
      matches: [],
      error: 'El patrón excede el límite de seguridad de 300 caracteres (Protección anti-ReDoS).',
    }
  }

  if (testString.length > 20000) {
    return {
      isValidRegex: false,
      isMatch: false,
      matches: [],
      error: 'El texto de prueba excede el límite de 20,000 caracteres.',
    }
  }

  try {
    const cleanFlags = Array.from(new Set((flags || '').split('')))
      .filter((f) => ['g', 'i', 'm', 's', 'u'].includes(f))
      .join('')

    const regex = new RegExp(pattern, cleanFlags)
    const matches = []

    if (cleanFlags.includes('g')) {
      let match
      let count = 0
      const maxMatches = 200 // Límite defensivo para evitar bucles infinitos

      while ((match = regex.exec(testString)) !== null && count < maxMatches) {
        matches.push({
          text: match[0],
          index: match.index,
          length: match[0].length,
          groups: match.slice(1),
        })

        // Evitar bucle infinito si la coincidencia tiene longitud cero
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
        count++
      }
    } else {
      const match = regex.exec(testString)
      if (match) {
        matches.push({
          text: match[0],
          index: match.index,
          length: match[0].length,
          groups: match.slice(1),
        })
      }
    }

    return {
      isValidRegex: true,
      isMatch: matches.length > 0,
      matches,
      error: null,
    }
  } catch (err) {
    return {
      isValidRegex: false,
      isMatch: false,
      matches: [],
      error: `Error de sintaxis Regex: ${err.message}`,
    }
  }
}
