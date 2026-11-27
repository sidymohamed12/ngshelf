import { TEXTES } from '@core/i18n/textes.fr';

export interface LienNavigation {
  readonly chemin: string;
  readonly libelle: string;
  /** Classe de famille (.ngs-cat-*) qui pose la couleur du repère ; absente = lien neutre. */
  readonly classeFamille?: string;
}

const CATALOGUE: LienNavigation = {
  chemin: '/catalogue',
  libelle: TEXTES.nav.catalogue,
};
const COMPOSANTS: LienNavigation = {
  chemin: '/composants',
  libelle: TEXTES.nav.composants,
  classeFamille: 'ngs-cat-composants',
};
const BLOCS: LienNavigation = {
  chemin: '/blocs',
  libelle: TEXTES.nav.blocs,
  classeFamille: 'ngs-cat-blocs',
};
const TEMPLATES: LienNavigation = {
  chemin: '/templates',
  libelle: TEXTES.nav.templates,
  classeFamille: 'ngs-cat-templates',
};
const DESIGNS: LienNavigation = {
  chemin: '/designs',
  libelle: TEXTES.nav.designs,
  classeFamille: 'ngs-cat-designs',
};
const A_PROPOS: LienNavigation = { chemin: '/a-propos', libelle: TEXTES.nav.apropos };

/** Navigation principale du header (grands écrans). */
export const LIENS_HEADER: readonly LienNavigation[] = [
  CATALOGUE,
  COMPOSANTS,
  BLOCS,
  DESIGNS,
  A_PROPOS,
];

/** Navigation du menu mobile : les quatre familles y sont toutes. */
export const LIENS_MENU_MOBILE: readonly LienNavigation[] = [
  CATALOGUE,
  COMPOSANTS,
  BLOCS,
  TEMPLATES,
  DESIGNS,
  A_PROPOS,
];

/** Liens de familles du pied de page. */
export const LIENS_FAMILLES: readonly LienNavigation[] = [COMPOSANTS, BLOCS, TEMPLATES, DESIGNS];
