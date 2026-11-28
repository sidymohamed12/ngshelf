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
  /** Titre français et chemin de la fiche : le retour de la page d'aperçu autonome (ADR 0016). */
  readonly titre?: string;
  readonly cheminFiche?: string;
  readonly avecMotion: boolean;
  /** Paramètres réglables du meta.json (ADR 0014) : la liste blanche de l'aperçu. */
  readonly parametres?: readonly ParametreReglable[];
  readonly fichiers: FichiersRessource;
}

/** Un design du registre, tel que l'aperçu autonome le propose. */
export type DesignApercu = DesignContrat & { readonly slug: string };

export const FICHIER_SCENE = 'demo/demo.component.ts';
const PREFIXE_DEMO = 'demo/';

function infos(ressources: readonly RessourceApercu[]): string[] {
  return [...ressources]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((r) => {
      const info = {
        titre: r.titre ?? r.slug,
        fiche: r.cheminFiche ?? '/catalogue',
        animee: r.avecMotion,
      };
      return `  '${r.slug}': ${JSON.stringify(info)},`;
    });
}

function scenes(ressources: readonly RessourceApercu[], designs: readonly DesignApercu[]): string {
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
    "import type { DesignContrat } from '@shared/livraison/livraison';",
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
    '/** Titre et fiche de chaque ressource : en-tête et lien de retour de la page autonome. */',
    'export const INFOS_APERCUS: Readonly<Record<string, { titre: string; fiche: string; animee: boolean }>> = {',
    ...infos(ressources),
    '};',
    '',
    "/** Les designs du registre : choix de la page autonome et valeurs relues de l'URL. */",
    'export const DESIGNS_APERCUS: readonly (DesignContrat & { slug: string })[] = ' +
      `${JSON.stringify(designs)};`,
    '',
  ].join('\n');
}

/** Ce qui est commun à toutes les ressources : design de départ, pont Tailwind, nom du site, designs. */
export interface ContexteApercus {
  readonly design: DesignContrat;
  readonly pont: string;
  readonly nomSite: string;
  readonly designs?: readonly DesignApercu[];
}

export function construireApercus(
  ressources: readonly RessourceApercu[],
  contexte: ContexteApercus,
): ReadonlyMap<string, string> {
  const { design, pont, nomSite, designs = [] } = contexte;
  const sorties = new Map<string, string>();
  for (const { slug, avecMotion, fichiers } of ressources) {
    for (const fichier of fichiersVariante(fichiers, 'tailwind', avecMotion)) {
      sorties.set(`${slug}/${fichier.nom}`, `${fichier.code}\n`);
    }
    for (const [chemin, contenu] of Object.entries(fichiers)) {
      if (chemin.startsWith(PREFIXE_DEMO)) sorties.set(`${slug}/${chemin}`, contenu);
    }
  }
  sorties.set('scenes.ts', scenes(ressources, designs));
  sorties.set('ngshelf-theme.css', pont);
  sorties.set('tokens.css', genererTokensCss({ nomSite, titreRessource: 'aperçu', design }));
  return sorties;
}
