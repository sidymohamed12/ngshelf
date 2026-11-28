import { TOKENS_CONTRAT, TokenContrat } from '../livraison/livraison';
import { ParametresBruts, filtrerParametresBruts } from './parametres';

/**
 * Protocole `postMessage` entre le site et l'aperçu isolé d'une ressource (ADR 0003 et 0010). Partagé
 * par les deux applications : un seul fichier, donc aucune dérive possible entre l'envoi et la lecture.
 *
 * L'aperçu est une iframe `sandbox="allow-scripts"` sans `allow-same-origin` : son origine est opaque
 * (`"null"`). Conséquences : l'envoi se fait avec `targetOrigin '*'` (rien de secret n'est envoyé) ; la
 * réception est le vrai risque, donc chaque côté contrôle la source ET l'origine, puis la forme du
 * message. Un message invalide, d'un autre type ou d'une autre version est ignoré (jamais d'erreur).
 */

export const VERSION_PROTOCOLE = 1;
/** Origine d'un document sandboxé sans `allow-same-origin`. */
export const ORIGINE_OPAQUE = 'null';

export const MODES_APERCU = ['clair', 'sombre'] as const;
export type ModeApercu = (typeof MODES_APERCU)[number];

/** Valeur d'un token : 120 caractères au plus, sans `url(`, `;`, `{`, `}`, `@` ni antislash (échappement CSS). */
const LONGUEUR_MAX_VALEUR = 120;
const VALEUR_INTERDITE = /url\(|[;{}@\\]/i;
const CLASSES_VALIDES = /^[a-z0-9_-]+(?: [a-z0-9_-]+)*$/i;
const LONGUEUR_MAX_CLASSES = 80;
const HAUTEUR_MAX = 20_000;

/**
 * Site vers aperçu : design (valeurs des tokens), mode clair ou sombre, animations permises, et les
 * paramètres propres de la ressource (ADR 0014). `params` est facultatif à la réception.
 */
export interface MessageReglages {
  readonly v: typeof VERSION_PROTOCOLE;
  readonly type: 'ngs-reglages';
  readonly vars: Readonly<Partial<Record<TokenContrat, string>>>;
  readonly mode: ModeApercu;
  readonly animations: boolean;
  readonly params: ParametresBruts;
}

/** Site vers aperçu : joue la sortie en posant ces classes sur l'hôte (« Rejouer la sortie »). */
export interface MessageSortie {
  readonly v: typeof VERSION_PROTOCOLE;
  readonly type: 'ngs-sortie';
  readonly classes: string;
}

/** Aperçu vers site : l'aperçu est monté et attend ses réglages. */
export interface MessagePret {
  readonly v: typeof VERSION_PROTOCOLE;
  readonly type: 'ngs-pret';
}

/** Aperçu vers site : l'animation de sortie est terminée (le site rejoue l'entrée). */
export interface MessageSortieFin {
  readonly v: typeof VERSION_PROTOCOLE;
  readonly type: 'ngs-sortie-fin';
}

/** Aperçu vers site : hauteur du contenu en pixels, pour dimensionner le cadre. */
export interface MessageHauteur {
  readonly v: typeof VERSION_PROTOCOLE;
  readonly type: 'ngs-hauteur';
  readonly hauteur: number;
}

export type MessageVersApercu = MessageReglages | MessageSortie;
export type MessageVersSite = MessagePret | MessageSortieFin | MessageHauteur;

function estObjet(valeur: unknown): valeur is Readonly<Record<string, unknown>> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

/** Vrai pour une valeur de token qu'on accepte de poser dans le style de l'aperçu. */
export function valeurDeTokenAcceptable(valeur: unknown): valeur is string {
  return (
    typeof valeur === 'string' &&
    valeur.trim() !== '' &&
    valeur.length <= LONGUEUR_MAX_VALEUR &&
    !VALEUR_INTERDITE.test(valeur)
  );
}

/** Ne garde que les 12 clés du contrat dont la valeur est acceptable : tout le reste est écarté. */
export function filtrerReglages(brut: unknown): Partial<Record<TokenContrat, string>> {
  if (!estObjet(brut)) return {};
  const reglages: Partial<Record<TokenContrat, string>> = {};
  for (const token of TOKENS_CONTRAT) {
    const valeur = brut[token];
    if (valeurDeTokenAcceptable(valeur)) reglages[token] = valeur;
  }
  return reglages;
}

function estMode(valeur: unknown): valeur is ModeApercu {
  return MODES_APERCU.some((mode) => mode === valeur);
}

function lireReglages(m: Readonly<Record<string, unknown>>): MessageReglages | null {
  if (!estMode(m['mode']) || typeof m['animations'] !== 'boolean') return null;
  return {
    v: VERSION_PROTOCOLE,
    type: 'ngs-reglages',
    vars: filtrerReglages(m['vars']),
    mode: m['mode'],
    animations: m['animations'],
    params: filtrerParametresBruts(m['params']),
  };
}

function lireSortie(m: Readonly<Record<string, unknown>>): MessageSortie | null {
  const classes = m['classes'];
  const valide =
    typeof classes === 'string' &&
    classes.length <= LONGUEUR_MAX_CLASSES &&
    CLASSES_VALIDES.test(classes);
  return valide ? { v: VERSION_PROTOCOLE, type: 'ngs-sortie', classes } : null;
}

function lireHauteur(m: Readonly<Record<string, unknown>>): MessageHauteur | null {
  const hauteur = m['hauteur'];
  const valide =
    typeof hauteur === 'number' &&
    Number.isFinite(hauteur) &&
    hauteur >= 0 &&
    hauteur <= HAUTEUR_MAX;
  return valide
    ? { v: VERSION_PROTOCOLE, type: 'ngs-hauteur', hauteur: Math.round(hauteur) }
    : null;
}

function enveloppe(donnees: unknown): Readonly<Record<string, unknown>> | null {
  return estObjet(donnees) && donnees['v'] === VERSION_PROTOCOLE ? donnees : null;
}

/** Message reçu par l'aperçu : le type connu et bien formé, sinon `null`. */
export function lireMessageVersApercu(donnees: unknown): MessageVersApercu | null {
  const message = enveloppe(donnees);
  if (message?.['type'] === 'ngs-reglages') return lireReglages(message);
  if (message?.['type'] === 'ngs-sortie') return lireSortie(message);
  return null;
}

/** Message reçu par le site : le type connu et bien formé, sinon `null`. */
export function lireMessageVersSite(donnees: unknown): MessageVersSite | null {
  const message = enveloppe(donnees);
  const type = message?.['type'];
  if (type === 'ngs-pret') return { v: VERSION_PROTOCOLE, type };
  if (type === 'ngs-sortie-fin') return { v: VERSION_PROTOCOLE, type };
  if (type === 'ngs-hauteur' && message) return lireHauteur(message);
  return null;
}

/** Ce que les deux contrôles lisent d'un `MessageEvent`. */
export interface ProvenanceMessage {
  readonly source: unknown;
  readonly origin: string;
}

/**
 * Côté site : le message vient bien de la fenêtre de l'iframe d'aperçu, et l'origine est celle d'un
 * document sandboxé (`"null"`). La source seule ne suffit pas, l'origine seule non plus.
 */
export function vientDeLApercu(evenement: ProvenanceMessage, fenetreApercu: unknown): boolean {
  return (
    fenetreApercu !== null &&
    fenetreApercu !== undefined &&
    evenement.source === fenetreApercu &&
    evenement.origin === ORIGINE_OPAQUE
  );
}

/**
 * Côté aperçu : le message vient de la fenêtre parente, et son origine est l'une de celles du site
 * (liste fournie au build : production, localhost, domaine d'aperçu de pull request).
 */
export function vientDuSite(
  evenement: ProvenanceMessage,
  fenetreParente: unknown,
  originesAutorisees: readonly string[],
): boolean {
  return (
    fenetreParente !== null &&
    fenetreParente !== undefined &&
    evenement.source === fenetreParente &&
    originesAutorisees.includes(evenement.origin)
  );
}

/** Réglages à envoyer : `params` est facultatif (une ressource sans paramètre propre n'en a pas). */
export type ReglagesEnvoyes = Omit<MessageReglages, 'v' | 'type' | 'params'> & {
  readonly params?: ParametresBruts;
};

export function messageReglages(reglages: Readonly<ReglagesEnvoyes>): MessageReglages {
  return { v: VERSION_PROTOCOLE, type: 'ngs-reglages', params: {}, ...reglages };
}

export function messageSortie(classes: string): MessageSortie {
  return { v: VERSION_PROTOCOLE, type: 'ngs-sortie', classes };
}

export function messagePret(): MessagePret {
  return { v: VERSION_PROTOCOLE, type: 'ngs-pret' };
}

export function messageSortieFin(): MessageSortieFin {
  return { v: VERSION_PROTOCOLE, type: 'ngs-sortie-fin' };
}

export function messageHauteur(hauteur: number): MessageHauteur {
  return { v: VERSION_PROTOCOLE, type: 'ngs-hauteur', hauteur };
}
