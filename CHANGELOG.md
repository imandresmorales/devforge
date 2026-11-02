# Changelog — DevForge

Todos los cambios notables se documentan en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/)
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.0.0] - 2026-11-02

### Añadido
- Despliegue automático en GitHub Pages y CI (lint, pruebas, build y auditoría de dependencias).
- Dependabot para actualizaciones de dependencias.
- Aviso de modo demostración en el checkout.

### Cambiado
- La app funciona bajo un subdirectorio (`base` de Vite, `basename` del router, Service Worker y manifest con rutas relativas).
- README actualizado al stack real (React 19, React Router 7, oxlint).

### Seguridad
- Se elimina el soporte de `VITE_GITHUB_TOKEN`: cualquier token con prefijo `VITE_` queda expuesto en el bundle público.

### Eliminado
- Archivos de plantilla sin uso y notas internas de desarrollo (`walkthrough.md`).

> Las mejoras 3 a 120 se documentaron en los mensajes de commit de cada mejora.

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
