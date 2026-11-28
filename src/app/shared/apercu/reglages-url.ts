import { Surcharges, TokenContrat } from '../livraison/livraison';
import { ModeApercu } from './protocole';

/**
 * Réglages d'une page d'aperçu autonome (ADR 0016) : ce que la fiche met dans l'URL de « Ouvrir dans un
 * nouvel onglet » et ce que l'aperçu relit au chargement. Un seul fichier pour les deux côtés, donc
 * aucune dérive possible. Rien n'est lu comme du code : chaque valeur est validée, sinon ignorée.
 */

export type PoliceReglee = 'systeme' | 'arrondie' | 'serif';

export const POLICES: Readonly<Record<PoliceReglee, string>> = {
  systeme: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  arrondie: 'ui-rounded, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
};

export const RAYON_MAX_PX = 24;
const DENSITE_MIN = 0.5;
const DENSITE_MAX = 2;
const MOTIF_COULEUR = /^#[0-9a-f]{6}$/i;
const MOTIF_DESIGN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Réglages du visiteur qui surchargent le design (fiche : couleur d'action, rayon, densité, police). */
export interface ReglagesVisiteur {
  readonly couleur?: string;
  readonly rayon?: number;
  readonly densite?: number;
  readonly police?: PoliceReglee;
}

/** Réglages du visiteur vers les tokens du contrat qu'ils surchargent. */
export function versSurcharges(reglages: ReglagesVisiteur): Surcharges {
  const surcharges: Partial<Record<TokenContrat, string>> = {};
  if (reglages.couleur !== undefined) surcharges['--ngs-color-action'] = reglages.couleur;
  if (reglages.rayon !== undefined) surcharges['--ngs-radius'] = `${reglages.rayon}px`;
  if (reglages.densite !== undefined) surcharges['--ngs-density'] = String(reglages.densite);
  if (reglages.police !== undefined) surcharges['--ngs-font-family'] = POLICES[reglages.police];
  return surcharges;
}

/** État initial d'une page d'aperçu, tel que l'URL le décrit. */
export interface EtatApercuUrl {
  /** Slug du design, absent = celui de l'application d'aperçus (Planche). */
  readonly design?: string;
  readonly mode: ModeApercu;
  readonly animations: boolean;
  readonly reglages: ReglagesVisiteur;
}

function estPolice(valeur: string | null): valeur is PoliceReglee {
  return valeur !== null && Object.keys(POLICES).includes(valeur);
}

function lireEntier(valeur: string | null): number | undefined {
  if (valeur === null || !/^\d{1,2}$/.test(valeur)) return undefined;
  const n = Number(valeur);
  return n <= RAYON_MAX_PX ? n : undefined;
}

function lireDensite(valeur: string | null): number | undefined {
  if (valeur === null) return undefined;
  const n = Number(valeur);
  return Number.isFinite(n) && n >= DENSITE_MIN && n <= DENSITE_MAX ? n : undefined;
}

function sansIndefinis(reglages: ReglagesVisiteur): ReglagesVisiteur {
  return Object.fromEntries(
    Object.entries(reglages).filter(([, valeur]) => valeur !== undefined),
  ) as ReglagesVisiteur;
}

/** Lit la partie « habillage » de la chaîne de recherche d'une page d'aperçu. */
export function lireRechercheApercu(recherche: string): EtatApercuUrl {
  const url = new URLSearchParams(recherche);
  const design = url.get('design');
  const couleur = url.get('couleur');
  const police = url.get('police');
  return {
    design: design !== null && MOTIF_DESIGN.test(design) ? design : undefined,
    mode: url.get('mode') === 'sombre' ? 'sombre' : 'clair',
    animations: url.get('animations') !== '0',
    reglages: sansIndefinis({
      couleur: couleur !== null && MOTIF_COULEUR.test(couleur) ? couleur : undefined,
      rayon: lireEntier(url.get('rayon')),
      densite: lireDensite(url.get('densite')),
      police: estPolice(police) ? police : undefined,
    }),
  };
}

/** Écrit l'état d'une fiche dans une chaîne de recherche ; seul ce qui diffère du départ est écrit. */
export function ecrireRechercheApercu(etat: EtatApercuUrl, vers: URLSearchParams): void {
  if (etat.design !== undefined) vers.set('design', etat.design);
  if (etat.mode === 'sombre') vers.set('mode', 'sombre');
  if (!etat.animations) vers.set('animations', '0');
  const { couleur, rayon, densite, police } = etat.reglages;
  if (couleur !== undefined) vers.set('couleur', couleur);
  if (rayon !== undefined) vers.set('rayon', String(rayon));
  if (densite !== undefined) vers.set('densite', String(densite));
  if (police !== undefined) vers.set('police', police);
}
