import type { FichiersRessource } from './sources.ts';
import { lireDonneesFiche } from './valider-sources.ts';

/**
 * Contrôle du champ `parametres` d'un meta.json (ADR 0014) : chaque paramètre réglable est un input du
 * composant, documenté dans le tableau « Paramètres » de fiche.json. La définition sert de liste blanche
 * à l'aperçu : elle doit donc être complète et sans ambiguïté. Fonction pure, comme valider.ts.
 */

const MAX_PARAMETRES = 8;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;
const MAX_UNITE = 8;
const MOTIF_NOM = /^[a-z][a-zA-Z0-9]{0,31}$/;
const MOTIF_OPTION = /^[a-z0-9][a-z0-9-]{0,39}$/;
const GENRES = ['choix', 'nombre', 'interrupteur'];
const CLES_BASE = ['nom', 'libelle', 'genre', 'defaut'];
const CLES_PAR_GENRE: Readonly<Record<string, readonly string[]>> = {
  choix: [...CLES_BASE, 'options'],
  nombre: [...CLES_BASE, 'min', 'max', 'pas', 'unite'],
  interrupteur: CLES_BASE,
};

type Objet = Readonly<Record<string, unknown>>;

function estObjet(valeur: unknown): valeur is Objet {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

function estTexteFrancais(valeur: unknown): boolean {
  return estObjet(valeur) && typeof valeur['fr'] === 'string' && valeur['fr'].trim() !== '';
}

function estNombre(valeur: unknown): valeur is number {
  return typeof valeur === 'number' && Number.isFinite(valeur);
}

function validerChoix(p: Objet, nom: string): readonly string[] {
  const options = p['options'];
  if (!Array.isArray(options) || options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    return [`« ${nom} » : ${MIN_OPTIONS} à ${MAX_OPTIONS} options attendues`];
  }
  const erreurs: string[] = [];
  const valeurs: unknown[] = [];
  for (const option of options) {
    const bien =
      estObjet(option) &&
      Object.keys(option).length === 2 &&
      typeof option['valeur'] === 'string' &&
      MOTIF_OPTION.test(option['valeur']) &&
      estTexteFrancais(option['libelle']);
    if (bien) valeurs.push(option['valeur']);
    else erreurs.push(`« ${nom} » : option mal formée (valeur kebab-case et libelle.fr)`);
  }
  if (new Set(valeurs).size !== valeurs.length) erreurs.push(`« ${nom} » : option en double`);
  if (!valeurs.includes(p['defaut'])) erreurs.push(`« ${nom} » : défaut hors des options`);
  return erreurs;
}

function validerNombre(p: Objet, nom: string): readonly string[] {
  const { min, max, pas, defaut, unite } = p;
  if (!estNombre(min) || !estNombre(max) || !estNombre(pas) || !estNombre(defaut)) {
    return [`« ${nom} » : min, max, pas et defaut doivent être des nombres`];
  }
  const erreurs: string[] = [];
  if (min >= max) erreurs.push(`« ${nom} » : min doit être inférieur à max`);
  if (pas <= 0) erreurs.push(`« ${nom} » : pas doit être positif`);
  if (defaut < min || defaut > max) erreurs.push(`« ${nom} » : défaut hors des bornes`);
  if (unite !== undefined && (typeof unite !== 'string' || unite.length > MAX_UNITE)) {
    erreurs.push(`« ${nom} » : unité de ${MAX_UNITE} caractères au plus`);
  }
  return erreurs;
}

function validerUn(valeur: unknown, indice: number): readonly string[] {
  if (!estObjet(valeur)) return [`parametres[${indice}] doit être un objet`];
  const nom = typeof valeur['nom'] === 'string' ? valeur['nom'] : `parametres[${indice}]`;
  const genre = valeur['genre'];
  if (typeof genre !== 'string' || !GENRES.includes(genre)) {
    return [`« ${nom} » : genre à choisir parmi ${GENRES.join(', ')}`];
  }
  const erreurs: string[] = [];
  const autorisees = CLES_PAR_GENRE[genre] ?? [];
  for (const cle of Object.keys(valeur)) {
    if (!autorisees.includes(cle)) erreurs.push(`« ${nom} » : champ inconnu « ${cle} »`);
  }
  if (typeof valeur['nom'] !== 'string' || !MOTIF_NOM.test(valeur['nom'])) {
    erreurs.push(`« ${nom} » : nom d'input en camelCase, 32 caractères au plus`);
  }
  if (!estTexteFrancais(valeur['libelle'])) erreurs.push(`« ${nom} » : libelle.fr obligatoire`);
  if (genre === 'choix') erreurs.push(...validerChoix(valeur, nom));
  if (genre === 'nombre') erreurs.push(...validerNombre(valeur, nom));
  if (genre === 'interrupteur' && typeof valeur['defaut'] !== 'boolean') {
    erreurs.push(`« ${nom} » : defaut doit être un booléen`);
  }
  return erreurs;
}

/** Noms d'inputs documentés dans fiche.json (une ligne peut en grouper plusieurs : « min / max / pas »). */
function nomsDocumentes(fichiers: FichiersRessource | undefined): ReadonlySet<string> {
  const lue = lireDonneesFiche(fichiers?.['fiche.json'] ?? '');
  if (typeof lue === 'string') return new Set();
  return new Set(lue.api.flatMap((ligne) => ligne.nom.split('/').map((n) => n.trim())));
}

/** Erreurs de `parametres` (absent = aucune : la ressource n'a que les 12 tokens à régler). */
export function validerParametres(
  parametres: unknown,
  fichiers: FichiersRessource | undefined,
): readonly string[] {
  if (parametres === undefined) return [];
  if (!Array.isArray(parametres) || parametres.length === 0 || parametres.length > MAX_PARAMETRES) {
    return [`« parametres » doit lister 1 à ${MAX_PARAMETRES} paramètres (ou être absent)`];
  }
  const erreurs = parametres.flatMap(validerUn);
  const noms = parametres.flatMap((p: unknown) =>
    estObjet(p) && typeof p['nom'] === 'string' ? [p['nom']] : [],
  );
  if (new Set(noms).size !== noms.length) erreurs.push('« parametres » : nom en double');
  const documentes = nomsDocumentes(fichiers);
  for (const nom of noms.filter((n) => !documentes.has(n))) {
    erreurs.push(`« ${nom} » absent du tableau « Paramètres » de fiche.json`);
  }
  return erreurs;
}
