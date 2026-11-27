import type { DesignContrat } from '../livraison/livraison';
import type { MetaRessource } from './ressource.model';

/** Une ligne du tableau « Paramètres » de la fiche (fiche.json). */
export interface ParametreApi {
  readonly nom: string;
  readonly type: string;
  readonly defaut: string;
  readonly role: string;
}

/** `fiche.json` : ce que la fiche affiche en plus du meta.json. */
export interface DonneesFiche {
  readonly usage: string;
  readonly api: readonly ParametreApi[];
}

export type LangageFichier = 'ts' | 'html' | 'css';

/** Un fichier de code affiché : le texte à copier et le HTML coloré au build. */
export interface FichierAffiche {
  readonly nom: string;
  readonly langage: LangageFichier;
  readonly code: string;
  readonly html: string;
}

/**
 * Tout ce que la fiche d'une ressource charge (src/generated/registre/fiche/<slug>.json, un chunk par
 * fiche) : la variante par défaut (Tailwind) est dans la page prérendue ; l'autre est un fragment statique
 * (`/code/<slug>-css.json`) chargé au premier basculement.
 */
export interface FicheRessource {
  readonly meta: MetaRessource;
  readonly usage: string;
  readonly api: readonly ParametreApi[];
  /** Fichiers de la variante Tailwind, sans tokens.css ni ngshelf-theme.css. */
  readonly fichiers: readonly FichierAffiche[];
  /** Contenu de ngshelf-theme.css (pont Tailwind), livré avec la variante Tailwind. */
  readonly pont: string;
  /** Les designs du registre : valeurs des 12 tokens, pour les réglages et le tokens.css. */
  readonly designs: readonly (DesignContrat & { readonly slug: string })[];
}

/** Fragment de code d'une variante, chargé à la demande. */
export interface FragmentCode {
  readonly fichiers: readonly FichierAffiche[];
}

export function cheminZip(slug: string, variante: 'tailwind' | 'css'): string {
  return `/zips/${slug}-${variante}.zip`;
}

export function cheminFragment(slug: string): string {
  return `/code/${slug}-css.json`;
}
