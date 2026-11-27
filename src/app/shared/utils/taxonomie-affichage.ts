import { NomIcone } from '@shared/components/icone/icones';
import { Categorie, SEGMENT_CATEGORIE, Secteur } from '@shared/models/taxonomie.model';

/** Icône (sprite Phosphor) de chaque famille du catalogue. */
export const ICONE_CATEGORIE: Readonly<Record<Categorie, NomIcone>> = {
  composant: 'squares-four',
  bloc: 'rows',
  template: 'browser',
  design: 'palette',
};

/** Icône de chaque secteur (maquette : NGS.secteurs). */
export const ICONE_SECTEUR: Readonly<Record<Secteur, NomIcone>> = {
  voyage: 'airplane-tilt',
  restaurant: 'fork-knife',
  transport: 'bus',
  sante: 'first-aid',
  immobilier: 'house-line',
  education: 'graduation-cap',
  commerce: 'storefront',
  finance: 'bank',
  evenementiel: 'calendar-star',
  'beaute-bien-etre': 'flower-lotus',
  sport: 'soccer-ball',
  saas: 'cloud',
  associatif: 'hand-heart',
  creatif: 'paint-brush',
};

/** Classe de famille (.ngs-cat-*) qui pose la couleur du repère d'une catégorie. */
export function classeCategorie(categorie: Categorie): string {
  return `ngs-cat-${SEGMENT_CATEGORIE[categorie]}`;
}
