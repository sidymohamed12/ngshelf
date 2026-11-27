import type {
  FichierAffiche,
  FicheRessource,
  FragmentCode,
} from '../../src/app/shared/models/fiche.model.ts';
import type { DesignContrat, VarianteLivree } from '../../src/app/shared/livraison/livraison.ts';
import {
  genererLicence,
  genererReadme,
  genererTokensCss,
} from '../../src/app/shared/livraison/livraison.ts';
import { creerZip } from '../../src/app/shared/livraison/zip.ts';
import type { MetaDesign, MetaRessource } from '../../src/app/shared/models/ressource.model.ts';
import { colorer } from './colorer.ts';
import type { FichierCode, FichiersRessource } from './sources.ts';
import { fichiersVariante } from './sources.ts';
import { lireDonneesFiche } from './valider-sources.ts';

/**
 * Sorties de livraison du registre (ADR 0002 décision 5, ADR 0008) : une fiche JSON par ressource, le
 * fragment de code de la variante CSS et les deux zips standards. Pures et déterministes : mêmes
 * sources, mêmes octets (la date des zips vient du meta.json).
 */

export interface RessourceSource {
  readonly meta: MetaRessource;
  readonly fichiers: FichiersRessource;
}

export interface ParametresLivraison {
  readonly ressources: readonly RessourceSource[];
  readonly designs: readonly MetaDesign[];
  /** Contenu de src/styles/contrat/ngshelf-theme.css. */
  readonly pont: string;
  readonly nomSite: string;
}

export interface Livraisons {
  /** `<slug>` vers la fiche. */
  readonly fiches: ReadonlyMap<string, FicheRessource>;
  /** `<slug>` vers le fragment de la variante CSS. */
  readonly fragments: ReadonlyMap<string, FragmentCode>;
  /** `<slug>-<variante>.zip` vers l'archive. */
  readonly zips: ReadonlyMap<string, Uint8Array>;
}

const DESIGN_PAR_DEFAUT = 'planche';
const PREFIXE_TITRE_DESIGN = /^Design\s+/;
const NOM_TOKENS = 'tokens.css';
const NOM_PONT = 'ngshelf-theme.css';

function enDesign(meta: MetaDesign): DesignContrat & { readonly slug: string } {
  return {
    slug: meta.slug,
    nom: meta.titre.fr.replace(PREFIXE_TITRE_DESIGN, ''),
    clair: meta.valeurs.clair as DesignContrat['clair'],
    sombre: meta.valeurs.sombre,
  };
}

function enAffiche(fichier: FichierCode): FichierAffiche {
  return { ...fichier, html: colorer(fichier.code, fichier.langage) };
}

function dependances(meta: MetaRessource): string {
  const majeure = meta.angularMin.split('.')[0];
  return `Aucune : seulement Angular ${majeure}`;
}

function dateDuZip(meta: MetaRessource): Date {
  return new Date(`${meta.modifieLe ?? meta.ajouteLe}T00:00:00Z`);
}

function construireZip(
  source: RessourceSource,
  variante: VarianteLivree,
  contexte: { readonly design: DesignContrat; readonly pont: string; readonly nomSite: string },
): Uint8Array {
  const { meta, fichiers } = source;
  const donnees = lireDonneesFiche(fichiers['fiche.json'] ?? '');
  if (typeof donnees === 'string') throw new Error(`${meta.slug} : ${donnees}`);
  const dossier = `${meta.slug}-${variante}`;
  const code = fichiersVariante(fichiers, variante, meta.motion !== null);
  const annexes: { nom: string; contenu: string }[] = [
    {
      nom: NOM_TOKENS,
      contenu: genererTokensCss({
        nomSite: contexte.nomSite,
        titreRessource: meta.titre.fr,
        design: contexte.design,
      }),
    },
  ];
  if (variante === 'tailwind') annexes.push({ nom: NOM_PONT, contenu: contexte.pont });
  annexes.push(
    {
      nom: 'README.md',
      contenu: genererReadme({
        nomSite: contexte.nomSite,
        titre: meta.titre.fr,
        description: meta.description.fr,
        slug: meta.slug,
        variante,
        angularMin: meta.angularMin,
        dependances: dependances(meta),
        usage: donnees.usage,
      }),
    },
    {
      nom: 'LICENSE',
      contenu: genererLicence(
        dateDuZip(meta).getUTCFullYear(),
        `Les contributeurs de ${contexte.nomSite}`,
      ),
    },
  );
  const entrees = [...code.map((f) => ({ nom: f.nom, contenu: `${f.code}\n` })), ...annexes].map(
    (e) => ({ nom: `${dossier}/${e.nom}`, contenu: e.contenu }),
  );
  return creerZip(entrees, dateDuZip(meta));
}

export function construireLivraisons(parametres: ParametresLivraison): Livraisons {
  const designs = parametres.designs.map(enDesign);
  const fiches = new Map<string, FicheRessource>();
  const fragments = new Map<string, FragmentCode>();
  const zips = new Map<string, Uint8Array>();
  for (const source of parametres.ressources) {
    const { meta, fichiers } = source;
    const donnees = lireDonneesFiche(fichiers['fiche.json'] ?? '');
    if (typeof donnees === 'string') throw new Error(`${meta.slug} : ${donnees}`);
    const avecMotion = meta.motion !== null;
    fiches.set(meta.slug, {
      meta,
      usage: donnees.usage,
      api: donnees.api,
      fichiers: fichiersVariante(fichiers, 'tailwind', avecMotion).map(enAffiche),
      pont: parametres.pont,
      designs,
    });
    fragments.set(meta.slug, {
      fichiers: fichiersVariante(fichiers, 'css', avecMotion).map(enAffiche),
    });
    const slugDesign = meta.designsMisEnAvant?.[0] ?? DESIGN_PAR_DEFAUT;
    const design = designs.find((d) => d.slug === slugDesign) ?? designs[0];
    if (design === undefined) throw new Error('aucun design dans le registre');
    for (const variante of ['tailwind', 'css'] as const) {
      zips.set(
        `${meta.slug}-${variante}.zip`,
        construireZip(source, variante, {
          design,
          pont: parametres.pont,
          nomSite: parametres.nomSite,
        }),
      );
    }
  }
  return { fiches, fragments, zips };
}
