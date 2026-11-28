import { SiteConfig } from '@core/config/site.config';
import { JsonLd } from './page-seo';

const CONTEXTE = 'https://schema.org';
const LICENCE_MIT = 'https://spdx.org/licenses/MIT.html';

export interface MaillonAriane {
  readonly nom: string;
  /** Chemin du maillon ; absent pour la page courante. */
  readonly chemin?: string;
}

/** Ajoute `cle` seulement si la valeur existe : pas de propriété à `null` dans les données structurées. */
function avec(cle: string, valeur: unknown): JsonLd {
  return valeur === undefined || valeur === null ? {} : { [cle]: valeur };
}

function url(chemin: string, base: string | null): string | null {
  return base === null ? null : `${base}${chemin}`;
}

/** L'auteur du site : une personne (le site est un projet individuel, pas une organisation). */
export function personne(site: SiteConfig): JsonLd {
  const { auteur } = site;
  return {
    '@type': 'Person',
    name: auteur.nomComplet,
    url: auteur.portfolio,
    sameAs: [auteur.github, auteur.linkedin, auteur.instagram, auteur.tiktok],
  };
}

/** `WebSite` (accueil) : le site, sa langue et son auteur. `url` n'existe qu'avec un domaine. */
export function siteWeb(site: SiteConfig): JsonLd {
  return {
    '@context': CONTEXTE,
    '@type': 'WebSite',
    name: site.nom,
    inLanguage: site.langue,
    ...avec('url', url('/', site.url)),
    author: personne(site),
  };
}

/**
 * `BreadcrumbList` : le fil d'Ariane de la page. Sans domaine, les maillons n'ont pas d'adresse (`item`) :
 * une adresse relative serait invalide.
 */
export function filAriane(maillons: readonly MaillonAriane[], base: string | null): JsonLd {
  return {
    '@context': CONTEXTE,
    '@type': 'BreadcrumbList',
    itemListElement: maillons.map((maillon, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: maillon.nom,
      ...avec('item', maillon.chemin === undefined ? null : url(maillon.chemin, base)),
    })),
  };
}

export interface PageDecrite {
  readonly nom: string;
  readonly description: string;
  readonly chemin: string;
}

/** `CollectionPage` : une liste de ressources (catalogue, catégorie, type, secteur). ADR 0004. */
export function pageCollection(page: PageDecrite, site: SiteConfig): JsonLd {
  return {
    '@context': CONTEXTE,
    '@type': 'CollectionPage',
    name: page.nom,
    description: page.description,
    inLanguage: site.langue,
    ...avec('url', url(page.chemin, site.url)),
  };
}

/** `AboutPage` : la page « À propos », dont l'auteur est la personne qui tient le site. */
export function pageAPropos(page: PageDecrite, site: SiteConfig): JsonLd {
  return {
    '@context': CONTEXTE,
    '@type': 'AboutPage',
    name: page.nom,
    description: page.description,
    inLanguage: site.langue,
    ...avec('url', url(page.chemin, site.url)),
    about: { '@type': 'WebSite', name: site.nom },
    author: personne(site),
  };
}

export interface FicheDecrite extends PageDecrite {
  readonly motsCles: readonly string[];
  readonly ajouteLe: string;
  readonly modifieLe?: string;
  readonly auteur: { readonly nom: string; readonly url?: string };
  readonly angularMin: string;
}

/**
 * `SoftwareSourceCode` : une fiche est du code à copier ou à télécharger sous licence MIT. On n'emploie pas
 * `SoftwareApplication` : elle suppose un produit installable (et promet des extraits enrichis avec note ou
 * prix) alors que la fiche livre des fichiers source. Pas de `codeRepository` : le dépôt n'existe pas encore.
 */
export function ficheCode(fiche: FicheDecrite, site: SiteConfig): JsonLd {
  return {
    '@context': CONTEXTE,
    '@type': 'SoftwareSourceCode',
    name: fiche.nom,
    description: fiche.description,
    inLanguage: site.langue,
    ...avec('url', url(fiche.chemin, site.url)),
    programmingLanguage: 'TypeScript',
    runtimePlatform: `Angular ${fiche.angularMin}`,
    license: LICENCE_MIT,
    isAccessibleForFree: true,
    keywords: fiche.motsCles.join(', '),
    dateCreated: fiche.ajouteLe,
    ...avec('dateModified', fiche.modifieLe),
    author: {
      '@type': 'Person',
      name: fiche.auteur.nom,
      ...avec('url', fiche.auteur.url),
    },
  };
}

/**
 * Sérialisation sûre dans un `<script type="application/ld+json">` : `<` est échappé (`<`), donc aucun
 * texte ne peut fermer la balise ni ouvrir un commentaire HTML. Le JSON reste valide.
 */
export function serialiserJsonLd(donnees: JsonLd): string {
  return JSON.stringify(donnees).replaceAll('<', '\\u003c');
}
