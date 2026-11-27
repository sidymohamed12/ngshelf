import { CategorieTypee, Secteur, TailleCase, TypeRessource } from './taxonomie.model';
import { Texte } from './texte.model';

/** Cycle de vie d'une ressource ; `provisoire` affiche le badge « Démo provisoire ». */
export type StatutRessource = 'provisoire' | 'publie' | 'deprecie';

export type VarianteStyle = 'tailwind' | 'css';

/** Réservé (ADR 0004 décision 4) : en v1, toujours vide, une ressource est autonome. */
export interface Dependances {
  readonly npm: readonly {
    readonly nom: string;
    readonly version: string;
    readonly dev?: boolean;
  }[];
  readonly ressources: readonly string[];
}

export interface AuteurRessource {
  readonly nom: string;
  readonly url?: string;
}

/** Métadonnées d'un composant, d'un bloc ou d'un template (ADR 0004 décision 2). */
export interface MetaRessource {
  readonly schema: 1;
  /** kebab-case, unique dans tout le registre, immuable. */
  readonly slug: string;
  readonly categorie: CategorieTypee;
  readonly type: TypeRessource;
  readonly titre: Texte;
  /** 160 caractères au plus (meta description). */
  readonly description: Texte;
  /** 0 à 3 secteurs. */
  readonly secteurs: readonly Secteur[];
  /** 0 à 8 tags normalisés (minuscules, tirets). */
  readonly tags: readonly string[];
  /** Version majeure du contrat de tokens suivie ; null = non réglable. */
  readonly contratTokens: 1 | null;
  readonly designsMisEnAvant?: readonly string[];
  /** Vrai si la ressource a ses propres animations, désactivables : badge « Animée » et filtre (absent = faux). */
  readonly animee?: boolean;
  /** Taille de sa case dans la planche du catalogue (absent = « normale », 1×1). */
  readonly tailleCase?: TailleCase;
  readonly variantes: readonly VarianteStyle[];
  readonly angularMin: string;
  readonly licence: 'MIT';
  readonly auteur: AuteurRessource;
  readonly statut: StatutRessource;
  /** AAAA-MM-JJ */
  readonly ajouteLe: string;
  readonly modifieLe?: string;
  readonly anciensChemins?: readonly string[];
  readonly dependances: Dependances;
}

/** Un design = un jeu de valeurs du contrat de tokens, en clair et en sombre. */
export interface MetaDesign {
  readonly schema: 1;
  readonly slug: string;
  readonly categorie: 'design';
  readonly titre: Texte;
  readonly description: Texte;
  readonly secteurs: readonly Secteur[];
  readonly tags: readonly string[];
  readonly contratTokens: 1;
  readonly valeurs: {
    readonly clair: Readonly<Record<string, string>>;
    readonly sombre?: Readonly<Record<string, string>>;
  };
  readonly licence: 'MIT';
  readonly statut: StatutRessource;
  readonly ajouteLe: string;
}

/** Paramètres de la route /:categorie/:type/:slug (URL de détail, ADR 0004). */
export type ParametresFiche = Readonly<Record<'categorie' | 'type' | 'slug', string>>;
