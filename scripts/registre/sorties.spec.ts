import { enJson, construireSorties, nomFichierIndex } from './sorties.ts';
import type { MetaRegistre } from './valider.ts';
import type { EntreeIndex } from '../../src/app/shared/models/index-catalogue.model.ts';
import type { Motion } from '../../src/app/shared/models/motion.model.ts';
import type { MetaDesign, MetaRessource } from '../../src/app/shared/models/ressource.model.ts';

const MOTION: Motion = {
  resume: { fr: 'La carte glisse en entrant.' },
  moments: ['entree'],
  technique: '@keyframes CSS',
};

const BASE = {
  schema: 1,
  description: { fr: 'Description' },
  tags: [],
  contratTokens: 1,
  licence: 'MIT',
  ajouteLe: '2026-11-26',
} as const;

function ressource(partiel: Partial<MetaRessource> & Pick<MetaRessource, 'slug'>): MetaRessource {
  return {
    ...BASE,
    categorie: 'composant',
    type: 'carte',
    titre: { fr: partiel.slug },
    secteurs: [],
    variantes: ['tailwind', 'css'],
    angularMin: '22.0',
    auteur: { nom: 'Sidy' },
    statut: 'publie',
    dependances: { npm: [], ressources: [] },
    motion: null,
    ...partiel,
  };
}

const DESIGN: MetaDesign = {
  ...BASE,
  slug: 'fleuve',
  categorie: 'design',
  titre: { fr: 'Design Fleuve' },
  secteurs: [],
  valeurs: { clair: {} },
  statut: 'provisoire',
};

const METAS: readonly MetaRegistre[] = [
  ressource({
    slug: 'zebre',
    titre: { fr: 'Zèbre' },
    secteurs: ['voyage'],
    motion: MOTION,
  }),
  ressource({
    slug: 'abeille',
    titre: { fr: 'Éléphant' },
    type: 'bouton',
    secteurs: ['voyage', 'sport'],
  }),
  ressource({ slug: 'ancienne', statut: 'deprecie', secteurs: ['voyage'] }),
  ressource({ slug: 'nav', categorie: 'bloc', type: 'navbar', titre: { fr: 'Navigation' } }),
  DESIGN,
];

describe('construireSorties', () => {
  const sorties = construireSorties(METAS);

  it('produit un index par catégorie, même vide, trié par titre puis slug', () => {
    expect(Object.keys(sorties.index)).toEqual(['composant', 'bloc', 'template', 'design']);
    expect(sorties.index.composant.map((e) => e.slug)).toEqual(['ancienne', 'abeille', 'zebre']);
    expect(sorties.index.template).toEqual([]);
  });

  it('ne garde dans l’index que les champs utiles aux listes et à la recherche', () => {
    const [entree] = sorties.index.design;
    expect(entree).toEqual({
      slug: 'fleuve',
      categorie: 'design',
      type: null,
      titre: { fr: 'Design Fleuve' },
      description: { fr: 'Description' },
      secteurs: [],
      tags: [],
      contratTokens: 1,
      animee: false,
      statut: 'provisoire',
      ajouteLe: '2026-11-26',
    });
  });

  it('compte par catégorie, type et secteur, sans les ressources dépréciées', () => {
    expect(sorties.compteurs).toEqual({
      total: 4,
      categories: { composant: 2, bloc: 1, template: 0, design: 1 },
      types: { carte: 1, bouton: 1, navbar: 1 },
      secteurs: { voyage: 2, sport: 1 },
      options: { reglables: 4, animees: 1 },
    });
  });

  it('dérive animée de motion et renseigne toujours la taille de case dans l’index', () => {
    const parSlug = (slug: string): EntreeIndex | undefined =>
      sorties.index.composant.find((e) => e.slug === slug);
    expect(parSlug('zebre')).toMatchObject({ animee: true });
    expect(parSlug('abeille')).toMatchObject({ animee: false });
  });

  it('reporte le premier design mis en avant dans l’index, et seulement s’il existe', () => {
    const avec = ressource({ slug: 'vedette', designsMisEnAvant: ['fleuve', 'planche'] });
    const index = construireSorties([avec, ...METAS]).index.composant;
    expect(index.find((e) => e.slug === 'vedette')?.designMisEnAvant).toBe('fleuve');
    expect('designMisEnAvant' in (index.find((e) => e.slug === 'zebre') ?? {})).toBe(false);
  });

  it('ne compte pas comme réglable une ressource hors contrat', () => {
    const horsContrat = ressource({ slug: 'libre', contratTokens: null });
    expect(construireSorties([horsContrat, ...METAS]).compteurs.options.reglables).toBe(4);
  });

  it('est déterministe : même registre dans un autre ordre, mêmes sorties', () => {
    const inverse = construireSorties([...METAS].reverse());
    expect(enJson(inverse.index)).toBe(enJson(sorties.index));
  });
});

describe('enJson et nomFichierIndex', () => {
  it('indente de 2 espaces et termine par un retour à la ligne', () => {
    expect(enJson({ a: 1 })).toBe('{\n  "a": 1\n}\n');
  });

  it('nomme le fichier d’index par catégorie', () => {
    expect(nomFichierIndex('bloc')).toBe('index-bloc.json');
  });
});
