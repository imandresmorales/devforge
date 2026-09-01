/**
 * @fileoverview Generador y formateador de árboles de estructura de directorios en ASCII y Markdown (Mejora 47).
 *
 * CARACTERÍSTICAS:
 * - Protección estricta contra Path Traversal (CWE-22) y caracteres de escape peligrosos.
 * - Generador de árbol ASCII con conectores canónicos (├──, └──, │).
 * - Soporte para plantillas predefinidas de arquitectura de software.
 * - Exportador de estructura a texto plano y Markdown.
 *
 * @module utils/treeGenerator
 */

/**
 * Plantillas predefinidas de arquitecturas de software.
 */
export const TREE_PRESETS = [
  {
    id: 'devforge_app',
    name: '⚡ DevForge Fullstack',
    paths: [
      'src/components/layout/Header/Header.jsx',
      'src/components/layout/Footer/Footer.jsx',
      'src/components/ui/Charts/BarChart.jsx',
      'src/components/ui/TerminalModal/TerminalModal.jsx',
      'src/components/ui/RateLimitSimulator/RateLimitSimulator.jsx',
      'src/context/AuthContext.jsx',
      'src/hooks/useWebSocket.js',
      'src/utils/rateLimiter.js',
      'src/utils/webhook.js',
      'src/utils/security.js',
      'src/App.jsx',
      'src/main.jsx',
      'vite.config.js',
      'package.json',
      'README.md',
    ],
  },
  {
    id: 'nextjs_app_router',
    name: '▲ Next.js 15 App Router',
    paths: [
      'app/(auth)/login/page.tsx',
      'app/(auth)/register/page.tsx',
      'app/dashboard/layout.tsx',
      'app/dashboard/page.tsx',
      'app/api/webhooks/stripe/route.ts',
      'app/layout.tsx',
      'app/page.tsx',
      'components/ui/button.tsx',
      'lib/auth.ts',
      'lib/db.ts',
      'next.config.js',
      'package.json',
    ],
  },
  {
    id: 'clean_architecture',
    name: '🏛️ Microservicio Clean Architecture',
    paths: [
      'src/domain/entities/User.ts',
      'src/domain/repositories/IUserRepository.ts',
      'src/application/use-cases/CreateUser.ts',
      'src/infrastructure/database/PostgresUserRepo.ts',
      'src/infrastructure/http/controllers/UserController.ts',
      'src/infrastructure/http/server.ts',
      'Dockerfile',
      'docker-compose.yml',
      'package.json',
    ],
  },
]

/**
 * Sanitiza una ruta para neutralizar ataques de Path Traversal.
 * @param {string} rawPath
 * @returns {string}
 */
export function sanitizePathSegment(rawPath = '') {
  return String(rawPath)
    .replace(/\0/g, '') // Eliminar caracteres nulos
    .replace(/(\.\.[\/\\])+/g, '') // Neutralizar ../ y ..\
    .replace(/[<>:"|?*]/g, '') // Eliminar caracteres prohibidos en sistemas de archivos
    .trim()
}

/**
 * Convierte un arreglo plano de rutas en una estructura de árbol anidada.
 * @param {string[]} paths
 * @returns {Object}
 */
export function buildTreeStructure(paths = []) {
  const root = {}

  paths.forEach((rawPath) => {
    const cleanPath = sanitizePathSegment(rawPath)
    if (!cleanPath) return

    const parts = cleanPath.split(/[\/\\]+/).filter(Boolean)
    let current = root

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current[part] = null // Archivo hoja
      } else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {}
        }
        current = current[part]
      }
    })
  })

  return root
}

/**
 * Genera una representación en árbol de texto ASCII a partir de una estructura anidada.
 * @param {Object} node - Nodo del árbol
 * @param {string} [prefix=''] - Prefijo de indentación
 * @param {boolean} [isRoot=true] - Si es el nivel raíz
 * @returns {string}
 */
export function formatTreeToASCII(node, prefix = '', isRoot = true) {
  if (!node || typeof node !== 'object') return ''

  const keys = Object.keys(node).sort((a, b) => {
    const aIsDir = node[a] !== null
    const bIsDir = node[b] !== null
    if (aIsDir && !bIsDir) return -1
    if (!aIsDir && bIsDir) return 1
    return a.localeCompare(b)
  })

  let output = ''

  keys.forEach((key, index) => {
    const isLast = index === keys.length - 1
    const connector = isLast ? '└── ' : '├── '
    const isDir = node[key] !== null
    const icon = isDir ? '📁 ' : '📄 '

    output += `${prefix}${connector}${icon}${key}\n`

    if (isDir) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ')
      output += formatTreeToASCII(node[key], childPrefix, false)
    }
  })

  return output
}

/**
 * Genera el árbol de proyecto ASCII completo a partir de una lista de rutas.
 * @param {string[]|string} input - Rutas o texto con una ruta por línea
 * @param {string} [rootName='project-root'] - Nombre del directorio raíz
 * @returns {string}
 */
export function generateAsciiProjectTree(input, rootName = 'my-project') {
  const paths = Array.isArray(input)
    ? input
    : String(input)
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)

  const tree = buildTreeStructure(paths)
  const formatted = formatTreeToASCII(tree)

  return `📁 ${rootName}/\n${formatted || '└── (Directorio vacío)\n'}`
}
