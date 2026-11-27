import type { MetaDesign, MetaRessource } from '../../src/app/shared/models/ressource.model.ts';
import {
  CATEGORIES,
  SECTEURS,
  SEGMENT_CATEGORIE,
  TAILLES_CASE,
  TYPES_PAR_CATEGORIE,
} from '../../src/app/shared/models/taxonomie.model.ts';

/**
 * Validation du registre (ADR 0004, « Conséquences ») : tout ce qui est refusé ici fait échouer le build,
 * c'est ce qui empêche le catalogue de se fragmenter. Fonctions pures : la lecture des fichiers est ailleurs.
 */

export type MetaRegistre = MetaRessource | MetaDesign;

/** Un meta.json lu, avec son emplacement `<segment>/<dossier>` pour les messages d'erreur. */
export interface EntreeBrute {
  readonly chemin: string;
  readonly meta: unknown;
}

export interface ResultatValidation {
  readonly metas: readonly MetaRegistre[];
  readonly erreurs: readonly string[];
}

const MAX_SECTEURS = 3;
const MAX_TAGS = 8;
const MAX_DESCRIPTION = 160;
const STATUTS = ['provisoire', 'publie', 'deprecie'];
const VARIANTES = ['tailwind', 'css'];
const TOKENS_CONTRAT = [
  '--ngs-color-action',
  '--ngs-color-on-action',
  '--ngs-color-surface',
  '--ngs-color-surface-alt',
  '--ngs-color-text',
  '--ngs-color-text-muted',
  '--ngs-color-border',
  '--ngs-color-danger',
  '--ngs-radius',
  '--ngs-density',
  '--ngs-font-family',
  '--ngs-duration',
];

const MOTIF_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MOTIF_TAG = /^[a-z0-9à-ÿ]+(-[a-z0-9à-ÿ]+)*$/;
const MOTIF_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MOTIF_VERSION = /^\d+\.\d+$/;

const CLES_COMMUNES = [
  'schema',
  'slug',
  'categorie',
  'titre',
  'description',
  'secteurs',
  'tags',
  'contratTokens',
  'licence',
  'statut',
  'ajouteLe',
];
const CLES_RESSOURCE = [
  ...CLES_COMMUNES,
  'type',
  'variantes',
  'angularMin',
  'auteur',
  'dependances',
  'designsMisEnAvant',
  'animee',
  'tailleCase',
  'modifieLe',
  'anciensChemins',
];
const CLES_DESIGN = [...CLES_COMMUNES, 'valeurs'];

type Objet = Readonly<Record<string, unknown>>;

function estObjet(valeur: unknown): valeur is Objet {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

function estChaine(valeur: unknown): valeur is string {
  return typeof valeur === 'string';
}

function estListeDeChaines(valeur: unknown): valeur is readonly string[] {
  return Array.isArray(valeur) && valeur.every(estChaine);
}

function inclus(liste: readonly string[], valeur: unknown): boolean {
  return estChaine(valeur) && liste.includes(valeur);
}

/** Collecte les erreurs d'une entrée en les préfixant de son chemin. */
class Rapport {
  readonly erreurs: string[] = [];
  readonly #chemin: string;

  constructor(chemin: string) {
    this.#chemin = chemin;
  }

  signaler(message: string): void {
    this.erreurs.push(`${this.#chemin} : ${message}`);
  }
}

function validerCles(meta: Objet, autorisees: readonly string[], rapport: Rapport): void {
  for (const cle of Object.keys(meta)) {
    if (!autorisees.includes(cle)) rapport.signaler(`champ inconnu « ${cle} »`);
  }
}

function validerTexte(valeur: unknown, nom: string, rapport: Rapport, max?: number): void {
  if (!estObjet(valeur) || !estChaine(valeur['fr']) || valeur['fr'].trim() === '') {
    rapport.signaler(`« ${nom} » doit être { "fr": "…" } avec un texte français non vide`);
    return;
  }
  if (valeur['en'] !== undefined && !estChaine(valeur['en'])) {
    rapport.signaler(`« ${nom}.en » doit être un texte`);
  }
  if (max !== undefined && valeur['fr'].length > max) {
    rapport.signaler(`« ${nom}.fr » dépasse ${max} caractères (${valeur['fr'].length})`);
  }
}

interface RegleListe {
  readonly nom: string;
  readonly max: number;
  readonly valide: (element: string) => boolean;
}

function validerListe(valeur: unknown, regle: RegleListe, rapport: Rapport): void {
  const { nom, max, valide } = regle;
  if (!estListeDeChaines(valeur)) {
    rapport.signaler(`« ${nom} » doit être une liste de textes`);
    return;
  }
  if (valeur.length > max) rapport.signaler(`« ${nom} » : ${max} éléments au plus`);
  if (new Set(valeur).size !== valeur.length) rapport.signaler(`« ${nom} » : doublon`);
  for (const element of valeur) {
    if (!valide(element)) {
      rapport.signaler(`« ${nom} » : valeur inconnue ou mal formée « ${element} »`);
    }
  }
}

function validerDate(valeur: unknown, nom: string, rapport: Rapport): void {
  if (!estChaine(valeur) || !MOTIF_DATE.test(valeur) || Number.isNaN(Date.parse(valeur))) {
    rapport.signaler(`« ${nom} » doit être une date AAAA-MM-JJ`);
  }
}

function validerCommun(meta: Objet, rapport: Rapport): void {
  if (meta['schema'] !== 1) rapport.signaler('« schema » doit valoir 1');
  if (!estChaine(meta['slug']) || !MOTIF_SLUG.test(meta['slug'])) {
    rapport.signaler('« slug » doit être en kebab-case (minuscules, chiffres, tirets)');
  }
  validerTexte(meta['titre'], 'titre', rapport);
  validerTexte(meta['description'], 'description', rapport, MAX_DESCRIPTION);
  validerListe(
    meta['secteurs'],
    { nom: 'secteurs', max: MAX_SECTEURS, valide: (s) => SECTEURS.some((x) => x === s) },
    rapport,
  );
  validerListe(
    meta['tags'],
    { nom: 'tags', max: MAX_TAGS, valide: (t) => MOTIF_TAG.test(t) },
    rapport,
  );
  if (meta['licence'] !== 'MIT') rapport.signaler('« licence » doit valoir « MIT »');
  if (!inclus(STATUTS, meta['statut'])) {
    rapport.signaler(`« statut » doit être l'un de : ${STATUTS.join(', ')}`);
  }
  validerDate(meta['ajouteLe'], 'ajouteLe', rapport);
}

function validerType(meta: Objet, rapport: Rapport): void {
  const categorie = meta['categorie'];
  const type = meta['type'];
  if (categorie !== 'composant' && categorie !== 'bloc' && categorie !== 'template') return;
  if (!estChaine(type)) {
    rapport.signaler('« type » est obligatoire');
  } else if (!TYPES_PAR_CATEGORIE[categorie].some((t) => t === type)) {
    rapport.signaler(`type « ${type} » inconnu dans la catégorie « ${categorie} »`);
  }
}

function validerOptionsPlanche(meta: Objet, rapport: Rapport): void {
  if (meta['animee'] !== undefined && typeof meta['animee'] !== 'boolean') {
    rapport.signaler('« animee » doit valoir true ou false');
  }
  if (meta['tailleCase'] !== undefined && !inclus(TAILLES_CASE, meta['tailleCase'])) {
    rapport.signaler(`« tailleCase » doit être l'une de : ${TAILLES_CASE.join(', ')}`);
  }
}

function validerDependances(valeur: unknown, rapport: Rapport): void {
  const vide =
    estObjet(valeur) &&
    Array.isArray(valeur['npm']) &&
    valeur['npm'].length === 0 &&
    Array.isArray(valeur['ressources']) &&
    valeur['ressources'].length === 0;
  if (!vide) {
    rapport.signaler(
      '« dependances » doit valoir { "npm": [], "ressources": [] } en v1 (ADR 0004)',
    );
  }
}

function validerRessource(meta: Objet, rapport: Rapport): void {
  validerCles(meta, CLES_RESSOURCE, rapport);
  validerType(meta, rapport);
  validerOptionsPlanche(meta, rapport);
  if (meta['contratTokens'] !== 1 && meta['contratTokens'] !== null) {
    rapport.signaler('« contratTokens » doit valoir 1 ou null');
  }
  const variantes = meta['variantes'];
  if (!estListeDeChaines(variantes) || !VARIANTES.every((v) => variantes.includes(v))) {
    rapport.signaler('« variantes » doit contenir « tailwind » et « css » en v1 (ADR 0002)');
  }
  if (!estChaine(meta['angularMin']) || !MOTIF_VERSION.test(meta['angularMin'])) {
    rapport.signaler('« angularMin » doit ressembler à « 22.0 »');
  }
  if (!estObjet(meta['auteur']) || !estChaine(meta['auteur']['nom'])) {
    rapport.signaler('« auteur.nom » est obligatoire');
  }
  if (meta['modifieLe'] !== undefined) validerDate(meta['modifieLe'], 'modifieLe', rapport);
  validerDependances(meta['dependances'], rapport);
}

function validerJeuDeValeurs(
  valeurs: unknown,
  nom: string,
  complet: boolean,
  rapport: Rapport,
): void {
  if (!estObjet(valeurs)) {
    rapport.signaler(`« valeurs.${nom} » est obligatoire`);
    return;
  }
  for (const cle of Object.keys(valeurs)) {
    if (!TOKENS_CONTRAT.includes(cle))
      rapport.signaler(`« valeurs.${nom} » : token inconnu « ${cle} »`);
    else if (!estChaine(valeurs[cle]))
      rapport.signaler(`« valeurs.${nom}.${cle} » doit être un texte`);
  }
  const manquants = complet ? TOKENS_CONTRAT.filter((token) => !(token in valeurs)) : [];
  if (manquants.length > 0) {
    rapport.signaler(`« valeurs.${nom} » : tokens manquants ${manquants.join(', ')}`);
  }
}

function validerDesign(meta: Objet, rapport: Rapport): void {
  validerCles(meta, CLES_DESIGN, rapport);
  if (meta['contratTokens'] !== 1) rapport.signaler('« contratTokens » doit valoir 1');
  if (!estObjet(meta['valeurs'])) {
    rapport.signaler('« valeurs » est obligatoire');
    return;
  }
  validerJeuDeValeurs(meta['valeurs']['clair'], 'clair', true, rapport);
  if (meta['valeurs']['sombre'] !== undefined) {
    validerJeuDeValeurs(meta['valeurs']['sombre'], 'sombre', false, rapport);
  }
}

/** Dossier attendu : `<segment de la catégorie>/<slug>` (ex. blocs/navbar-restaurant). */
function validerEmplacement(meta: Objet, chemin: string, rapport: Rapport): void {
  const categorie = CATEGORIES.find((c) => c === meta['categorie']);
  if (categorie === undefined) return;
  const attendu = `${SEGMENT_CATEGORIE[categorie]}/${String(meta['slug'])}`;
  if (chemin !== attendu) rapport.signaler(`le dossier doit s'appeler « ${attendu} »`);
}

function validerEntree(entree: EntreeBrute): readonly string[] {
  const rapport = new Rapport(entree.chemin);
  const meta = entree.meta;
  if (!estObjet(meta)) {
    rapport.signaler('le fichier doit contenir un objet JSON');
    return rapport.erreurs;
  }
  if (!inclus(CATEGORIES, meta['categorie'])) {
    rapport.signaler(`« categorie » doit être l'une de : ${CATEGORIES.join(', ')}`);
    return rapport.erreurs;
  }
  validerCommun(meta, rapport);
  if (meta['categorie'] === 'design') validerDesign(meta, rapport);
  else validerRessource(meta, rapport);
  validerEmplacement(meta, entree.chemin, rapport);
  return rapport.erreurs;
}

/** Slug unique dans tout le registre, et designs mis en avant qui existent. */
function validerCoherence(entrees: readonly EntreeBrute[]): readonly string[] {
  const erreurs: string[] = [];
  const vus = new Map<string, string>();
  const designs = new Set<string>();
  for (const { chemin, meta } of entrees) {
    if (!estObjet(meta) || !estChaine(meta['slug'])) continue;
    const autre = vus.get(meta['slug']);
    if (autre !== undefined)
      erreurs.push(`${chemin} : slug « ${meta['slug']} » déjà utilisé par ${autre}`);
    vus.set(meta['slug'], chemin);
    if (meta['categorie'] === 'design') designs.add(meta['slug']);
  }
  for (const { chemin, meta } of entrees) {
    const mis = estObjet(meta) ? meta['designsMisEnAvant'] : undefined;
    if (!estListeDeChaines(mis)) continue;
    for (const slug of mis.filter((s) => !designs.has(s))) {
      erreurs.push(`${chemin} : design mis en avant « ${slug} » introuvable`);
    }
  }
  return erreurs;
}

export function validerRegistre(entrees: readonly EntreeBrute[]): ResultatValidation {
  const erreurs = [...entrees.flatMap(validerEntree), ...validerCoherence(entrees)];
  if (erreurs.length > 0) return { metas: [], erreurs };
  // Les contrôles ci-dessus garantissent la forme : c'est la seule conversion de `unknown` du script.
  return { metas: entrees.map((e) => e.meta as MetaRegistre), erreurs };
}
