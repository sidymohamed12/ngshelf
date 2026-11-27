import { Compteurs, EntreeIndex } from '@shared/models/index-catalogue.model';
import {
  CATEGORIES,
  CATEGORIES_TYPEES,
  Categorie,
  SECTEURS,
  SEGMENT_CATEGORIE,
  Secteur,
  TYPES_PAR_CATEGORIE,
  TypeRessource,
} from '@shared/models/taxonomie.model';
import { categorieDepuisSegment } from './chemins';

/**
 * Filtres du catalogue (ADR 0004, décision 3) : l'état complet d'une planche filtrée, sa lecture et son
 * écriture dans les paramètres d'URL, le filtrage et les compteurs de facettes. Fonctions pures : le
 * routeur, l'index et l'interface sont ailleurs.
 *
 * Paramètres d'URL (maquette catalogue.js) : `c` (catégorie, segment d'URL : composants, blocs…), `type`
 * et `secteur` (listes séparées par des virgules), `q`, `tri=az`, `reglables=1`, `animees=1`.
 */

export type TriCatalogue = 'recent' | 'az';

export interface FiltresCatalogue {
  readonly categorie: Categorie | null;
  readonly types: readonly TypeRessource[];
  readonly secteurs: readonly Secteur[];
  readonly q: string;
  readonly tri: TriCatalogue;
  /** Seulement les ressources qui suivent le contrat de tokens (`contratTokens` non nul). */
  readonly reglables: boolean;
  readonly animees: boolean;
}

export const FILTRES_VIDES: FiltresCatalogue = {
  categorie: null,
  types: [],
  secteurs: [],
  q: '',
  tri: 'recent',
  reglables: false,
  animees: false,
};

/**
 * Axes imposés par le chemin de la page (/blocs, /blocs/navbar, /secteurs/restaurant) : ils sont déjà
 * prérendus et indexés, donc jamais écrits dans les paramètres d'URL ni proposés comme filtres.
 */
export interface Portee {
  readonly categorie?: Categorie;
  readonly type?: TypeRessource;
  readonly secteur?: Secteur;
}

/** Ce qui sait donner la valeur d'un paramètre : `ParamMap` du routeur ou `URLSearchParams`. */
export interface LectureParametres {
  get(nom: string): string | null;
}

export type ParametresFiltres = Readonly<Record<string, string | null>>;

export const PARAMETRES = {
  categorie: 'c',
  types: 'type',
  secteurs: 'secteur',
  q: 'q',
  tri: 'tri',
  reglables: 'reglables',
  animees: 'animees',
} as const;

const VRAI = '1';
const SEPARATEUR = ',';

/** Axe qu'un compteur de facette laisse de côté : un compteur ignore son propre filtre. */
export type AxeFiltre = 'categorie' | 'type' | 'secteur' | 'reglables' | 'animees';

export function categorieDuType(type: TypeRessource): Categorie | undefined {
  return CATEGORIES_TYPEES.find((c) =>
    (TYPES_PAR_CATEGORIE[c] as readonly string[]).includes(type),
  );
}

/** Types proposés quand une catégorie est choisie, sinon tous (un design n'a pas de type). */
export function typesProposes(categorie: Categorie | null): readonly TypeRessource[] {
  if (categorie === 'design') return [];
  if (categorie !== null) return TYPES_PAR_CATEGORIE[categorie];
  return CATEGORIES_TYPEES.flatMap((c) => TYPES_PAR_CATEGORIE[c]);
}

/** Valeurs d'une liste `a,b` qui sont valides, dans l'ordre de l'URL et sans doublon. */
function lireListe<T extends string>(brut: string | null, valides: readonly T[]): T[] {
  const valeurs = new Set((brut ?? '').split(SEPARATEUR));
  return [...valeurs].flatMap((valeur) => valides.find((v) => v === valeur) ?? []);
}

function categorieImposee(portee: Portee): Categorie | undefined {
  return portee.type ? categorieDuType(portee.type) : portee.categorie;
}

/** Impose les axes de la page : leurs valeurs écrasent celles de l'URL, qui ne peut pas les contredire. */
export function appliquerPortee(filtres: FiltresCatalogue, portee: Portee): FiltresCatalogue {
  let resultat = filtres;
  const categorie = categorieImposee(portee);
  if (categorie !== undefined) resultat = { ...resultat, categorie };
  if (portee.type) resultat = { ...resultat, types: [portee.type] };
  if (portee.secteur) resultat = { ...resultat, secteurs: [portee.secteur] };
  return resultat;
}

/**
 * Filtres décrits par une URL. Tout ce qui est inconnu ou mal formé est ignoré (une URL écrite à la main
 * ne casse jamais la page) ; les types qui n'appartiennent pas à la catégorie choisie sont écartés.
 */
export function lireFiltres(parametres: LectureParametres, portee: Portee = {}): FiltresCatalogue {
  const dansUrl = categorieDepuisSegment(parametres.get(PARAMETRES.categorie) ?? undefined);
  const categorie = categorieImposee(portee) ?? dansUrl ?? null;
  const filtres: FiltresCatalogue = {
    categorie,
    types: lireListe(parametres.get(PARAMETRES.types), typesProposes(categorie)),
    secteurs: lireListe(parametres.get(PARAMETRES.secteurs), SECTEURS),
    q: parametres.get(PARAMETRES.q)?.trim() ?? '',
    tri: parametres.get(PARAMETRES.tri) === 'az' ? 'az' : 'recent',
    reglables: parametres.get(PARAMETRES.reglables) === VRAI,
    animees: parametres.get(PARAMETRES.animees) === VRAI,
  };
  return appliquerPortee(filtres, portee);
}

function listeOuNull(valeurs: readonly string[]): string | null {
  return valeurs.length > 0 ? valeurs.join(SEPARATEUR) : null;
}

/**
 * Paramètres d'URL des filtres : une clé par paramètre, `null` quand il est à sa valeur par défaut ou
 * imposé par la page (le routeur retire alors le paramètre).
 */
export function versParametres(filtres: FiltresCatalogue, portee: Portee = {}): ParametresFiltres {
  const categorieLibre = !portee.categorie && !portee.type;
  return {
    [PARAMETRES.categorie]:
      categorieLibre && filtres.categorie ? SEGMENT_CATEGORIE[filtres.categorie] : null,
    [PARAMETRES.types]: portee.type ? null : listeOuNull(filtres.types),
    [PARAMETRES.secteurs]: portee.secteur ? null : listeOuNull(filtres.secteurs),
    [PARAMETRES.q]: filtres.q === '' ? null : filtres.q,
    [PARAMETRES.tri]: filtres.tri === 'az' ? 'az' : null,
    [PARAMETRES.reglables]: filtres.reglables ? VRAI : null,
    [PARAMETRES.animees]: filtres.animees ? VRAI : null,
  };
}

/** Vrai quand l'URL porte au moins un paramètre : elle n'est alors ni prérendue ni indexée. */
export function aDesParametres(filtres: FiltresCatalogue, portee: Portee = {}): boolean {
  return Object.values(versParametres(filtres, portee)).some((v) => v !== null);
}

/** Un filtre actif et retirable : une puce de la barre « Filtres actifs ». */
export type FiltreActif =
  | { readonly axe: 'categorie'; readonly valeur: Categorie }
  | { readonly axe: 'type'; readonly valeur: TypeRessource }
  | { readonly axe: 'secteur'; readonly valeur: Secteur }
  | { readonly axe: 'reglables' | 'animees' | 'q' };

export function filtresActifs(filtres: FiltresCatalogue, portee: Portee = {}): FiltreActif[] {
  const actifs: FiltreActif[] = [];
  if (filtres.categorie && !portee.categorie && !portee.type) {
    actifs.push({ axe: 'categorie', valeur: filtres.categorie });
  }
  if (!portee.type)
    actifs.push(...filtres.types.map((valeur) => ({ axe: 'type' as const, valeur })));
  if (!portee.secteur) {
    actifs.push(...filtres.secteurs.map((valeur) => ({ axe: 'secteur' as const, valeur })));
  }
  if (filtres.reglables) actifs.push({ axe: 'reglables' });
  if (filtres.animees) actifs.push({ axe: 'animees' });
  if (filtres.q !== '') actifs.push({ axe: 'q' });
  return actifs;
}

/** Choisit une catégorie (ou « tout » avec null) : les types qui n'en font pas partie sont retirés. */
export function avecCategorie(
  filtres: FiltresCatalogue,
  categorie: Categorie | null,
): FiltresCatalogue {
  const valides = typesProposes(categorie);
  return { ...filtres, categorie, types: filtres.types.filter((t) => valides.includes(t)) };
}

function basculer<T>(valeurs: readonly T[], valeur: T, coche: boolean): T[] {
  const sans = valeurs.filter((v) => v !== valeur);
  return coche ? [...sans, valeur] : sans;
}

export function avecType(
  filtres: FiltresCatalogue,
  type: TypeRessource,
  coche: boolean,
): FiltresCatalogue {
  return { ...filtres, types: basculer(filtres.types, type, coche) };
}

export function avecSecteur(
  filtres: FiltresCatalogue,
  secteur: Secteur,
  coche: boolean,
): FiltresCatalogue {
  return { ...filtres, secteurs: basculer(filtres.secteurs, secteur, coche) };
}

/** Retire un filtre actif. Les axes imposés par la page ne sont pas retirables (ils n'ont pas de puce). */
export function sansFiltre(filtres: FiltresCatalogue, actif: FiltreActif): FiltresCatalogue {
  switch (actif.axe) {
    case 'categorie':
      return avecCategorie(filtres, null);
    case 'type':
      return { ...filtres, types: filtres.types.filter((t) => t !== actif.valeur) };
    case 'secteur':
      return { ...filtres, secteurs: filtres.secteurs.filter((s) => s !== actif.valeur) };
    case 'reglables':
      return { ...filtres, reglables: false };
    case 'animees':
      return { ...filtres, animees: false };
    case 'q':
      return { ...filtres, q: '' };
  }
}

/** Tout effacer, sauf le tri (qui n'est pas un filtre) et les axes imposés par la page. */
export function sansFiltres(filtres: FiltresCatalogue, portee: Portee = {}): FiltresCatalogue {
  return appliquerPortee({ ...FILTRES_VIDES, tri: filtres.tri }, portee);
}

/** Une ressource passe-t-elle les filtres ? `sauf` laisse un axe de côté (compteurs de facettes). */
export function correspond(
  entree: EntreeIndex,
  filtres: FiltresCatalogue,
  sauf?: AxeFiltre,
): boolean {
  const { categorie, types, secteurs } = filtres;
  if (sauf !== 'categorie' && categorie !== null && entree.categorie !== categorie) return false;
  if (sauf !== 'type' && types.length > 0 && !types.some((t) => t === entree.type)) return false;
  if (sauf !== 'secteur' && secteurs.length > 0) {
    if (!entree.secteurs.some((s) => secteurs.includes(s))) return false;
  }
  if (sauf !== 'reglables' && filtres.reglables && entree.contratTokens === null) return false;
  return sauf === 'animees' || !filtres.animees || entree.animee;
}

/**
 * Trie une copie : « récentes » par date d'ajout décroissante (à date égale, l'ordre de l'index est
 * gardé, le tri étant stable), « A à Z » par titre.
 */
export function trier(entrees: readonly EntreeIndex[], tri: TriCatalogue): EntreeIndex[] {
  const copie = [...entrees];
  if (tri === 'az') return copie.sort((a, b) => a.titre.fr.localeCompare(b.titre.fr, 'fr'));
  return copie.sort((a, b) => b.ajouteLe.localeCompare(a.ajouteLe));
}

/** Les ressources de `base` (déjà filtrée par la recherche) qui passent les filtres, triées. */
export function filtrer(base: readonly EntreeIndex[], filtres: FiltresCatalogue): EntreeIndex[] {
  return trier(
    base.filter((e) => correspond(e, filtres)),
    filtres.tri,
  );
}

/** Nombre de ressources par valeur de chaque facette. Les valeurs absentes valent zéro. */
export interface Facettes {
  readonly total: number;
  readonly categories: Readonly<Partial<Record<Categorie, number>>>;
  readonly types: Readonly<Partial<Record<TypeRessource, number>>>;
  readonly secteurs: Readonly<Partial<Record<Secteur, number>>>;
  readonly options: { readonly reglables: number; readonly animees: number };
}

function incrementer<K extends string>(table: Partial<Record<K, number>>, cle: K): void {
  table[cle] = (table[cle] ?? 0) + 1;
}

/**
 * Compteurs des facettes : chaque facette compte les ressources qui passent tous les autres filtres,
 * donc cocher une valeur ne vide pas ses voisines. `base` est le résultat de la recherche.
 */
export function compterFacettes(base: readonly EntreeIndex[], filtres: FiltresCatalogue): Facettes {
  const categories: Partial<Record<Categorie, number>> = {};
  const types: Partial<Record<TypeRessource, number>> = {};
  const secteurs: Partial<Record<Secteur, number>> = {};
  const options = { reglables: 0, animees: 0 };
  for (const entree of base) {
    if (correspond(entree, filtres, 'categorie')) incrementer(categories, entree.categorie);
    if (entree.type !== null && correspond(entree, filtres, 'type')) {
      incrementer(types, entree.type);
    }
    if (correspond(entree, filtres, 'secteur')) {
      for (const secteur of entree.secteurs) incrementer(secteurs, secteur);
    }
    if (entree.contratTokens !== null && correspond(entree, filtres, 'reglables')) {
      options.reglables += 1;
    }
    if (entree.animee && correspond(entree, filtres, 'animees')) options.animees += 1;
  }
  const total = CATEGORIES.reduce((somme, c) => somme + (categories[c] ?? 0), 0);
  return { total, categories, types, secteurs, options };
}

/** Compteurs globaux (compteurs.json), pour les facettes tant que l'index n'est pas chargé. */
export function facettesDepuisCompteurs(compteurs: Compteurs): Facettes {
  return {
    total: compteurs.total,
    categories: compteurs.categories,
    types: compteurs.types,
    secteurs: compteurs.secteurs,
    options: compteurs.options,
  };
}
