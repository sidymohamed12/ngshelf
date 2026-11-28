import {
  CATEGORIES,
  CATEGORIES_TYPEES,
  SECTEURS,
  SEGMENT_CATEGORIE,
  TYPES_PAR_CATEGORIE,
} from '../../src/app/shared/models/taxonomie.model.ts';
import type { Compteurs, EntreeIndex } from '../../src/app/shared/models/index-catalogue.model.ts';
import type { Categorie } from '../../src/app/shared/models/taxonomie.model.ts';

/**
 * Sitemap (ADR 0004) : catégories, types et secteurs non vides, fiches. Jamais `/apercu/*`, les URL à
 * paramètres, les pages sans contenu ni la 404. Fonctions pures : le script `scripts/dist/seo.ts` lit les
 * sorties du registre et écrit les fichiers. Les chemins sont ceux de `core/registre/chemins.ts` (testé).
 */

export const ENTETE_SITEMAP = '<?xml version="1.0" encoding="UTF-8"?>';
export const ESPACE_NOMS_SITEMAP = 'http://www.sitemaps.org/schemas/sitemap/0.9';
/** Limite du protocole : 50 000 adresses par fichier. */
export const LIMITE_ADRESSES = 50_000;

export interface SourceSitemap {
  readonly compteurs: Compteurs;
  readonly index: Readonly<Record<Categorie, readonly EntreeIndex[]>>;
}

/** `https://domaine` sans barre finale ni chemin, sinon une erreur claire. `null` reste `null` (pas de domaine). */
export function validerUrlSite(url: string | null): string | null {
  if (url === null) return null;
  if (!/^https:\/\/[^/\s?#]+$/.test(url)) {
    throw new Error(
      `SITE.url doit être une adresse https sans barre finale ni chemin (ex. https://exemple.fr) : « ${url} »`,
    );
  }
  return url;
}

/** Chemins publics à indexer, dans un ordre stable : pages fixes, catégories, types, secteurs, fiches. */
export function cheminsSitemap({ compteurs, index }: SourceSitemap): string[] {
  const chemins = ['/', '/catalogue', '/a-propos'];
  for (const categorie of CATEGORIES) {
    if (compteurs.categories[categorie] > 0) chemins.push(`/${SEGMENT_CATEGORIE[categorie]}`);
  }
  for (const categorie of CATEGORIES_TYPEES) {
    for (const type of TYPES_PAR_CATEGORIE[categorie]) {
      if ((compteurs.types[type] ?? 0) > 0) {
        chemins.push(`/${SEGMENT_CATEGORIE[categorie]}/${type}`);
      }
    }
  }
  for (const secteur of SECTEURS) {
    if ((compteurs.secteurs[secteur] ?? 0) > 0) chemins.push(`/secteurs/${secteur}`);
  }
  for (const categorie of CATEGORIES) {
    for (const entree of index[categorie]) {
      if (entree.type === null || entree.statut === 'deprecie') continue;
      chemins.push(`/${SEGMENT_CATEGORIE[categorie]}/${entree.type}/${entree.slug}`);
    }
  }
  return chemins;
}

function echapperXml(texte: string): string {
  return texte
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * `sitemap.xml` : une `<url>` par chemin, adresses absolues. Pas de `<lastmod>` : le registre ne connaît que la
 * date d'ajout, et une date de modification inexacte vaut moins que pas de date.
 */
export function construireSitemap(base: string, chemins: readonly string[]): string {
  if (chemins.length > LIMITE_ADRESSES) {
    throw new Error(`Sitemap trop grand : ${chemins.length} adresses (limite ${LIMITE_ADRESSES}).`);
  }
  const urls = chemins.map(
    (chemin) => `  <url><loc>${echapperXml(`${base}${chemin}`)}</loc></url>`,
  );
  return [ENTETE_SITEMAP, `<urlset xmlns="${ESPACE_NOMS_SITEMAP}">`, ...urls, '</urlset>', ''].join(
    '\n',
  );
}

/** Adresses `<loc>` d'un sitemap, pour les recouper avec les pages prérendues. */
export function adressesDuSitemap(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>([^<]*)<\/loc>/g), (m) => m[1] ?? '');
}

/** Ajoute (ou remplace) la ligne `Sitemap:` de robots.txt ; idempotent. */
export function ajouterSitemapRobots(robots: string, base: string): string {
  const sansLigne = robots
    .split('\n')
    .filter((ligne) => !/^sitemap:/i.test(ligne.trim()))
    .join('\n')
    .trimEnd();
  return `${sansLigne}\n\nSitemap: ${base}/sitemap.xml\n`;
}
