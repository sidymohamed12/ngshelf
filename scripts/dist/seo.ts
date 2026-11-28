import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../../src/app/core/config/site.config.ts';
import type { Compteurs, EntreeIndex } from '../../src/app/shared/models/index-catalogue.model.ts';
import { CATEGORIES, type Categorie } from '../../src/app/shared/models/taxonomie.model.ts';
import {
  ajouterSitemapRobots,
  cheminsSitemap,
  construireSitemap,
  validerUrlSite,
} from '../seo/sitemap.ts';

/**
 * `npm run build`, après l'assemblage des aperçus : prépare les fichiers de référencement du dossier de
 * sortie. (1) `404.html` : la page prérendue en /404/ devient `404.html` à la racine, que l'hébergeur sert
 * avec le statut 404 à toute adresse inconnue. (2) `sitemap.xml` et la ligne `Sitemap:` de robots.txt, depuis
 * le registre, seulement si `SITE.url` (la seule source du domaine) est renseignée ; sinon un avertissement
 * clair et ni sitemap ni ligne `Sitemap:` (un sitemap exige des adresses absolues, jamais devinées).
 */
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SITE_DIST = join(RACINE, 'dist/ngshelf/browser');
const REGISTRE = join(RACINE, 'src/generated/registre');

function lireJson<T>(chemin: string): T {
  return JSON.parse(readFileSync(chemin, 'utf8')) as T;
}

function preparer404(): void {
  const prerendue = join(SITE_DIST, '404/index.html');
  if (!existsSync(prerendue)) {
    throw new Error('Page 404 prérendue introuvable (dist/ngshelf/browser/404/index.html).');
  }
  renameSync(prerendue, join(SITE_DIST, '404.html'));
  rmSync(join(SITE_DIST, '404'), { recursive: true, force: true });
  process.stdout.write('404.html : générée à la racine du site.\n');
}

function ecrireSitemap(base: string): void {
  const compteurs = lireJson<Compteurs>(join(REGISTRE, 'compteurs.json'));
  const index = Object.fromEntries(
    CATEGORIES.map((c) => [c, lireJson<EntreeIndex[]>(join(REGISTRE, `index-${c}.json`))]),
  ) as Record<Categorie, EntreeIndex[]>;
  const chemins = cheminsSitemap({ compteurs, index });
  writeFileSync(join(SITE_DIST, 'sitemap.xml'), construireSitemap(base, chemins));
  const robots = join(SITE_DIST, 'robots.txt');
  const actuel = existsSync(robots) ? readFileSync(robots, 'utf8') : 'User-agent: *\nAllow: /\n';
  writeFileSync(robots, ajouterSitemapRobots(actuel, base));
  process.stdout.write(`sitemap.xml : ${chemins.length} adresse(s) sous ${base}.\n`);
}

function generer(): void {
  if (!existsSync(SITE_DIST)) {
    throw new Error('Construire le site d’abord (npm run build).');
  }
  preparer404();
  const base = validerUrlSite(SITE.url);
  if (base === null) {
    process.stderr.write(
      [
        'AVERTISSEMENT SEO : SITE.url vaut null (src/app/core/config/site.config.ts), le domaine de production n’est pas choisi.',
        '  - sitemap.xml non généré et pas de ligne « Sitemap: » dans robots.txt ;',
        '  - canoniques relatifs, og:url / og:image / twitter:image et adresses du JSON-LD omis.',
        '  Renseignez SITE.url (https://votre-domaine, sans barre finale) puis relancez le build.',
        '',
      ].join('\n'),
    );
    return;
  }
  ecrireSitemap(base);
}

try {
  generer();
} catch (erreur) {
  process.stderr.write(`${erreur instanceof Error ? erreur.message : String(erreur)}\n`);
  process.exit(1);
}
