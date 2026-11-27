import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * `npm run build` : l'application d'aperçus (baseHref /apercu/) est copiée dans le dossier du site sous
 * `apercu/`, pour un seul dossier statique à déployer (ADR 0003). Les en-têtes de `_headers`
 * (CSP sandbox, CORS) s'appliquent ensuite à `/apercu/*`.
 */
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = join(RACINE, 'dist/ngshelf/browser');
const APERCUS = join(RACINE, 'dist/apercus/browser');
const CIBLE = join(SITE, 'apercu');

if (!existsSync(SITE) || !existsSync(APERCUS)) {
  process.stderr.write('Assemblage impossible : construire le site et les aperçus d’abord.\n');
  process.exit(1);
}
rmSync(CIBLE, { recursive: true, force: true });
cpSync(APERCUS, CIBLE, { recursive: true });
process.stdout.write(`Aperçus assemblés dans ${CIBLE}\n`);
