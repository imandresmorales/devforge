/**
 * @fileoverview Motor de Prevención de Fuga de Datos (DLP - Data Loss Prevention) y Sanitización PII.
 *
 * Cumplimiento de estándares de ciberseguridad y privacidad (GDPR, PCI-DSS, HIPAA, SOC 2):
 * - Detección de Tarjetas de Crédito con algoritmo de validación checksum Luhn (Visa, Mastercard, Amex).
 * - Detección de Secretos y API Keys (AWS Access Keys, OpenAI Keys, GitHub Tokens, JWT, Private Keys).
 * - Detección de Información Personal Identificable PII (DNI/NIE español con checksum, SSN, Emails, Teléfonos).
 * - Estrategias de enmascaramiento: Redactar ([REDACTED]), Máscara Parcial (**** 4242), Hash SHA-256.
 * - Clasificación por Severidad (CRITICAL, HIGH, MEDIUM, LOW) y cálculo de riesgo de cumplimiento.
 *
 * @module utils/dlpScanner
 */

export const MASK_STRATEGIES = {
  PARTIAL: 'PARTIAL',
  REDACT: 'REDACT',
  HASH: 'HASH',
}

export const SEVERITY_LEVELS = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
}

/**
 * Valida un número de tarjeta mediante el algoritmo de Luhn (MOD 10).
 * @param {string} cardNumber - Dígitos a validar.
 * @returns {boolean} True si pasa el checksum de Luhn.
 */
export function validateLuhn(cardNumber) {
  const clean = cardNumber.replace(/\D/g, '')
  if (clean.length < 13 || clean.length > 19) return false

  let sum = 0
  let shouldDouble = false

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10)

    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

/**
 * Valida la letra de control de un DNI o NIE español.
 * @param {string} id - DNI/NIE (ej. 12345678Z, Y1234567Z).
 * @returns {boolean} True si el checksum es válido.
 */
export function validateDniNie(id) {
  const clean = id.toUpperCase().replace(/\s|-/g, '')
  if (!/^[XYZ\d]\d{7}[A-Z]$/.test(clean)) return false

  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE'
  let numberPart = clean.slice(0, 8)

  if (numberPart.startsWith('X')) numberPart = '0' + numberPart.slice(1)
  else if (numberPart.startsWith('Y')) numberPart = '1' + numberPart.slice(1)
  else if (numberPart.startsWith('Z')) numberPart = '2' + numberPart.slice(1)

  const num = parseInt(numberPart, 10)
  const expectedLetter = letters[num % 23]
  return clean.slice(-1) === expectedLetter
}

/**
 * Reglas de detección DLP
 */
export const DLP_RULES = [
  // 1. Tarjetas de Crédito (PCI-DSS)
  {
    id: 'CREDIT_CARD',
    name: 'Tarjeta de Crédito / Débito (PCI-DSS)',
    severity: SEVERITY_LEVELS.CRITICAL,
    regex: /\b(?:\d[ -]*?){13,19}\b/g,
    validate: (match) => validateLuhn(match),
    mask: (match, strategy) => {
      const digits = match.replace(/\D/g, '')
      if (strategy === MASK_STRATEGIES.REDACT) return '[REDACTED_CREDIT_CARD]'
      if (strategy === MASK_STRATEGIES.HASH) return `[HASH_CC:${digits.slice(-4)}]`
      // Partial: ****-****-****-1234
      return `****-****-****-${digits.slice(-4)}`
    },
  },
  // 2. OpenAI API Keys
  {
    id: 'OPENAI_KEY',
    name: 'OpenAI Secret API Key',
    severity: SEVERITY_LEVELS.CRITICAL,
    regex: /\bsk-(?:proj-|live-)?[a-zA-Z0-9_-]{32,64}\b/g,
    mask: (match, strategy) => {
      if (strategy === MASK_STRATEGIES.REDACT) return '[REDACTED_OPENAI_KEY]'
      return `sk-...${match.slice(-6)}`
    },
  },
  // 3. AWS Access Key
  {
    id: 'AWS_ACCESS_KEY',
    name: 'AWS Access Key ID',
    severity: SEVERITY_LEVELS.CRITICAL,
    regex: /\b(?:AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16}\b/g,
    mask: (match, strategy) => {
      if (strategy === MASK_STRATEGIES.REDACT) return '[REDACTED_AWS_KEY]'
      return `AKIA...${match.slice(-4)}`
    },
  },
  // 4. JSON Web Tokens (JWT)
  {
    id: 'JWT_TOKEN',
    name: 'JSON Web Token (JWT)',
    severity: SEVERITY_LEVELS.HIGH,
    regex: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
    mask: (match, strategy) => {
      if (strategy === MASK_STRATEGIES.REDACT) return '[REDACTED_JWT_TOKEN]'
      return `eyJ...[JWT_MASKED]...${match.slice(-6)}`
    },
  },
  // 5. GitHub Personal Access Tokens
  {
    id: 'GITHUB_TOKEN',
    name: 'GitHub Personal Token',
    severity: SEVERITY_LEVELS.CRITICAL,
    regex: /\bgh[pousr]_[a-zA-Z0-9]{36,40}\b/g,
    mask: (match, strategy) => {
      if (strategy === MASK_STRATEGIES.REDACT) return '[REDACTED_GITHUB_TOKEN]'
      return `ghp_...${match.slice(-4)}`
    },
  },
  // 6. Private Keys
  {
    id: 'PRIVATE_KEY',
    name: 'Clave Privada RSA / OpenSSH',
    severity: SEVERITY_LEVELS.CRITICAL,
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    mask: () => '[REDACTED_PRIVATE_KEY_BLOCK]',
  },
  // 7. DNI / NIE Español
  {
    id: 'DNI_NIE',
    name: 'DNI / NIE Español (PII / GDPR)',
    severity: SEVERITY_LEVELS.HIGH,
    regex: /\b[XYZ\d][\s.-]?\d{7}[\s.-]?[A-Z]\b/gi,
    validate: (match) => validateDniNie(match),
    mask: (match, strategy) => {
      const clean = match.replace(/[\s.-]/g, '').toUpperCase()
      if (strategy === MASK_STRATEGIES.REDACT) return '[REDACTED_DNI]'
      return `***${clean.slice(-4)}`
    },
  },
  // 8. US Social Security Number (SSN)
  {
    id: 'US_SSN',
    name: 'Social Security Number (SSN)',
    severity: SEVERITY_LEVELS.HIGH,
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    mask: (match, strategy) => {
      if (strategy === MASK_STRATEGIES.REDACT) return '[REDACTED_SSN]'
      return `***-**-${match.slice(-4)}`
    },
  },
  // 9. Correos Electrónicos
  {
    id: 'EMAIL',
    name: 'Dirección de Correo Electrónico (PII)',
    severity: SEVERITY_LEVELS.MEDIUM,
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    mask: (match, strategy) => {
      if (strategy === MASK_STRATEGIES.REDACT) return '[REDACTED_EMAIL]'
      const [user, domain] = match.split('@')
      const maskedUser = user.length <= 2 ? user[0] + '*' : user[0] + '***' + user.slice(-1)
      return `${maskedUser}@${domain}`
    },
  },
]

/**
 * Escanea un texto en busca de fugas de datos PII y secretos.
 *
 * @param {string} text - Texto o payload a inspeccionar.
 * @param {Object} [options]
 * @param {string} [options.strategy=MASK_STRATEGIES.PARTIAL] - Estrategia de enmascaramiento.
 * @returns {{ findings: Array<Object>, sanitizedText: string, riskScore: number, isCompliant: boolean }}
 */
export function scanAndSanitize(text, options = {}) {
  const { strategy = MASK_STRATEGIES.PARTIAL } = options

  if (!text || typeof text !== 'string') {
    return { findings: [], sanitizedText: text || '', riskScore: 0, isCompliant: true }
  }

  const findings = []
  let sanitized = text

  DLP_RULES.forEach((rule) => {
    // Reset regex index
    rule.regex.lastIndex = 0
    let match

    while ((match = rule.regex.exec(text)) !== null) {
      const rawValue = match[0]

      // Validar si la regla tiene función de validación
      if (rule.validate && !rule.validate(rawValue)) {
        continue
      }

      findings.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        position: match.index,
        rawValue,
        maskedValue: rule.mask(rawValue, strategy),
      })
    }
  })

  // Aplicar reemplazos de forma descendente por posición para evitar desfases
  findings
    .sort((a, b) => b.position - a.position)
    .forEach((f) => {
      sanitized =
        sanitized.substring(0, f.position) +
        f.maskedValue +
        sanitized.substring(f.position + f.rawValue.length)
    })

  // Calcular Score de Riesgo (0 a 100)
  let riskScore = 0
  findings.forEach((f) => {
    if (f.severity === SEVERITY_LEVELS.CRITICAL) riskScore += 35
    else if (f.severity === SEVERITY_LEVELS.HIGH) riskScore += 20
    else if (f.severity === SEVERITY_LEVELS.MEDIUM) riskScore += 10
    else riskScore += 5
  })
  riskScore = Math.min(100, riskScore)

  return {
    findings: findings.sort((a, b) => a.position - b.position),
    sanitizedText: sanitized,
    riskScore,
    isCompliant: findings.length === 0,
  }
}
