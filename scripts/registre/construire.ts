import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../../src/app/core/config/site.config.ts';
import type { MetaDesign, MetaRessource } from '../../src/app/shared/models/ressource.model.ts';
import { CATEGORIES } from '../../src/app/shared/models/taxonomie.model.ts';
import { construireApercus } from './apercus.ts';
import { construireLivraisons } from './livraisons.ts';
import { lireRegistre } from './lire.ts';
import { NOM_FICHIER_COMPTEURS, construireSorties, enJson, nomFichierIndex } from './sorties.ts';
import { validerRegistre } from './valider.ts';

/**
 * Point d'entrée : `npm run registre:build` (lancé aussi avant build, start, test et lint).
 * Lit registry/, valide, écrit src/generated/registre/. Code de sortie 1 au moindre problème.
 */
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SORTIE = join(RACINE, 'src/generated/registre');
/** Fichiers publics produits (zips, fragments de code) : copiés tels quels à la racine du site par angular.json. */
const SORTIE_PUBLIQUE = join(RACINE, 'src/generated/public');
const PONT = join(RACINE, 'src/styles/contrat/ngshelf-theme.css');
/** Sources assemblées de l'application d'aperçus (projects/apercus). */
const SORTIE_APERCUS = join(RACINE, 'projects/apercus/src/generated');

function echouer(titre: string, erreurs: readonly string[]): never {
  process.stderr.write(`${titre}\n${erreurs.map((e) => `  - ${e}`).join('\n')}\n`);
  process.exit(1);
}

function ecrireFichier(chemin: string, contenu: string | Uint8Array): void {
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, contenu);
}

/** Fiches, fragments de code et zips (ADR 0002 décision 5, ADR 0008). */
function ecrireLivraisons(
  metas: readonly (MetaRessource | MetaDesign)[],
  fichiersParSlug: ReadonlyMap<string, Readonly<Record<string, string>>>,
): number {
  const ressources = metas.flatMap((meta) =>
    meta.categorie === 'design' ? [] : [{ meta, fichiers: fichiersParSlug.get(meta.slug) ?? {} }],
  );
  const designs = metas.flatMap((meta) => (meta.categorie === 'design' ? [meta] : []));
  const livraisons = construireLivraisons({
    ressources,
    designs,
    pont: readFileSync(PONT, 'utf8'),
    nomSite: SITE.nom,
  });
  const planche = livraisons.designs.find((d) => d.slug === 'planche') ?? livraisons.designs[0];
  if (planche === undefined) throw new Error('aucun design dans le registre');
  const apercus = construireApercus(
    ressources.map((r) => ({
      slug: r.meta.slug,
      avecMotion: r.meta.motion !== null,
      fichiers: r.fichiers,
    })),
    planche,
    readFileSync(PONT, 'utf8'),
    SITE.nom,
  );
  rmSync(SORTIE_APERCUS, { recursive: true, force: true });
  for (const [chemin, contenu] of apercus) ecrireFichier(join(SORTIE_APERCUS, chemin), contenu);
  for (const [slug, fiche] of livraisons.fiches) {
    ecrireFichier(join(SORTIE, 'fiche', `${slug}.json`), enJson(fiche));
  }
  for (const [slug, fragment] of livraisons.fragments) {
    ecrireFichier(join(SORTIE_PUBLIQUE, 'code', `${slug}-css.json`), enJson(fragment));
  }
  for (const [nom, zip] of livraisons.zips) ecrireFichier(join(SORTIE_PUBLIQUE, 'zips', nom), zip);
  return livraisons.fiches.size;
}

function ecrire(): void {
  const lecture = lireRegistre(join(RACINE, 'registry'));
  const validation = validerRegistre(lecture.entrees);
  const erreurs = [...lecture.erreurs, ...validation.erreurs];
  if (erreurs.length > 0) echouer('Registre invalide :', erreurs);

  const { index, compteurs } = construireSorties(validation.metas);
  rmSync(SORTIE, { recursive: true, force: true });
  rmSync(SORTIE_PUBLIQUE, { recursive: true, force: true });
  mkdirSync(SORTIE, { recursive: true });
  for (const categorie of CATEGORIES) {
    writeFileSync(join(SORTIE, nomFichierIndex(categorie)), enJson(index[categorie]));
  }
  writeFileSync(join(SORTIE, NOM_FICHIER_COMPTEURS), enJson(compteurs));
  const fichiersParSlug = new Map(
    validation.metas.map((meta, i) => [meta.slug, lecture.entrees[i]?.fichiers ?? {}] as const),
  );
  const fiches = ecrireLivraisons(validation.metas, fichiersParSlug);
  process.stdout.write(
    `Registre : ${compteurs.total} ressource(s) indexée(s), ${fiches} fiche(s) et ${fiches * 2} zip(s) dans src/generated/\n`,
  );
}

ecrire();
