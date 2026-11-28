import { SITE } from '@core/config/site.config';

/**
 * Adresse absolue d'un chemin du site, ou `null` tant que le domaine n'est pas choisi (`SITE.url`, seule
 * source). Les canoniques restent alors relatifs ; les balises qui exigent une adresse absolue (`og:url`,
 * `og:image`, données structurées) sont omises plutôt que fausses. Ne devine jamais un domaine.
 */
export function urlAbsolue(chemin: string, base: string | null = SITE.url): string | null {
  return base === null ? null : `${base}${chemin}`;
}

/** Adresse canonique : absolue quand le domaine est connu, sinon le chemin seul. */
export function urlCanonique(chemin: string, base: string | null = SITE.url): string {
  return urlAbsolue(chemin, base) ?? chemin;
}

/** Chemin de l'image de partage (1200 × 630, public/ngshelf-og.png). */
export const CHEMIN_IMAGE_PARTAGE = '/ngshelf-og.png';
export const LARGEUR_IMAGE_PARTAGE = 1200;
export const HAUTEUR_IMAGE_PARTAGE = 630;
