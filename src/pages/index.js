/**
 * @fileoverview Barrel export de páginas de la aplicación.
 * @module pages
 */
export { default as HomePage }      from './HomePage/HomePage.jsx'
export { default as AboutPage }     from './AboutPage/AboutPage.jsx'
export { default as DocsPage }      from './DocsPage/DocsPage.jsx'
export { default as DashboardPage } from './DashboardPage/DashboardPage.jsx'
export { default as ContactPage }   from './ContactPage/ContactPage.jsx'
export { default as ProfilePage }   from './ProfilePage/ProfilePage.jsx'
export { default as NotFoundPage }  from './NotFoundPage/NotFoundPage.jsx'
// Mejora 21 — Autenticación
export { default as LoginPage }    from './LoginPage/LoginPage.jsx'
export { default as RegisterPage } from './RegisterPage/RegisterPage.jsx'
// Mejora 23 — GitHub API
export { default as GitHubPage }   from './GitHubPage/GitHubPage.jsx'
