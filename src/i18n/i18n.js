/**
 * @fileoverview Configuración de i18next para DevForge.
 *
 * PATRÓN APLICADO:
 * - Detección del idioma del navegador (navigator.language)
 * - Fallback a español si el idioma no está soportado
 * - Persistencia del idioma elegido en localStorage
 * - Interpolación segura: i18next escapa variables por defecto (anti-XSS)
 * - Namespaces: 'translation' por defecto (escalable a múltiples namespaces)
 *
 * SEGURIDAD:
 * - interpolation.escapeValue: false es SEGURO con React porque React ya
 *   escapa las cadenas renderizadas en el DOM. Si se usara fuera de React,
 *   se debería cambiar a true.
 *
 * @module i18n
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import es from './locales/es.json'
import en from './locales/en.json'

/** Idiomas soportados por la aplicación */
export const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

/** Idioma por defecto si no se detecta uno válido */
const DEFAULT_LANGUAGE = 'es'

/**
 * Lee el idioma guardado en localStorage de forma segura.
 * @returns {string}
 */
function getStoredLanguage() {
  try {
    const stored = localStorage.getItem('devforge-language')
    const supported = SUPPORTED_LANGUAGES.map((l) => l.code)
    return supported.includes(stored) ? stored : null
  } catch {
    return null
  }
}

/**
 * Detecta el idioma del navegador y lo mapea a un idioma soportado.
 * navigator.language puede devolver 'es-419', 'es-MX', 'en-US', etc.
 * Solo usamos los primeros 2 caracteres.
 * @returns {string}
 */
function getBrowserLanguage() {
  try {
    const browserLang = navigator.language?.slice(0, 2)?.toLowerCase()
    const supported = SUPPORTED_LANGUAGES.map((l) => l.code)
    return supported.includes(browserLang) ? browserLang : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

/** Idioma inicial: localStorage > navegador > español */
const initialLanguage = getStoredLanguage() ?? getBrowserLanguage()

i18n
  .use(initReactI18next) // Integra i18next con React (provee el hook useTranslation)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng:      initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      // React ya escapa las cadenas, por lo que esto es seguro.
      // Si fuera HTML puro, deberíamos mantenerlo en true.
      escapeValue: false,
    },
    // Previene que i18next loguee advertencias en consola en producción
    debug: import.meta.env.DEV,
  })

/**
 * Guarda el idioma seleccionado en localStorage.
 * Se llama desde el LanguageSelector al cambiar el idioma.
 * @param {string} lang
 */
export function persistLanguage(lang) {
  try {
    localStorage.setItem('devforge-language', lang)
  } catch {
    // Silencioso si localStorage no está disponible
  }
}

export default i18n
