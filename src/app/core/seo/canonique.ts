import { cheminCategorie, cheminSecteur, cheminType } from '@core/registre/chemins';
import { FiltresCatalogue, categorieDuType } from '@core/registre/filtres';

/** Page de l'explorateur global : les seules URL dont le canonique n'est pas leur propre chemin. */
export const CHEMIN_CATALOGUE = '/catalogue';

/**
 * Canonique d'une page de liste (ADR 0012, décision 3). Une page de chemin (`/blocs`, `/blocs/navbar`,
 * `/secteurs/restaurant`) est son propre canonique, paramètres exclus. `/catalogue?c=blocs` montre la
 * même chose que `/blocs` : son canonique est ce chemin, prérendu et indexé, et la page reste `noindex`.
 * Quand les filtres ne décrivent aucune page de chemin (deux secteurs, un type et un secteur…), le
 * canonique reste `/catalogue`. `q`, `tri` et les options ne changent pas la page de chemin visée.
 */
export function cheminCanonique(chemin: string, filtres: FiltresCatalogue): string {
  if (chemin !== CHEMIN_CATALOGUE) return chemin;
  const { categorie, types, secteurs } = filtres;
  if (types.length === 1 && secteurs.length === 0) {
    const categorieDuTypeUnique = categorieDuType(types[0]);
    if (categorieDuTypeUnique) return cheminType(categorieDuTypeUnique, types[0]);
  }
  if (types.length === 0 && secteurs.length === 1 && categorie === null) {
    return cheminSecteur(secteurs[0]);
  }
  if (types.length === 0 && secteurs.length === 0 && categorie !== null) {
    return cheminCategorie(categorie);
  }
  return CHEMIN_CATALOGUE;
}
