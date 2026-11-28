import { EntreeIndex } from '@shared/models/index-catalogue.model';
import {
  Categorie,
  CategorieTypee,
  SEGMENT_CATEGORIE,
  Secteur,
  TypeRessource,
} from '@shared/models/taxonomie.model';

/** Chemins du site (ADR 0004 décision 3) : la seule fabrique d'URL du catalogue. */

export const SEGMENT_SECTEURS = 'secteurs';

export function cheminCategorie(categorie: Categorie): string {
  return `/${SEGMENT_CATEGORIE[categorie]}`;
}

export function cheminType(categorie: CategorieTypee, type: TypeRessource): string {
  return `${cheminCategorie(categorie)}/${type}`;
}

export function cheminSecteur(secteur: Secteur): string {
  return `/${SEGMENT_SECTEURS}/${secteur}`;
}

/** Chemin de la fiche d'une ressource typée : /<categorie>/<type>/<slug>. */
export function cheminRessource(categorie: Categorie, type: TypeRessource, slug: string): string {
  return `/${SEGMENT_CATEGORIE[categorie]}/${type}/${slug}`;
}

/**
 * Chemin de la fiche d'une ressource : /<categorie>/<type>/<slug>.
 * Un design n'a pas encore de fiche (/designs/<slug>, phase ultérieure) : null, pas de lien.
 */
export function cheminFiche(entree: EntreeIndex): string | null {
  if (entree.type === null) return null;
  return cheminRessource(entree.categorie, entree.type, entree.slug);
}

/** Catégorie correspondant à un segment d'URL (« composants » donne « composant »), sinon undefined. */
export function categorieDepuisSegment(segment: string | undefined): Categorie | undefined {
  return (Object.keys(SEGMENT_CATEGORIE) as Categorie[]).find(
    (c) => SEGMENT_CATEGORIE[c] === segment,
  );
}
