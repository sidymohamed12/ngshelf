import type {
  ParametreReglable,
  ValeurParametre,
  ValeursParametres,
} from '../models/parametre.model';

/**
 * Paramètres propres d'une ressource (ADR 0014). Partagé par le site (valeurs de départ, envoi) et par
 * l'aperçu (réception) : la définition du meta.json est la liste blanche des deux côtés.
 *
 * Deux contrôles, dans cet ordre : `filtrerParametresBruts` à la lecture du message (forme seulement :
 * l'aperçu ne connaît pas encore la ressource), puis `resoudreParametres` qui ne garde que les noms, les
 * types et les valeurs que la définition de la ressource prévoit.
 */

const NOMBRE_MAX_PARAMETRES = 16;
const MOTIF_NOM = /^[a-z][a-zA-Z0-9]{0,31}$/;
const LONGUEUR_MAX_TEXTE = 40;

export type ParametresBruts = Readonly<Record<string, ValeurParametre>>;

function estObjet(valeur: unknown): valeur is Readonly<Record<string, unknown>> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

function valeurPlausible(valeur: unknown): valeur is ValeurParametre {
  if (typeof valeur === 'boolean') return true;
  if (typeof valeur === 'number') return Number.isFinite(valeur);
  return typeof valeur === 'string' && valeur.length <= LONGUEUR_MAX_TEXTE;
}

/** Forme du champ `params` d'un message : au plus 16 entrées, noms simples, valeurs scalaires courtes. */
export function filtrerParametresBruts(brut: unknown): ParametresBruts {
  if (!estObjet(brut)) return {};
  const filtres: Record<string, ValeurParametre> = {};
  for (const [nom, valeur] of Object.entries(brut).slice(0, NOMBRE_MAX_PARAMETRES)) {
    if (MOTIF_NOM.test(nom) && valeurPlausible(valeur)) filtres[nom] = valeur;
  }
  return filtres;
}

function borner(valeur: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valeur));
}

/** Aligne une valeur sur le pas du paramètre (depuis son minimum), évite les flottants parasites. */
function aligner(valeur: number, min: number, pas: number): number {
  if (pas <= 0) return valeur;
  const arrondi = min + Math.round((valeur - min) / pas) * pas;
  return Number(arrondi.toFixed(6));
}

function resoudreUn(definition: ParametreReglable, brut: unknown): ValeurParametre {
  if (definition.genre === 'interrupteur') {
    return typeof brut === 'boolean' ? brut : definition.defaut;
  }
  if (definition.genre === 'nombre') {
    if (typeof brut !== 'number' || !Number.isFinite(brut)) return definition.defaut;
    return borner(aligner(brut, definition.min, definition.pas), definition.min, definition.max);
  }
  const permis = definition.options.some((option) => option.valeur === brut);
  return typeof brut === 'string' && permis ? brut : definition.defaut;
}

/** Valeurs de départ : le défaut de chaque paramètre. */
export function parametresParDefaut(definitions: readonly ParametreReglable[]): ValeursParametres {
  return Object.fromEntries(definitions.map((d) => [d.nom, d.defaut]));
}

/**
 * Valeurs retenues : une par paramètre déclaré, jamais plus. Une valeur absente, d'un autre type, hors
 * liste ou hors bornes retombe sur le défaut (nombre : borné et aligné sur le pas).
 */
export function resoudreParametres(
  definitions: readonly ParametreReglable[],
  brut: unknown,
): ValeursParametres {
  const source = estObjet(brut) ? brut : {};
  return Object.fromEntries(definitions.map((d) => [d.nom, resoudreUn(d, source[d.nom])]));
}

/** Les mêmes valeurs lues dans les paramètres d'URL `p.<nom>=…` (texte brut : types reconstitués ici). */
export function parametresDepuisRecherche(
  definitions: readonly ParametreReglable[],
  recherche: string,
): ValeursParametres {
  const url = new URLSearchParams(recherche);
  const bruts: Record<string, unknown> = {};
  for (const definition of definitions) {
    const texte = url.get(`p.${definition.nom}`);
    if (texte === null) continue;
    if (definition.genre === 'nombre') bruts[definition.nom] = Number(texte);
    else if (definition.genre === 'interrupteur') bruts[definition.nom] = texte === '1';
    else bruts[definition.nom] = texte;
  }
  return resoudreParametres(definitions, bruts);
}

function enTexte(valeur: ValeurParametre): string {
  if (typeof valeur === 'boolean') return valeur ? '1' : '0';
  return String(valeur);
}

/** Ajoute à une URL les paramètres qui diffèrent du défaut (`p.<nom>`), pour la page d'aperçu autonome. */
export function parametresVersRecherche(
  definitions: readonly ParametreReglable[],
  valeurs: ValeursParametres,
  vers: URLSearchParams,
): void {
  for (const definition of definitions) {
    const valeur = valeurs[definition.nom];
    if (valeur === undefined || valeur === definition.defaut) continue;
    vers.set(`p.${definition.nom}`, enTexte(valeur));
  }
}
