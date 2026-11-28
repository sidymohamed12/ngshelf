import { Categorie, Secteur, TailleCase, TypeRessource } from './taxonomie.model';
import { Texte } from './texte.model';
import { StatutRessource } from './ressource.model';

/**
 * Entrée de l'index du catalogue (ADR 0004 décision 3) : ce qu'il faut pour lister, filtrer et chercher
 * une ressource, rien de plus. Produite par scripts/registre depuis registry/, jamais écrite à la main.
 */
export interface EntreeIndex {
  readonly slug: string;
  readonly categorie: Categorie;
  /** Absent pour un design (il n'a pas de type). */
  readonly type: TypeRessource | null;
  readonly titre: Texte;
  readonly description: Texte;
  readonly secteurs: readonly Secteur[];
  readonly tags: readonly string[];
  readonly contratTokens: 1 | null;
  /** Dérivé de `motion` du meta.json (ADR 0007) : vrai si elle a des animations propres ; faux pour un design. */
  readonly animee: boolean;
  /** Taille de la case dans la planche (toujours renseignée : « normale » par défaut). */
  readonly tailleCase: TailleCase;
  /** Design montré dans la vignette live de la planche (ADR 0015) ; absent = le design par défaut. */
  readonly designMisEnAvant?: string;
  readonly statut: StatutRessource;
  /** AAAA-MM-JJ */
  readonly ajouteLe: string;
}

/**
 * Nombre de ressources publiées (hors `deprecie`) par axe. Petit : il est dans le bundle initial pour
 * le méga-menu et pour savoir quelles pages de type et de secteur existent.
 */
export interface Compteurs {
  readonly total: number;
  readonly categories: Readonly<Record<Categorie, number>>;
  /** Seuls les types qui ont au moins une ressource sont présents. */
  readonly types: Readonly<Partial<Record<TypeRessource, number>>>;
  /** Seuls les secteurs qui ont au moins une ressource sont présents. */
  readonly secteurs: Readonly<Partial<Record<Secteur, number>>>;
  /** Ressources réglables (qui suivent le contrat de tokens) et animées, pour les options du catalogue. */
  readonly options: { readonly reglables: number; readonly animees: number };
}

export type IndexParCategorie = Readonly<Record<Categorie, readonly EntreeIndex[]>>;
