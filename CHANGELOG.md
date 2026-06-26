# Changelog — DevForge

Todos los cambios notables se documentan en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/)
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

### Planificado
- Mejora 3: Layout base y navegación con React Router DOM
- Mejora 4: Página de inicio con Hero Section y animaciones
- Mejora 5: Modo oscuro con `localStorage` y hook `useTheme`

---

## [0.2.0] - 2025-06-25

### Añadido — Mejora 2: Sistema de design tokens en CSS puro
- `src/styles/variables.css` — paleta de colores, tipografía, espaciado, sombras, radios
- `src/styles/reset.css` — reset CSS moderno (box-sizing, margin, padding)
- `src/styles/utilities.css` — clases de utilidad (flex, grid, text helpers)
- Fuentes Google Fonts: Inter (texto) y JetBrains Mono (código)
- Paleta oscura/clara lista para dark mode en la siguiente mejora

---

## [0.1.0] - 2025-06-25

### Añadido — Mejora 1: Scaffolding inicial del proyecto
- Proyecto creado con Vite + React 18
- Estructura de carpetas: `components/`, `hooks/`, `pages/`, `styles/`, `utils/`, `assets/`
- `.gitignore` completo (incluye `.env*` para proteger secrets)
- `.env.example` documentado con todas las variables necesarias
- `README.md` con instrucciones de instalación, estructura y roadmap
- `CHANGELOG.md` siguiendo Keep a Changelog
- Repositorio Git inicializado y conectado a GitHub
