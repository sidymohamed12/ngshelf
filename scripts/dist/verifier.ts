import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adressesDuSitemap } from '../seo/sitemap.ts';
import { estNoindex, trouverJsonLdInvalides } from '../seo/verifier-seo.ts';
import {
  hotesInterditsDansApercus,
  hotesTemporairesHorsApercus,
  problemesEntetes,
} from './hotes-tiers.ts';
import { trouverScriptsEnLigne } from './scripts-en-ligne.ts';
import {
  HOTES_IMAGES_TEMPORAIRES,
  IMAGES_EXTERNES_ACTIVES,
} from '../../projects/apercus/src/app/images-demo.ts';

/**
 * `npm run verifier:dist` (après `npm run build`, et en CI) : aucun script exécutable en ligne ni attribut
 * `on…=` dans les pages prérendues de dist/ (ADR 0009) ; blocs JSON-LD valides (ce sont des blocs de données,
 * non exécutables : la CSP `script-src 'self'` les admet) ; `404.html` présente et `noindex` ; chaque adresse
 * du sitemap, s'il existe, correspond à une page prérendue ; images externes temporaires (ADR 0021) : aucun
 * hôte tiers hors liste blanche dans les aperçus, aucun dans le site ni dans les zips, `_headers` cohérent.
 * Code de sortie 1 au moindre problème.
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

function problemesSeo(pages: readonly string[]): string[] {
  const problemes = pages.flatMap((page) =>
    trouverJsonLdInvalides(readFileSync(page, 'utf8')).map(
      (probleme) => `${relative(RACINE, page)} : ${probleme}`,
    ),
  );
  const page404 = join(DIST, '404.html');
  if (!existsSync(page404)) problemes.push('404.html absente de la racine du site');
  else if (!estNoindex(readFileSync(page404, 'utf8'))) problemes.push('404.html sans noindex');
  const sitemap = join(DIST, 'sitemap.xml');
  if (existsSync(sitemap)) {
    for (const adresse of adressesDuSitemap(readFileSync(sitemap, 'utf8'))) {
      const chemin = new URL(adresse).pathname;
      const fichier = join(DIST, chemin, 'index.html');
      if (!existsSync(fichier))
        problemes.push(`sitemap.xml : ${chemin} n’est pas une page prérendue`);
    }
  }
  return problemes;
}

function problemesCsp(pages: readonly string[]): string[] {
  return pages.flatMap((page) =>
    trouverScriptsEnLigne(readFileSync(page, 'utf8')).map(
      (probleme) => `${relative(RACINE, page)} : ${probleme}`,
    ),
  );
}

const REGLES = { actives: IMAGES_EXTERNES_ACTIVES, hotesTemporaires: HOTES_IMAGES_TEMPORAIRES };
const EXTENSIONS_TEXTE = ['.html', '.js', '.css', '.svg', '.json', '.txt', '.md', '.zip'];

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return EXTENSIONS_TEXTE.some((extension) => nom.endsWith(extension)) ? [chemin] : [];
  });
}

/** Images externes temporaires : liste blanche (hôtes admis) et cantonnement à `/apercu/*`. */
function problemesHotesTiers(): string[] {
  const dossierApercus = join(DIST, 'apercu');
  const problemes: string[] = [];
  for (const fichier of fichiers(DIST)) {
    const texte = readFileSync(fichier, 'latin1');
    const nom = relative(RACINE, fichier);
    if (fichier.startsWith(dossierApercus)) {
      for (const hote of hotesInterditsDansApercus(texte, REGLES)) {
        problemes.push(`${nom} : hôte tiers hors liste blanche (${hote})`);
      }
    } else {
      for (const hote of hotesTemporairesHorsApercus(texte, REGLES)) {
        problemes.push(`${nom} : hôte d'image temporaire hors de /apercu/ (${hote})`);
      }
    }
  }
  const entetes = join(DIST, '_headers');
  if (existsSync(entetes))
    problemes.push(...problemesEntetes(readFileSync(entetes, 'utf8'), REGLES));
  return problemes;
}

function verifier(): void {
  const pages = pagesHtml(DIST);
  if (pages.length === 0) {
    process.stderr.write(`Aucune page HTML dans ${DIST} : lancer npm run build d'abord.\n`);
    process.exit(1);
  }
  const erreurs = [...problemesCsp(pages), ...problemesSeo(pages), ...problemesHotesTiers()];
  if (erreurs.length > 0) {
    process.stderr.write(
      `Problèmes dans dist/ (CSP, SEO, hôtes tiers) :\n${erreurs.map((e) => `  - ${e}`).join('\n')}\n`,
    );
    process.exit(1);
  }
  if (IMAGES_EXTERNES_ACTIVES) {
    process.stderr.write(
      `AVERTISSEMENT (temporaire, ADR 0021) : les aperçus chargent des images de ${HOTES_IMAGES_TEMPORAIRES.join(', ')} ; ` +
        "l'IP des visiteurs est exposée à ces hôtes. À remplacer par des images locales.\n",
    );
  }
  process.stdout.write(
    `CSP : ${pages.length} page(s) sans script exécutable en ligne ; SEO : JSON-LD valide, 404.html noindex\n`,
  );
}

verifier();
