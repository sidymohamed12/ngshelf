import { InjectionToken } from '@angular/core';
import compteursGeneres from '@generated/registre/compteurs.json';
import { Compteurs, EntreeIndex } from '@shared/models/index-catalogue.model';
import { Categorie } from '@shared/models/taxonomie.model';

/**
 * Sorties de scripts/registre (src/generated/registre/, régénérées avant chaque build).
 * Le JSON est typé large par TypeScript : la forme est garantie par le script, qui valide le registre
 * contre la taxonomie ; c'est le seul endroit où on la reprécise.
 */

/** Compteurs : dans le bundle initial (méga-menu), quelques centaines d'octets. */
export const COMPTEURS = compteursGeneres as Compteurs;

/** Charge l'index d'une catégorie. Remplaçable en test pour simuler un échec. */
export type ChargeurIndex = (categorie: Categorie) => Promise<readonly EntreeIndex[]>;

/** Un index par catégorie, en chunk à part : jamais dans le bundle initial (ADR 0004). */
const IMPORTS_INDEX: Record<Categorie, () => Promise<{ default: unknown }>> = {
  composant: () => import('@generated/registre/index-composant.json'),
  bloc: () => import('@generated/registre/index-bloc.json'),
  template: () => import('@generated/registre/index-template.json'),
  design: () => import('@generated/registre/index-design.json'),
};

/** Chargeur par défaut : les index générés, un chunk par catégorie. */
export const chargerIndexGenere: ChargeurIndex = async (categorie) => {
  const module = await IMPORTS_INDEX[categorie]();
  return module.default as readonly EntreeIndex[];
};

export const CHARGEUR_INDEX = new InjectionToken<ChargeurIndex>('CHARGEUR_INDEX', {
  factory: () => chargerIndexGenere,
});
