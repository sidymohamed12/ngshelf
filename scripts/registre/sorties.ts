import type { Compteurs, EntreeIndex } from '../../src/app/shared/models/index-catalogue.model.ts';
import type { MetaRegistre } from './valider.ts';
import type {
  Categorie,
  Secteur,
  TypeRessource,
} from '../../src/app/shared/models/taxonomie.model.ts';

/**
 * Sorties du registre consommées par le site (phase 2) : un index par catégorie et les compteurs.
 * Pures et déterministes : même registre, mêmes octets (pas de date, ordre stable).
 */

export interface Sorties {
  readonly index: Readonly<Record<Categorie, readonly EntreeIndex[]>>;
  readonly compteurs: Compteurs;
}

function versEntree(meta: MetaRegistre): EntreeIndex {
  return {
    slug: meta.slug,
    categorie: meta.categorie,
    type: meta.categorie === 'design' ? null : meta.type,
    titre: meta.titre,
    description: meta.description,
    secteurs: meta.secteurs,
    tags: meta.tags,
    contratTokens: meta.contratTokens,
    statut: meta.statut,
    ajouteLe: meta.ajouteLe,
  };
}

function comparer(a: EntreeIndex, b: EntreeIndex): number {
  return a.titre.fr.localeCompare(b.titre.fr, 'fr') || a.slug.localeCompare(b.slug, 'en');
}

function incrementer<K extends string>(table: Partial<Record<K, number>>, cle: K): void {
  table[cle] = (table[cle] ?? 0) + 1;
}

/** Une ressource dépréciée garde sa page mais sort des listes : elle n'est donc pas comptée. */
export function construireCompteurs(entrees: readonly EntreeIndex[]): Compteurs {
  const categories: Record<Categorie, number> = { composant: 0, bloc: 0, template: 0, design: 0 };
  const types: Partial<Record<TypeRessource, number>> = {};
  const secteurs: Partial<Record<Secteur, number>> = {};
  let total = 0;
  for (const entree of entrees.filter((e) => e.statut !== 'deprecie')) {
    total += 1;
    categories[entree.categorie] += 1;
    if (entree.type !== null) incrementer(types, entree.type);
    for (const secteur of entree.secteurs) incrementer(secteurs, secteur);
  }
  return { total, categories, types, secteurs };
}

export function construireSorties(metas: readonly MetaRegistre[]): Sorties {
  const entrees = metas.map(versEntree).sort(comparer);
  const de = (categorie: Categorie): readonly EntreeIndex[] =>
    entrees.filter((e) => e.categorie === categorie);
  const index = {
    composant: de('composant'),
    bloc: de('bloc'),
    template: de('template'),
    design: de('design'),
  };
  return { index, compteurs: construireCompteurs(entrees) };
}

/** JSON stable, indentation de 2 espaces, retour à la ligne final. */
export function enJson(valeur: unknown): string {
  return `${JSON.stringify(valeur, null, 2)}\n`;
}

/** Nom du fichier d'index d'une catégorie, sous src/generated/registre/. */
export function nomFichierIndex(categorie: Categorie): string {
  return `index-${categorie}.json`;
}

export const NOM_FICHIER_COMPTEURS = 'compteurs.json';
