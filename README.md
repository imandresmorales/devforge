# DevForge 🔥

**DevForge** es una plataforma educativa e interactiva para informáticos. Cubre las tecnologías y conceptos más importantes del desarrollo web moderno: autenticación, pagos, APIs externas, seguridad, rendimiento, PWA y mucho más.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite |
| Estilos | CSS puro (variables, custom properties) |
| Router | React Router DOM v6 |
| Testing | Vitest + React Testing Library |
| Linting | ESLint + Prettier |

## Estructura del proyecto

```
src/
├── assets/          # Imágenes, fuentes e iconos estáticos
├── components/      # Componentes reutilizables de UI
│   ├── ui/          # Primitivos (Button, Input, Card, Badge…)
│   └── layout/      # Header, Footer, Sidebar
├── hooks/           # Custom hooks (useFetch, useTheme, useLocalStorage…)
├── pages/           # Vistas / páginas de la aplicación
├── styles/          # Variables CSS, reset, utilidades globales
└── utils/           # Funciones puras de utilidad
```

## Buenas prácticas aplicadas

- ✅ Variables de entorno para todos los secrets (`.env.local`, nunca comiteado)
- ✅ `.gitignore` completo — `.env*` siempre excluido
- ✅ CSS con design tokens (variables CSS) para consistencia visual
- ✅ Componentes pequeños y de responsabilidad única (SRP)
- ✅ Hooks personalizados para lógica reutilizable

## Requisitos previos

- Node.js ≥ 18
- npm ≥ 9

## Instalación y desarrollo

```bash
# Clonar el repositorio
git clone https://github.com/imandresmorales/devforge.git
cd devforge

# Instalar dependencias
npm install

# Variables de entorno (copiar el ejemplo y completar los valores)
cp .env.example .env.local

# Iniciar el servidor de desarrollo
npm run dev
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Genera el bundle de producción en `/dist` |
| `npm run preview` | Vista previa del bundle de producción |
| `npm run lint` | Ejecuta el linter |

## Variables de entorno

Copia `.env.example` → `.env.local` y completa los valores. **Nunca subas `.env.local` al repositorio.**

## Roadmap — 100 Mejoras

Ver [CHANGELOG.md](./CHANGELOG.md) para el progreso detallado.

- [x] **Mejora 1** — Scaffolding inicial, estructura de carpetas y configuración
- [x] **Mejora 2** — Sistema de design tokens en CSS puro
- [ ] **Mejora 3** — Layout base y navegación con React Router
- [ ] *…97 mejoras más planificadas*

## Contribuir

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/mi-mejora`
3. Commit con mensaje descriptivo: `git commit -m "feat: descripción clara"`
4. Abre un Pull Request

## Licencia

MIT — © 2025 Andres Morales
