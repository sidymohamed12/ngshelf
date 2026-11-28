import { ActivatedRouteSnapshot } from '@angular/router';

/** Bloc de données structurées (schema.org) : un objet JSON avec `@context` et `@type`. */
export type JsonLd = Readonly<Record<string, unknown>>;

/** Ce qu'une page dit d'elle-même aux moteurs de recherche et aux réseaux ; le titre vient de la route. */
export interface PageSeo {
  readonly description: string;
  /** Chemin de la page, sans domaine ni paramètres. */
  readonly chemin: string;
  /** Faux : `noindex, follow` (404, ressource introuvable). Les listes filtrées passent par `IndexationService`. */
  readonly indexable: boolean;
  readonly jsonLd: readonly JsonLd[];
}

/** Clé de `data` de la route qui porte la fabrique du SEO de la page. */
export const CLE_SEO = 'seo';

/** Fabrique du SEO d'une page ; appelée dans un contexte d'injection, avec la route résolue. */
export type FabriquePageSeo = (route: ActivatedRouteSnapshot) => PageSeo;
