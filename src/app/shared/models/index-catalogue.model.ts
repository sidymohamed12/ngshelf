import { Categorie, Secteur, TypeRessource } from './taxonomie.model';
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
}

export type IndexParCategorie = Readonly<Record<Categorie, readonly EntreeIndex[]>>;
