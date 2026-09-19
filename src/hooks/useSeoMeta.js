/**
 * @fileoverview Hook useSeoMeta — Actualización declarativa de SEO y Social Graph por componente (Mejora 108).
 *
 * @module hooks/useSeoMeta
 */

import { useEffect } from 'react'
import { applySeoMetadata } from '../utils/seoEngine'

/**
 * Hook para actualizar los metadatos SEO en el ciclo de vida de una página o componente.
 * @param {{
 *  title?: string,
 *  description?: string,
 *  canonical?: string,
 *  image?: string,
 *  type?: string,
 *  robots?: string,
 *  keywords?: string,
 * }} seoConfig
 */
export function useSeoMeta(seoConfig = {}) {
  useEffect(() => {
    applySeoMetadata(seoConfig)
  }, [
    seoConfig.title,
    seoConfig.description,
    seoConfig.canonical,
    seoConfig.image,
    seoConfig.type,
    seoConfig.robots,
    seoConfig.keywords,
  ])
}

export default useSeoMeta
