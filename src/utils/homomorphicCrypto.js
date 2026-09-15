/**
 * @fileoverview Motor de Criptografía Homomórfica (Esquema de Paillier).
 *
 * Implementa el criptosistema aditivamente homomórfico de Pascal Paillier (1999).
 * Permite realizar operaciones matemáticas directamente sobre textos cifrados sin conocer
 * los datos originales en texto plano (Confidential Computing / Zero-Knowledge Processing).
 *
 * Propiedades Homomórficas Clave:
 * 1. Suma Homomórfica: Decrypt(Enc(m1) * Enc(m2) mod n^2) = (m1 + m2) mod n
 * 2. Multiplicación Escalar: Decrypt(Enc(m1)^k mod n^2) = (k * m1) mod n
 *
 * Aplicaciones Prácticas:
 * - Votaciones electrónicas con recuento anónimo auditable.
 * - Cálculo confidencial de nóminas y estadísticas médicas en la nube sin revelar PII.
 * - Machine learning que preserva la privacidad sobre datos encriptados.
 *
 * @module utils/homomorphicCrypto
 */

/**
 * Calcula el Máximo Común Divisor (GCD) entre dos BigInts usando el algoritmo de Euclides.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
export function bigGcd(a, b) {
  let x = a < 0n ? -a : a
  let y = b < 0n ? -b : b
  while (y !== 0n) {
    const t = y
    y = x % y
    x = t
  }
  return x
}

/**
 * Calcula el Mínimo Común Múltiplo (LCM) entre dos BigInts.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
export function bigLcm(a, b) {
  if (a === 0n || b === 0n) return 0n
  return ((a < 0n ? -a : a) * (b < 0n ? -b : b)) / bigGcd(a, b)
}

/**
 * Calcula la inversa modular a^(-1) mod m usando el Algoritmo Extendido de Euclides.
 * @param {bigint} a
 * @param {bigint} m
 * @returns {bigint}
 */
export function bigModInverse(a, m) {
  let [old_r, r] = [a % m, m]
  let [old_s, s] = [1n, 0n]

  while (r !== 0n) {
    const quotient = old_r / r
    ;[old_r, r] = [r, old_r - quotient * r]
    ;[old_s, s] = [s, old_s - quotient * s]
  }

  if (old_r > 1n) {
    throw new Error('Inversa modular no existe (no son coprimos)')
  }

  return ((old_s % m) + m) % m
}

/**
 * Exponenciación modular eficiente (base^exp mod mod).
 * @param {bigint} base
 * @param {bigint} exp
 * @param {bigint} mod
 * @returns {bigint}
 */
export function bigModPow(base, exp, mod) {
  if (mod === 1n) return 0n
  let result = 1n
  let b = ((base % mod) + mod) % mod
  let e = exp

  while (e > 0n) {
    if (e & 1n) {
      result = (result * b) % mod
    }
    e >>= 1n
    b = (b * b) % mod
  }
  return result
}

/**
 * Función L(u) de Paillier: L(u) = (u - 1) / n
 * @param {bigint} u
 * @param {bigint} n
 * @returns {bigint}
 */
export function paillierL(u, n) {
  return (u - 1n) / n
}

/**
 * Par de primos criptográficos por defecto para demostración didáctica e interactiva.
 * (En producción se usarían primos aleatorios de 2048/4096 bits generados con CSPRNG).
 */
export const DEFAULT_PRIMES = {
  p: 1009n,
  q: 1013n
}

/**
 * Genera un par de claves pública y privada para el criptosistema de Paillier.
 * @param {bigint} [p=1009n] - Primer primo.
 * @param {bigint} [q=1013n] - Segundo primo.
 * @returns {object} { publicKey: { n, n2, g }, privateKey: { lambda, mu, p, q } }
 */
export function generatePaillierKeys(p = DEFAULT_PRIMES.p, q = DEFAULT_PRIMES.q) {
  const n = p * q
  const n2 = n * n
  const lambda = bigLcm(p - 1n, q - 1n)
  const g = n + 1n // Elección canónica estándar g = n + 1

  // mu = (L(g^lambda mod n^2))^(-1) mod n
  // Dado que g = n + 1, g^lambda mod n^2 = (1 + lambda*n) mod n^2 => L(1 + lambda*n) = lambda
  // Por lo tanto mu = lambda^(-1) mod n
  const mu = bigModInverse(lambda, n)

  return {
    publicKey: {
      n: n.toString(),
      n2: n2.toString(),
      g: g.toString()
    },
    privateKey: {
      lambda: lambda.toString(),
      mu: mu.toString(),
      p: p.toString(),
      q: q.toString()
    }
  }
}

/**
 * Cifra un mensaje m (BigInt o number) con la clave pública de Paillier.
 * Fórmula: c = (g^m * r^n) mod n^2
 * @param {number|string|bigint} plaintext - Mensaje entero m (0 <= m < n).
 * @param {object} publicKey - Clave pública { n, n2, g }.
 * @param {bigint} [customR] - Número aleatorio opcional coprimo con n.
 * @returns {string} Texto cifrado en formato string numérico.
 */
export function encryptPaillier(plaintext, publicKey, customR = null) {
  const n = BigInt(publicKey.n)
  const n2 = BigInt(publicKey.n2)
  const g = BigInt(publicKey.g)
  const m = BigInt(plaintext)

  if (m < 0n || m >= n) {
    throw new Error(`El mensaje debe estar en el rango [0, n - 1]. n = ${n}`)
  }

  // Generar r aleatorio coprimo con n (o usar determinista si se proporciona)
  let r = customR ? BigInt(customR) : 17n
  if (bigGcd(r, n) !== 1n) {
    r = 19n
  }

  const gm = bigModPow(g, m, n2)
  const rn = bigModPow(r, n, n2)
  const c = (gm * rn) % n2

  return c.toString()
}

/**
 * Descifra un criptograma c con la clave privada de Paillier.
 * Fórmula: m = (L(c^lambda mod n^2) * mu) mod n
 * @param {string|bigint} ciphertext - Texto cifrado.
 * @param {object} privateKey - Clave privada { lambda, mu }.
 * @param {object} publicKey - Clave pública { n, n2 }.
 * @returns {number} Mensaje original descifrado en número entero.
 */
export function decryptPaillier(ciphertext, privateKey, publicKey) {
  const c = BigInt(ciphertext)
  const lambda = BigInt(privateKey.lambda)
  const mu = BigInt(privateKey.mu)
  const n = BigInt(publicKey.n)
  const n2 = BigInt(publicKey.n2)

  const cLambda = bigModPow(c, lambda, n2)
  const lVal = paillierL(cLambda, n)
  const m = (lVal * mu) % n

  return Number(m)
}

/**
 * Suma homomórfica de dos criptogramas:
 * c_sum = (c1 * c2) mod n^2
 * @param {string} ciphertext1
 * @param {string} ciphertext2
 * @param {object} publicKey
 * @returns {string} Criptograma del resultado de la suma.
 */
export function homomorphicAdd(ciphertext1, ciphertext2, publicKey) {
  const c1 = BigInt(ciphertext1)
  const c2 = BigInt(ciphertext2)
  const n2 = BigInt(publicKey.n2)

  const cSum = (c1 * c2) % n2
  return cSum.toString()
}

/**
 * Multiplicación homomórfica por un escalar k:
 * c_mult = (c^k) mod n^2
 * @param {string} ciphertext
 * @param {number|bigint} scalar
 * @param {object} publicKey
 * @returns {string} Criptograma del resultado de la multiplicación.
 */
export function homomorphicMultiplyScalar(ciphertext, scalar, publicKey) {
  const c = BigInt(ciphertext)
  const k = BigInt(scalar)
  const n2 = BigInt(publicKey.n2)

  const cMult = bigModPow(c, k, n2)
  return cMult.toString()
}

/**
 * Simulación de Nómina Confidencial y Privada:
 * El servidor en la nube calcula la suma total de salarios y bonificaciones sin descifrar
 * ni ver jamás los sueldos individuales de ningún empleado.
 * @param {Array<{ name: string, salary: number, bonus: number }>} employees
 * @param {object} publicKey
 * @returns {object} Datos cifrados y resultado homomórfico.
 */
export function computeConfidentialPayroll(employees, publicKey) {
  const encryptedRecords = employees.map((emp, idx) => {
    const encSalary = encryptPaillier(emp.salary, publicKey, BigInt(13 + idx * 4))
    const encBonus = encryptPaillier(emp.bonus, publicKey, BigInt(17 + idx * 4))
    // Suma de salario + bono en el servidor
    const encTotalComp = homomorphicAdd(encSalary, encBonus, publicKey)

    return {
      name: emp.name,
      salaryCiphertext: encSalary,
      bonusCiphertext: encBonus,
      totalCiphertext: encTotalComp
    }
  })

  // Acumular todos los salarios en un solo ciphertext total
  let totalPayrollCiphertext = encryptedRecords[0].totalCiphertext
  for (let i = 1; i < encryptedRecords.length; i++) {
    totalPayrollCiphertext = homomorphicAdd(
      totalPayrollCiphertext,
      encryptedRecords[i].totalCiphertext,
      publicKey
    )
  }

  return {
    encryptedRecords,
    totalPayrollCiphertext,
    computedByUntrustedCloud: true
  }
}
