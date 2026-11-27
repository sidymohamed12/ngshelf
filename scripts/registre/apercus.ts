import type { ParametreReglable } from '../../src/app/shared/models/parametre.model.ts';
import { genererTokensCss } from '../../src/app/shared/livraison/livraison.ts';
import type { DesignContrat } from '../../src/app/shared/livraison/livraison.ts';
import type { FichiersRessource } from './sources.ts';
import { fichiersVariante } from './sources.ts';

/**
 * Sources de l'application d'aperçus (ADR 0003, 0008, 0010), assemblées depuis le registre : pour chaque
 * ressource, EXACTEMENT les fichiers de la variante Tailwind que le visiteur copie, plus la scène de
 * démonstration (`demo/`, jamais livrée). L'aperçu prouve donc ce qui est copié. Fonction pure : le
 * chemin relatif de chaque fichier vers son contenu.
 */

export interface RessourceApercu {
  readonly slug: string;
  readonly avecMotion: boolean;
  /** Paramètres réglables du meta.json (ADR 0014) : la liste blanche de l'aperçu. */
  readonly parametres?: readonly ParametreReglable[];
  readonly fichiers: FichiersRessource;
}

export const FICHIER_SCENE = 'demo/demo.component.ts';
const PREFIXE_DEMO = 'demo/';

function scenes(ressources: readonly RessourceApercu[]): string {
  const slugs = ressources.map((r) => r.slug).sort();
  const parametres = ressources
    .filter((r) => (r.parametres?.length ?? 0) > 0)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((r) => `  '${r.slug}': ${JSON.stringify(r.parametres)},`);
  const entrees = slugs.map(
    (slug) =>
      `  '${slug}': () => import('./${slug}/demo/demo.component').then((m) => m.DemoComponent),`,
  );
  return [
    '// Généré par scripts/registre : ne pas modifier.',
    "import type { Type } from '@angular/core';",
    "import type { ParametreReglable } from '@shared/models/parametre.model';",
    '',
    `export const SLUGS_APERCUS = [${slugs.map((s) => `'${s}'`).join(', ')}] as const;`,
    '',
    'export type SlugApercu = (typeof SLUGS_APERCUS)[number];',
    '',
    'export const SCENES_APERCUS: Record<SlugApercu, () => Promise<Type<unknown>>> = {',
    ...entrees,
    '};',
    '',
    '/** Paramètres réglables par ressource (meta.json) : la liste blanche des réglages reçus. */',
    'export const PARAMETRES_APERCUS: Readonly<Record<string, readonly ParametreReglable[]>> = {',
    ...parametres,
    '};',
    '',
  ].join('\n');
}

export function construireApercus(
  ressources: readonly RessourceApercu[],
  design: DesignContrat,
  pont: string,
  nomSite: string,
): ReadonlyMap<string, string> {
  const sorties = new Map<string, string>();
  for (const { slug, avecMotion, fichiers } of ressources) {
    for (const fichier of fichiersVariante(fichiers, 'tailwind', avecMotion)) {
      sorties.set(`${slug}/${fichier.nom}`, `${fichier.code}\n`);
    }
    for (const [chemin, contenu] of Object.entries(fichiers)) {
      if (chemin.startsWith(PREFIXE_DEMO)) sorties.set(`${slug}/${chemin}`, contenu);
    }
  }
  sorties.set('scenes.ts', scenes(ressources));
  sorties.set('ngshelf-theme.css', pont);
  sorties.set('tokens.css', genererTokensCss({ nomSite, titreRessource: 'aperçu', design }));
  return sorties;
}
