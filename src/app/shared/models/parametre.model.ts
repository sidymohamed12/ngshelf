import type { Texte } from './texte.model';

/** Valeur d'un paramètre réglable : texte (choix), nombre ou booléen. */
export type ValeurParametre = string | number | boolean;

interface ParametreBase {
  /** Nom de l'input du composant (par exemple `orientation`) : il doit figurer dans le tableau « Paramètres ». */
  readonly nom: string;
  /** Libellé du réglage dans la fiche. */
  readonly libelle: Texte;
}

/** Un choix parmi une liste fermée : segmenté dans la fiche. */
export interface ParametreChoix extends ParametreBase {
  readonly genre: 'choix';
  readonly options: readonly { readonly valeur: string; readonly libelle: Texte }[];
  readonly defaut: string;
}

/** Un nombre borné : curseur dans la fiche. */
export interface ParametreNombre extends ParametreBase {
  readonly genre: 'nombre';
  readonly min: number;
  readonly max: number;
  readonly pas: number;
  readonly unite?: string;
  readonly defaut: number;
}

/** Un booléen : interrupteur dans la fiche. */
export interface ParametreInterrupteur extends ParametreBase {
  readonly genre: 'interrupteur';
  readonly defaut: boolean;
}

/**
 * Paramètre propre à une ressource, réglable dans la fiche et transmis à l'aperçu par `ngs-reglages`
 * (ADR 0014). La définition est la liste blanche : l'aperçu ignore tout nom, type ou valeur qu'elle ne prévoit pas.
 */
export type ParametreReglable = ParametreChoix | ParametreNombre | ParametreInterrupteur;

export type ValeursParametres = Readonly<Record<string, ValeurParametre>>;
