import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { trouverScriptsEnLigne } from './scripts-en-ligne.ts';

/**
 * `npm run verifier:dist` (après `npm run build`, et en CI) : aucun script exécutable en ligne ni attribut
 * `on…=` dans les pages prérendues de dist/ (ADR 0009). Code de sortie 1 au moindre problème.
 */
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DIST = join(RACINE, 'dist/ngshelf/browser');

function pagesHtml(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return pagesHtml(chemin);
    return nom.endsWith('.html') ? [chemin] : [];
  });
}

function verifier(): void {
  const pages = pagesHtml(DIST);
  if (pages.length === 0) {
    process.stderr.write(`Aucune page HTML dans ${DIST} : lancer npm run build d'abord.\n`);
    process.exit(1);
  }
  const erreurs = pages.flatMap((page) =>
    trouverScriptsEnLigne(readFileSync(page, 'utf8')).map(
      (probleme) => `${relative(RACINE, page)} : ${probleme}`,
    ),
  );
  if (erreurs.length > 0) {
    process.stderr.write(
      `Scripts en ligne interdits par la CSP :\n${erreurs.map((e) => `  - ${e}`).join('\n')}\n`,
    );
    process.exit(1);
  }
  process.stdout.write(`CSP : ${pages.length} page(s) sans script exécutable en ligne\n`);
}

verifier();
