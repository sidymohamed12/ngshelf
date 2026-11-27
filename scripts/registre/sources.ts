/**
 * Sources d'une ressource (ADR 0002, décision 3 : deux sources écrites, une logique commune) et
 * assemblage de ce qui est livré, par variante. Fonctions pures sur `chemin relatif -> contenu` : la
 * lecture du disque est dans lire.ts. Partagé par la validation, le code affiché, les zips et l'aperçu.
 *
 * registry/<segment>/<slug>/
 *   meta.json
 *   <nom>.component.ts          logique commune ; sa ligne marqueur (MARQUEUR_STYLE) reçoit styleUrl et host
 *   <autre>.ts                  fichiers livrés avec les deux variantes (un service par exemple)
 *   tailwind/<nom>.component.html   gabarit en utilitaires Tailwind (variante par défaut)
 *   tailwind/<nom>.component.css    facultatif : @keyframes seulement
 *   tailwind/hote.txt               classes Tailwind de l'hôte du composant
 *   css/<nom>.component.html        même gabarit, classes BEM
 *   css/<nom>.component.css         var(--ngs-…, repli) uniquement
 *   fiche.json                      usage et API affichés sur la fiche
 *   demo/…                          scène de l'aperçu (non livrée)
 */

export type VarianteCode = 'tailwind' | 'css';
export type LangageCode = 'ts' | 'html' | 'css';

/** Contenu des fichiers d'une ressource, indexé par chemin relatif à son dossier. */
export type FichiersRessource = Readonly<Record<string, string>>;

export interface FichierCode {
  readonly nom: string;
  readonly langage: LangageCode;
  readonly code: string;
}

export const MARQUEUR_STYLE = '/*STYLE*/';
const MOTIF_COMPOSANT = /^([a-z0-9-]+)\.component\.ts$/;
const INDENTATION = '  ';
const CLASSE_ANIMATIONS_COUPEES = "'[class.ngs-sans-animation]': '!animations()'";

/** Nom du composant (`bouton` pour `bouton.component.ts`) : exactement un fichier à la racine. */
export function nomComposant(fichiers: FichiersRessource): string | undefined {
  const noms = Object.keys(fichiers).flatMap((chemin) => MOTIF_COMPOSANT.exec(chemin)?.[1] ?? []);
  return noms.length === 1 ? noms[0] : undefined;
}

function langageDe(nom: string): LangageCode {
  if (nom.endsWith('.html')) return 'html';
  return nom.endsWith('.css') ? 'css' : 'ts';
}

/** Ce que la ligne de style du .ts devient dans une variante : host (classes, animations) et styleUrl. */
function lignesStyle(
  composant: string,
  variante: VarianteCode,
  fichiers: FichiersRessource,
  avecMotion: boolean,
): string {
  const hote: string[] = [];
  const classes = fichiers['tailwind/hote.txt']?.trim();
  if (variante === 'tailwind' && classes) hote.push(`class: '${classes}'`);
  if (avecMotion) hote.push(CLASSE_ANIMATIONS_COUPEES);
  const host = hote.length > 0 ? `host: { ${hote.join(', ')} },` : '';
  const feuille = `styleUrl: './${composant}.component.css',`;
  if (variante === 'css') return host ? `${feuille}\n${INDENTATION}${host}` : feuille;
  const keyframes = `tailwind/${composant}.component.css` in fichiers;
  const suite = keyframes ? `${feuille} // @keyframes seulement` : '';
  return [host, suite].filter(Boolean).join(`\n${INDENTATION}`);
}

/**
 * Fichiers livrés pour une variante : logique (avec sa ligne de style résolue), fichiers communs,
 * gabarit, feuille de style. Sans `tokens.css`, `ngshelf-theme.css`, README ni LICENSE (ajoutés à la livraison).
 */
export function fichiersVariante(
  fichiers: FichiersRessource,
  variante: VarianteCode,
  avecMotion: boolean,
): readonly FichierCode[] {
  const composant = nomComposant(fichiers);
  if (composant === undefined) return [];
  const base = `${composant}.component`;
  const style = lignesStyle(composant, variante, fichiers, avecMotion);
  const ts = (fichiers[`${base}.ts`] ?? '').replace(
    new RegExp(`\\n(\\s*)${escapeRegExp(MARQUEUR_STYLE)}\\n`),
    style ? `\n$1${style}\n` : '\n',
  );
  const extras = Object.keys(fichiers)
    .filter((chemin) => chemin.endsWith('.ts') && !chemin.includes('/') && chemin !== `${base}.ts`)
    .sort()
    .map((chemin): FichierCode => ({ nom: chemin, langage: 'ts', code: fichiers[chemin] ?? '' }));
  const liste: FichierCode[] = [
    ...extras,
    { nom: `${base}.ts`, langage: 'ts', code: ts },
    { nom: `${base}.html`, langage: 'html', code: fichiers[`${variante}/${base}.html`] ?? '' },
  ];
  const feuille = fichiers[`${variante}/${base}.css`];
  if (feuille !== undefined) {
    liste.push({ nom: `${base}.css`, langage: langageDe(`${base}.css`), code: feuille });
  }
  return liste.map((f) => ({ ...f, code: f.code.replace(/\s+$/, '') }));
}

function escapeRegExp(texte: string): string {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Gabarit réduit à sa structure : sans les listes de classes (`class`, `animate.enter`,
 * `animate.leave` et leurs liaisons), sans commentaires ni espaces autour des balises (la mise en forme
 * de Prettier change selon la longueur des attributs). Deux gabarits qui diffèrent seulement par
 * leurs classes donnent la même chaîne (contrôle d'équivalence de structure, ADR 0002).
 */
export function structureGabarit(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s\[?(?:class|animate\.enter|animate\.leave)\]?="[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([<>])\s*/g, '$1')
    .trim();
}
