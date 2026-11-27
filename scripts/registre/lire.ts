import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { SEGMENT_CATEGORIE } from '../../src/app/shared/models/taxonomie.model.ts';
import type { FichiersRessource } from './sources.ts';
import type { EntreeBrute } from './valider.ts';

const NOM_META = 'meta.json';

function sousDossiers(dossier: string): string[] {
  return readdirSync(dossier)
    .filter((nom) => statSync(join(dossier, nom)).isDirectory())
    .sort();
}

/** Tous les fichiers texte d'un dossier de ressource (sous-dossiers compris), chemins relatifs. */
function lireFichiers(dossier: string, base = dossier): Record<string, string> {
  const fichiers: Record<string, string> = {};
  for (const nom of readdirSync(dossier).sort()) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) Object.assign(fichiers, lireFichiers(chemin, base));
    else if (nom !== NOM_META) fichiers[relative(base, chemin)] = readFileSync(chemin, 'utf8');
  }
  return fichiers;
}

/** Le meta.json lu avec les autres fichiers du dossier, ou le message d'erreur s'il manque ou n'est pas du JSON. */
function lireMeta(racine: string, chemin: string): EntreeBrute | string {
  try {
    const contenu = readFileSync(join(racine, chemin, NOM_META), 'utf8');
    const fichiers: FichiersRessource = lireFichiers(join(racine, chemin));
    return { chemin, meta: JSON.parse(contenu) as unknown, fichiers };
  } catch (erreur) {
    const raison = erreur instanceof Error ? erreur.message : String(erreur);
    return `${chemin} : ${NOM_META} illisible (${raison})`;
  }
}

/**
 * Lit registry/<segment>/<slug>/meta.json. Un dossier de premier niveau qui n'est pas un segment de
 * catégorie est une erreur (faute de frappe), pas un fichier ignoré en silence.
 */
export function lireRegistre(racine: string): { entrees: EntreeBrute[]; erreurs: string[] } {
  const segments: readonly string[] = Object.values(SEGMENT_CATEGORIE);
  const entrees: EntreeBrute[] = [];
  const erreurs: string[] = [];
  for (const segment of sousDossiers(racine)) {
    if (!segments.includes(segment)) {
      erreurs.push(`${segment} : dossier inconnu (attendus : ${segments.join(', ')})`);
      continue;
    }
    for (const slug of sousDossiers(join(racine, segment))) {
      const lue = lireMeta(racine, `${segment}/${slug}`);
      if (typeof lue === 'string') erreurs.push(lue);
      else entrees.push(lue);
    }
  }
  return { entrees, erreurs };
}
