import type { DonneesFiche, ParametreApi } from '../../src/app/shared/models/fiche.model.ts';
import type { FichiersRessource } from './sources.ts';
import { MARQUEUR_STYLE, nomComposant, structureGabarit } from './sources.ts';

/**
 * Contrôles des fichiers d'une ressource (ADR 0002, décision 3 et « Conséquences ») : présence, gabarits
 * équivalents d'une variante à l'autre, animations désactivables. Un contrôle raté fait échouer le build.
 */

const CLES_PARAMETRE = ['nom', 'type', 'defaut', 'role'];

function estObjet(valeur: unknown): valeur is Readonly<Record<string, unknown>> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

function estParametre(valeur: unknown): valeur is ParametreApi {
  return (
    estObjet(valeur) &&
    Object.keys(valeur).length === CLES_PARAMETRE.length &&
    CLES_PARAMETRE.every((cle) => typeof valeur[cle] === 'string')
  );
}

/** Lit et valide `fiche.json` ; l'erreur est un message, pas une exception. */
export function lireDonneesFiche(brut: string): DonneesFiche | string {
  let json: unknown;
  try {
    json = JSON.parse(brut);
  } catch {
    return '« fiche.json » n’est pas du JSON';
  }
  if (!estObjet(json) || Object.keys(json).length !== 2) {
    return '« fiche.json » doit contenir seulement « usage » et « api »';
  }
  const { usage, api } = json;
  if (typeof usage !== 'string' || usage.trim() === '') {
    return '« fiche.json » : « usage » doit être un texte non vide';
  }
  if (!Array.isArray(api) || !api.every(estParametre)) {
    return '« fiche.json » : « api » doit lister { nom, type, defaut, role } en texte';
  }
  return { usage, api };
}

function fichiersRequis(composant: string): readonly string[] {
  return [
    `tailwind/${composant}.component.html`,
    'tailwind/hote.txt',
    `css/${composant}.component.html`,
    `css/${composant}.component.css`,
    'fiche.json',
  ];
}

/** Erreurs d'une ressource (hors design) ; `avecMotion` vient de son meta.json. */
export function validerSources(
  fichiers: FichiersRessource | undefined,
  avecMotion: boolean,
): readonly string[] {
  if (fichiers === undefined) return ['fichiers de la ressource non lus'];
  const composant = nomComposant(fichiers);
  if (composant === undefined) {
    return ['le dossier doit contenir exactement un « <nom>.component.ts » à sa racine'];
  }
  const erreurs: string[] = [];
  for (const requis of fichiersRequis(composant)) {
    if (!(requis in fichiers)) erreurs.push(`fichier manquant « ${requis} »`);
  }
  const ts = fichiers[`${composant}.component.ts`] ?? '';
  if (ts.split(MARQUEUR_STYLE).length !== 2) {
    erreurs.push(`« ${composant}.component.ts » doit contenir une fois la ligne ${MARQUEUR_STYLE}`);
  }
  if (!ts.includes(`templateUrl: './${composant}.component.html'`)) {
    erreurs.push(
      `« ${composant}.component.ts » doit déclarer templateUrl './${composant}.component.html'`,
    );
  }
  if (avecMotion && !ts.includes('animations = input(')) {
    erreurs.push('« motion » exige l’input « animations » du composant (animations désactivables)');
  }
  const donnees = fichiers['fiche.json'];
  if (donnees !== undefined) {
    const lue = lireDonneesFiche(donnees);
    if (typeof lue === 'string') erreurs.push(lue);
  }
  const tailwind = fichiers[`tailwind/${composant}.component.html`];
  const css = fichiers[`css/${composant}.component.html`];
  if (tailwind !== undefined && css !== undefined) {
    if (structureGabarit(tailwind) !== structureGabarit(css)) {
      erreurs.push('les gabarits « tailwind » et « css » ne sont pas équivalents (hors classes)');
    }
  }
  return erreurs;
}
