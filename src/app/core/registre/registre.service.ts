import { Service, inject } from '@angular/core';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { ParametresFiche } from '@shared/models/ressource.model';
import {
  CATEGORIES,
  Categorie,
  CategorieTypee,
  SECTEURS,
  SEGMENT_CATEGORIE,
  Secteur,
  TYPES_PAR_CATEGORIE,
  TypeRessource,
} from '@shared/models/taxonomie.model';
import { categorieDepuisSegment } from './chemins';
import { CHARGEUR_INDEX, COMPTEURS } from './registre.donnees';

/** Une ressource dépréciée garde sa page mais n'apparaît ni dans les listes ni dans la recherche. */
export function estVisible(entree: EntreeIndex): boolean {
  return entree.statut !== 'deprecie';
}

/**
 * Accès au registre côté site : compteurs immédiats, index chargés à la demande (un chunk par
 * catégorie) et mémorisés. Un chargement qui échoue n'est pas mémorisé : on peut réessayer.
 */
@Service()
export class RegistreService {
  readonly #chargeur = inject(CHARGEUR_INDEX);
  readonly #caches = new Map<Categorie, Promise<readonly EntreeIndex[]>>();

  readonly compteurs = COMPTEURS;

  indexDe(categorie: Categorie): Promise<readonly EntreeIndex[]> {
    const memorise = this.#caches.get(categorie);
    if (memorise) return memorise;
    const chargement = this.#chargeur(categorie);
    this.#caches.set(categorie, chargement);
    chargement.catch(() => this.#caches.delete(categorie));
    return chargement;
  }

  /** Tout le registre, dépréciées comprises (le filtre `estVisible` est à la charge de l'appelant). */
  async toutes(): Promise<readonly EntreeIndex[]> {
    const parCategorie = await Promise.all(CATEGORIES.map((c) => this.indexDe(c)));
    return parCategorie.flat();
  }

  /** Ressources visibles d'un type, dans l'ordre de l'index. */
  async duType(categorie: CategorieTypee, type: TypeRessource): Promise<readonly EntreeIndex[]> {
    const index = await this.indexDe(categorie);
    return index.filter((e) => e.type === type && estVisible(e));
  }

  /** Ressources visibles d'un secteur, toutes catégories confondues. */
  async duSecteur(secteur: Secteur): Promise<readonly EntreeIndex[]> {
    const toutes = await this.toutes();
    return toutes.filter((e) => e.secteurs.includes(secteur) && estVisible(e));
  }

  async trouver(parametres: Partial<ParametresFiche>): Promise<EntreeIndex | undefined> {
    const categorie = categorieDepuisSegment(parametres.categorie);
    if (categorie === undefined || categorie === 'design') return undefined;
    const index = await this.indexDe(categorie);
    return index.find((e) => e.type === parametres.type && e.slug === parametres.slug);
  }

  /** Paramètres de toutes les fiches à prérendre (getPrerenderParams de app.routes.server.ts). */
  async parametresPrerendu(): Promise<ParametresFiche[]> {
    const toutes = await this.toutes();
    return toutes.flatMap((e) =>
      e.type === null
        ? []
        : [{ categorie: SEGMENT_CATEGORIE[e.categorie], type: e.type, slug: e.slug }],
    );
  }

  /** Types qui ont au moins une ressource : seules leurs pages sont prérendues (ADR 0004). */
  typesNonVides(categorie: CategorieTypee): TypeRessource[] {
    return TYPES_PAR_CATEGORIE[categorie].filter((t) => (this.compteurs.types[t] ?? 0) > 0);
  }

  secteursNonVides(): Secteur[] {
    return SECTEURS.filter((s) => (this.compteurs.secteurs[s] ?? 0) > 0);
  }
}
