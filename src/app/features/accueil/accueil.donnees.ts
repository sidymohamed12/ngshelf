import { OptionSegment } from '@shared/components/choix-segment/choix-segment.component';
import { PieceVitrine } from '@shared/components/piece-vitrine/piece-vitrine.component';
import { TailleCase } from '@shared/models/taxonomie.model';

/** Les trois designs du catalogue : un seul endroit pour leur nom (noms propres, non traduits). */
export const DESIGNS_ACCUEIL = ['planche', 'fleuve', 'laterite'] as const;
export type DesignAccueil = (typeof DESIGNS_ACCUEIL)[number];
export const DESIGN_PAR_DEFAUT: DesignAccueil = 'planche';
/** Design que « Douze tokens » fait apparaître jeton par jeton (maquette : Fleuve). */
export const DESIGN_TEMOIN: DesignAccueil = 'fleuve';

export const NOMS_DESIGNS: Readonly<Record<DesignAccueil, string>> = {
  planche: 'Planche',
  fleuve: 'Fleuve',
  laterite: 'Latérite',
};

export const OPTIONS_DESIGNS: readonly OptionSegment[] = DESIGNS_ACCUEIL.map((valeur) => ({
  valeur,
  libelle: NOMS_DESIGNS[valeur],
}));

export function estDesignAccueil(valeur: string): valeur is DesignAccueil {
  return DESIGNS_ACCUEIL.some((design) => design === valeur);
}

/**
 * Les quatre pièces de la vitrine du hero (le faux site « Chez Awa »). Constantes plutôt que lues dans
 * l'index : le hero est le LCP, il ne dépend d'aucun chargement. Un test les compare au registre.
 */
export const PIECES_HERO = {
  navbar: { slug: 'navbar-restaurant', categorie: 'bloc', type: 'navbar' },
  hero: { slug: 'hero-restaurant', categorie: 'bloc', type: 'hero' },
  notification: { slug: 'notifications', categorie: 'composant', type: 'notification' },
  calendrier: { slug: 'calendrier', categorie: 'composant', type: 'calendrier' },
} as const satisfies Record<string, PieceVitrine>;

/**
 * Disposition de la planche de l'accueil : composée à la main (maquette accueil.js), pas celle du catalogue.
 * L'ordre et la taille de chaque case viennent d'ici ; le contenu vient du registre.
 */
export const DISPOSITION_PLANCHE: readonly {
  readonly slug: string;
  readonly taille: TailleCase;
}[] = [
  { slug: 'calendrier', taille: 'large-haute' },
  { slug: 'interrupteur', taille: 'normale' },
  { slug: 'carte-sejour', taille: 'haute' },
  { slug: 'curseur', taille: 'normale' },
  { slug: 'notifications', taille: 'large' },
  { slug: 'boutons', taille: 'large' },
  { slug: 'questions-frequentes', taille: 'large-haute' },
  { slug: 'champ-email', taille: 'normale' },
  { slug: 'fleuve', taille: 'normale' },
  { slug: 'planche', taille: 'normale' },
  { slug: 'laterite', taille: 'normale' },
];

/** Ressources montrées dans le panneau de chaque famille (les designs et les templates ont leur propre vue). */
export const SLUGS_FAMILLES = {
  composant: ['interrupteur', 'curseur'],
  bloc: ['questions-frequentes'],
} as const;
