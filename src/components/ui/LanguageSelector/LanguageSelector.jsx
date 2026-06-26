/**
 * @fileoverview LanguageSelector — selector de idioma para el Header.
 *
 * Consume el hook useTranslation de react-i18next para:
 * - Mostrar los idiomas disponibles
 * - Cambiar el idioma activo con i18n.changeLanguage()
 * - Persistir la elección en localStorage
 *
 * @module components/ui/LanguageSelector
 */
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, persistLanguage } from '../../../i18n/i18n.js'

/**
 * Selector de idioma compacto para el Header.
 * @returns {JSX.Element}
 */
function LanguageSelector() {
  const { i18n } = useTranslation()

  function handleChange(e) {
    const newLang = e.target.value
    i18n.changeLanguage(newLang)
    persistLanguage(newLang)
  }

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        cursor: 'pointer',
      }}
      aria-label="Seleccionar idioma"
    >
      <span aria-hidden="true" style={{ fontSize: 'var(--text-sm)' }}>🌐</span>
      <select
        value={i18n.language}
        onChange={handleChange}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          outline: 'none',
          padding: 'var(--space-1)',
        }}
        aria-label="Idioma de la aplicación"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default LanguageSelector
