# DevForge 🔥

[![CI](https://github.com/imandresmorales/devforge/actions/workflows/ci.yml/badge.svg)](https://github.com/imandresmorales/devforge/actions/workflows/ci.yml)
[![Deploy](https://github.com/imandresmorales/devforge/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/imandresmorales/devforge/actions/workflows/deploy-pages.yml)

**DevForge** es una plataforma educativa e interactiva para desarrolladores: más de 100 simuladores y herramientas para entender autenticación, pagos, seguridad web, arquitectura de sistemas, accesibilidad y rendimiento, todo ejecutándose en el navegador.

**[👉 Ver demo en vivo](https://imandresmorales.github.io/devforge/)**

> **Nota:** es un proyecto de demostración sin backend. El inicio de sesión, los pagos y las integraciones externas están **simulados** en el navegador con fines educativos; no se procesan pagos ni se envían datos personales.

## Funcionalidades destacadas

- **Autenticación simulada completa:** registro, login, rutas protegidas, access token en memoria y refresh token, con credenciales de prueba visibles en la pantalla de login.
- **Checkout tipo Stripe:** validación de tarjeta (Luhn), tokenización simulada y flujo de planes en la página de precios.
- **Auditores de seguridad:** CORS, CSRF, SSRF, detección de fugas de datos (DLP) y análisis de pipelines CI/CD con vulnerabilidades típicas del OWASP Top 10.
- **Simuladores de arquitectura:** caché, CDN, circuit breaker, consistent hashing, colas tipo Kafka, CRDTs, orquestación de contenedores y chaos engineering.
- **Herramientas de desarrollo:** Code Playground en un `iframe` aislado (sandbox), paleta de comandos, terminal simulada, visor de diffs y explorador de repositorios de GitHub (API pública).
- **Accesibilidad:** auditor en vivo, anunciador ARIA, trampas de foco, navegación con teclado y modo de movimiento reducido.
- **PWA e i18n:** instalable, funciona sin conexión gracias al Service Worker y disponible en español e inglés con i18next.

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + Vite |
| Router | React Router 7 |
| Estilos | CSS puro con design tokens (variables CSS) |
| Internacionalización | i18next + react-i18next |
| Testing | Vitest + React Testing Library (más de 100 archivos de prueba) |
| Linting | oxlint |
| CI/CD | GitHub Actions y GitHub Pages |

## Estructura del proyecto

```text
src/
├── components/
│   ├── layout/      # Header y Footer
│   └── ui/          # Componentes reutilizables y simuladores (un directorio por componente)
├── context/         # Auth, usuario, notificaciones, toasts y tour guiado
├── hooks/           # Hooks personalizados (useFetch, useTheme, useWebSocket, useServiceWorker…)
├── i18n/            # Configuración y traducciones
├── pages/           # Vistas: Home, Docs, Pricing, Dashboard, Profile, Login, Register…
├── services/        # Acceso a APIs externas (GitHub)
├── styles/          # Variables CSS, reset y utilidades globales
├── test/            # Configuración de Vitest
└── utils/           # Lógica pura de cada simulador, con sus pruebas
public/
├── sw.js            # Service Worker (caché offline)
└── manifest.json    # Manifest de la PWA
```

## Instalación y desarrollo

Requisitos: Node.js 22 o superior.

```bash
git clone https://github.com/imandresmorales/devforge.git
cd devforge
npm install
npm run dev
```

No se necesitan variables de entorno para ejecutar la demo. `.env.example` documenta las claves públicas opcionales; **nunca** pongas secretos en variables `VITE_*`, porque terminan en el código que se descarga en el navegador.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Bundle de producción en `/dist` |
| `npm run preview` | Vista previa del bundle de producción |
| `npm run lint` | Linter (oxlint) |
| `npm test` | Pruebas con Vitest |

## Buenas prácticas aplicadas

- ✅ Sin secretos en el frontend: la API de GitHub se usa sin token y los `.env*` están excluidos de git.
- ✅ El código que escribe el usuario en el Code Playground se ejecuta solo dentro de un `iframe` con `sandbox`, aislado de la aplicación.
- ✅ CI en cada Pull Request: lint, pruebas, build y `npm audit` de dependencias de producción.
- ✅ Dependabot para mantener las dependencias actualizadas.
- ✅ Funciona en la raíz de un dominio o en un subdirectorio (GitHub Pages) gracias a rutas relativas al `base` de Vite.
- ✅ Componentes pequeños, lógica separada en `utils/` y hooks reutilizables.

## Licencia

MIT — © 2025 Andres Morales
