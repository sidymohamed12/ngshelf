import type { Texte } from './texte.model';

/** Moments où une ressource s'anime (ADR 0007). */
export const MOMENTS = ['entree', 'sortie', 'survol', 'ouverture', 'changement'] as const;
export type Moment = (typeof MOMENTS)[number];

/** Animations propres d'une ressource, toujours désactivables (classe `.ngs-sans-animation`). */
export interface Motion {
  readonly resume: Texte;
  /** Au moins un moment. */
  readonly moments: readonly Moment[];
  readonly technique: string;
  /**
   * Boutons « Rejouer » de la fiche : `entree` pour rejouer l'entrée, `sortie` = classe posée sur l'hôte
   * pour jouer la sortie (exige `sortie` dans `moments`).
   */
  readonly rejouer?: { readonly entree?: true; readonly sortie?: string };
}
