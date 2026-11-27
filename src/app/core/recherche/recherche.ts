import { LIBELLES_CATEGORIE, LIBELLES_SECTEUR, LIBELLES_TYPE } from '@core/i18n/textes.fr';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { CATEGORIES, Categorie } from '@shared/models/taxonomie.model';

/**
 * Recherche locale sur l'index du catalogue (ADR 0004) : correspondance normalisée (casse, accents,
 * tirets) sur titre, description, tags, catégorie, type et secteurs, sans bibliothèque.
 * Fonctions pures : l'interface (dialogue) est ailleurs.
 */

/** Nombre de résultats montrés par catégorie ; le reste est atteint par le lien « Voir tout ». */
export const MAX_PAR_GROUPE = 6;

const BASE_POINTS_TITRE = 2;
const BONUS_DEBUT_TITRE = 1;

/** Minuscules, sans accents, tirets et apostrophes en espaces. Garde la longueur du texte d'origine. */
function plier(valeur: string): string {
  return valeur
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[-_'’]/g, ' ');
}

/** Forme de comparaison : pliée, espaces réduits, sans espace en bordure. */
export function normaliser(valeur: string): string {
  return plier(valeur).replace(/\s+/g, ' ').trim();
}

function mots(requete: string): string[] {
  const normalisee = normaliser(requete);
  return normalisee === '' ? [] : normalisee.split(' ');
}

/** Une ressource et ses formes de recherche, calculées une fois à la construction de l'index. */
export interface EntreeRecherche {
  readonly entree: EntreeIndex;
  readonly titre: string;
  readonly texte: string;
}

export type IndexRecherche = readonly EntreeRecherche[];

function versEntreeRecherche(entree: EntreeIndex): EntreeRecherche {
  const libelles = [
    LIBELLES_CATEGORIE[entree.categorie].pluriel,
    LIBELLES_CATEGORIE[entree.categorie].singulier,
    entree.type ? LIBELLES_TYPE[entree.type] : '',
    ...entree.secteurs.map((s) => LIBELLES_SECTEUR[s]),
  ];
  const texte = [entree.titre.fr, entree.description.fr, ...entree.tags, ...libelles].join(' ');
  return { entree, titre: normaliser(entree.titre.fr), texte: normaliser(texte) };
}

export function construireIndexRecherche(entrees: readonly EntreeIndex[]): IndexRecherche {
  return entrees.map(versEntreeRecherche);
}

export interface GroupeResultats {
  readonly categorie: Categorie;
  /** Résultats montrés (au plus MAX_PAR_GROUPE). */
  readonly entrees: readonly EntreeIndex[];
  /** Nombre total de correspondances de la catégorie. */
  readonly total: number;
}

export interface Resultats {
  readonly groupes: readonly GroupeResultats[];
  /** Nombre total de correspondances, toutes catégories. */
  readonly total: number;
}

/** Plus un mot de la requête est dans le titre, et au début, plus la ressource remonte. */
function score(cible: EntreeRecherche, motsRequete: readonly string[]): number {
  const dansTitre = motsRequete.filter((mot) => cible.titre.includes(mot)).length;
  const debut = motsRequete.length > 0 && cible.titre.startsWith(motsRequete[0]);
  return dansTitre * BASE_POINTS_TITRE + (debut ? BONUS_DEBUT_TITRE : 0);
}

interface Correspondance {
  readonly cible: EntreeRecherche;
  readonly rang: number;
  readonly points: number;
}

/** Les ressources dont le texte contient chaque mot de la requête, les mieux classées d'abord. */
function classer(index: IndexRecherche, requete: string): readonly Correspondance[] {
  const motsRequete = mots(requete);
  return index
    .filter((cible) => motsRequete.every((mot) => cible.texte.includes(mot)))
    .map((cible, rang) => ({ cible, rang, points: score(cible, motsRequete) }))
    .sort((a, b) => b.points - a.points || a.rang - b.rang);
}

/**
 * Les ressources qui correspondent à la requête, dans l'ordre de leur pertinence ; toutes si elle est vide.
 * Sert aux filtres du catalogue, qui n'ont pas la limite par groupe de la recherche globale.
 */
export function filtrerParRequete(index: IndexRecherche, requete: string): readonly EntreeIndex[] {
  return classer(index, requete).map((c) => c.cible.entree);
}

/**
 * Toutes les ressources dont le texte contient chaque mot de la requête, groupées par catégorie
 * (dans l'ordre du catalogue), les mieux classées d'abord. Une requête vide les renvoie toutes.
 */
export function chercher(index: IndexRecherche, requete: string): Resultats {
  const correspondances = classer(index, requete);
  const groupes = CATEGORIES.flatMap((categorie) => {
    const dansGroupe = correspondances.filter((c) => c.cible.entree.categorie === categorie);
    return dansGroupe.length === 0
      ? []
      : [
          {
            categorie,
            entrees: dansGroupe.slice(0, MAX_PAR_GROUPE).map((c) => c.cible.entree),
            total: dansGroupe.length,
          },
        ];
  });
  return { groupes, total: correspondances.length };
}

export interface Segment {
  readonly texte: string;
  readonly surligne: boolean;
}

/** Plages [début, fin[ des mots de la requête dans un texte plié, fusionnées quand elles se touchent. */
function plages(plie: string, motsRequete: readonly string[]): [number, number][] {
  const brutes = motsRequete
    .map((mot) => [plie.indexOf(mot), mot.length] as const)
    .filter(([debut]) => debut >= 0)
    .map(([debut, longueur]): [number, number] => [debut, debut + longueur])
    .sort((a, b) => a[0] - b[0]);
  const fusionnees: [number, number][] = [];
  for (const [debut, fin] of brutes) {
    const derniere = fusionnees.at(-1);
    if (derniere && debut <= derniere[1]) derniere[1] = Math.max(derniere[1], fin);
    else fusionnees.push([debut, fin]);
  }
  return fusionnees;
}

/**
 * Découpe un texte en segments, ceux qui correspondent à la requête étant à surligner. Rend des
 * segments plutôt que du HTML : rien n'est injecté dans la page.
 */
export function segmenter(texte: string, requete: string): Segment[] {
  const motsRequete = mots(requete);
  const plie = plier(texte);
  // La normalisation garde la longueur sauf cas exotiques : sinon on n'invente pas de surlignage.
  if (motsRequete.length === 0 || plie.length !== texte.length) return [{ texte, surligne: false }];
  const segments: Segment[] = [];
  let curseur = 0;
  for (const [debut, fin] of plages(plie, motsRequete)) {
    if (debut > curseur) segments.push({ texte: texte.slice(curseur, debut), surligne: false });
    segments.push({ texte: texte.slice(debut, fin), surligne: true });
    curseur = fin;
  }
  if (curseur < texte.length) segments.push({ texte: texte.slice(curseur), surligne: false });
  return segments.length > 0 ? segments : [{ texte, surligne: false }];
}
