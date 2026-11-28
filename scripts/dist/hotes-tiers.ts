/**
 * Garde-fou des images externes TEMPORAIRES (ADR 0021). Fonctions pures, utilisées par `verifier:dist`.
 *
 * Règles : dans l'application d'aperçus, tout hôte hors de la liste blanche (hôtes d'images temporaires, si
 * elles sont actives, et hôtes neutres : espaces de noms et liens de documentation) est une erreur ; hors de
 * l'application d'aperçus (site, zips livrés), aucun hôte d'image temporaire ne doit apparaître ; la CSP du
 * site n'admet aucun hôte tiers, celle de `/apercu/*` exactement la liste blanche (ou aucun hôte si les
 * images externes sont coupées).
 */

/** Hôtes présents dans les bundles sans charger de ressource (espaces de noms, liens). */
export const HOTES_NEUTRES: readonly string[] = [
  'www.w3.org',
  'angular.dev',
  'github.com',
  'localhost',
  '127.0.0.1',
  'fake',
  'www.tiktok.com',
  'www.linkedin.com',
  'www.instagram.com',
  'sidy-mohamed-saizonou.netlify.app',
];

const URL_HOTE = /https?:\/\/([a-z0-9.-]+)/gi;
const IMG_SRC = /img-src([^;\n]*)/i;

/** Hôtes distincts cités dans un texte (en minuscules). */
export function hotesCites(texte: string): readonly string[] {
  const hotes = new Set<string>();
  for (const [, hote = ''] of texte.matchAll(URL_HOTE)) hotes.add(hote.toLowerCase());
  return [...hotes];
}

export interface ReglesHotes {
  readonly actives: boolean;
  readonly hotesTemporaires: readonly string[];
}

/** Dans l'application d'aperçus : hôtes hors liste blanche. */
export function hotesInterditsDansApercus(texte: string, regles: ReglesHotes): readonly string[] {
  const admis = new Set([...HOTES_NEUTRES, ...(regles.actives ? regles.hotesTemporaires : [])]);
  return hotesCites(texte).filter((hote) => !admis.has(hote));
}

/** Hors de l'application d'aperçus : aucun hôte d'image temporaire. */
export function hotesTemporairesHorsApercus(texte: string, regles: ReglesHotes): readonly string[] {
  return hotesCites(texte).filter((hote) => regles.hotesTemporaires.includes(hote));
}

/** Hôtes tiers (`https://…`) de la directive `img-src` d'une ligne de CSP. */
function hotesImgSrc(ligne: string): readonly string[] {
  const directive = IMG_SRC.exec(ligne)?.[1] ?? '';
  return directive
    .split(/\s+/)
    .filter((source) => source.startsWith('https://') || source.startsWith('http://'))
    .map((source) => source.replace(/^https?:\/\//, '').toLowerCase());
}

/** Contrôle `_headers` : CSP du site sans hôte tiers, CSP de `/apercu/*` égale à la liste blanche. */
export function problemesEntetes(entetes: string, regles: ReglesHotes): readonly string[] {
  const problemes: string[] = [];
  let bloc = '';
  for (const ligne of entetes.split('\n')) {
    if (/^\S/.test(ligne) && !ligne.startsWith('#')) bloc = ligne.trim();
    if (
      !ligne.includes('Content-Security-Policy:') ||
      ligne.includes('! Content-Security-Policy')
    ) {
      continue;
    }
    const hotes = hotesImgSrc(ligne);
    const attendus = bloc === '/apercu/*' && regles.actives ? regles.hotesTemporaires : [];
    const inattendus = hotes.filter((hote) => !attendus.includes(hote));
    const manquants = attendus.filter((hote) => !hotes.includes(hote));
    for (const hote of inattendus) {
      problemes.push(`_headers ${bloc} : img-src admet ${hote}, hors liste blanche pour ce bloc`);
    }
    for (const hote of manquants) {
      problemes.push(`_headers ${bloc} : img-src n'admet pas ${hote} (images externes actives)`);
    }
  }
  return problemes;
}
