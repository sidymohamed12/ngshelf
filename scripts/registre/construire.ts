import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from '../../src/app/shared/models/taxonomie.model.ts';
import { lireRegistre } from './lire.ts';
import { NOM_FICHIER_COMPTEURS, construireSorties, enJson, nomFichierIndex } from './sorties.ts';
import { validerRegistre } from './valider.ts';

/**
 * Point d'entrée : `npm run registre:build` (lancé aussi avant build, start, test et lint).
 * Lit registry/, valide, écrit src/generated/registre/. Code de sortie 1 au moindre problème.
 */
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SORTIE = join(RACINE, 'src/generated/registre');

function echouer(titre: string, erreurs: readonly string[]): never {
  process.stderr.write(`${titre}\n${erreurs.map((e) => `  - ${e}`).join('\n')}\n`);
  process.exit(1);
}

function ecrire(): void {
  const lecture = lireRegistre(join(RACINE, 'registry'));
  const validation = validerRegistre(lecture.entrees);
  const erreurs = [...lecture.erreurs, ...validation.erreurs];
  if (erreurs.length > 0) echouer('Registre invalide :', erreurs);

  const { index, compteurs } = construireSorties(validation.metas);
  rmSync(SORTIE, { recursive: true, force: true });
  mkdirSync(SORTIE, { recursive: true });
  for (const categorie of CATEGORIES) {
    writeFileSync(join(SORTIE, nomFichierIndex(categorie)), enJson(index[categorie]));
  }
  writeFileSync(join(SORTIE, NOM_FICHIER_COMPTEURS), enJson(compteurs));
  process.stdout.write(
    `Registre : ${compteurs.total} ressource(s) indexée(s) dans src/generated/registre/\n`,
  );
}

ecrire();
