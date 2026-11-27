import { EntreeIndex } from '@shared/models/index-catalogue.model';
import {
  FILTRES_VIDES,
  FiltresCatalogue,
  aDesParametres,
  appliquerPortee,
  avecCategorie,
  avecSecteur,
  avecType,
  categorieDuType,
  compterFacettes,
  correspond,
  facettesDepuisCompteurs,
  filtrer,
  filtresActifs,
  lireFiltres,
  sansFiltre,
  sansFiltres,
  trier,
  typesProposes,
  versParametres,
} from './filtres';

function entree(partiel: Partial<EntreeIndex> & Pick<EntreeIndex, 'slug'>): EntreeIndex {
  return {
    categorie: 'composant',
    type: 'carte',
    titre: { fr: partiel.slug },
    description: { fr: 'Description' },
    secteurs: [],
    tags: [],
    contratTokens: 1,
    animee: false,
    tailleCase: 'normale',
    statut: 'publie',
    ajouteLe: '2026-01-01',
    ...partiel,
  };
}

const ENTREES: readonly EntreeIndex[] = [
  entree({ slug: 'carte-voyage', secteurs: ['voyage'], animee: true, ajouteLe: '2026-03-01' }),
  entree({ slug: 'bouton', type: 'bouton', ajouteLe: '2026-02-01' }),
  entree({ slug: 'champ-libre', type: 'champ', contratTokens: null, ajouteLe: '2026-02-01' }),
  entree({
    slug: 'navbar-resto',
    categorie: 'bloc',
    type: 'navbar',
    secteurs: ['restaurant', 'voyage'],
    animee: true,
    titre: { fr: 'Éclair' },
    ajouteLe: '2026-01-15',
  }),
  entree({ slug: 'fleuve', categorie: 'design', type: null, ajouteLe: '2026-01-10' }),
];

const lire = (requete: string, portee = {}): FiltresCatalogue =>
  lireFiltres(new URLSearchParams(requete), portee);
const slugs = (liste: readonly EntreeIndex[]): string[] => liste.map((e) => e.slug);

describe('lireFiltres', () => {
  it('lit tous les paramètres de la maquette', () => {
    expect(
      lire(
        'c=composants&type=bouton,carte&secteur=voyage&q=%20date%20&tri=az&reglables=1&animees=1',
      ),
    ).toEqual({
      categorie: 'composant',
      types: ['bouton', 'carte'],
      secteurs: ['voyage'],
      q: 'date',
      tri: 'az',
      reglables: true,
      animees: true,
    });
  });

  it('donne les filtres vides pour une URL sans paramètre', () => {
    expect(lire('')).toEqual(FILTRES_VIDES);
  });

  it('ignore ce qui est inconnu ou mal formé au lieu d’échouer', () => {
    expect(
      lire('c=chaises&type=zzz,carte&secteur=lune&tri=hasard&reglables=oui&animees=0'),
    ).toEqual({ ...FILTRES_VIDES, types: ['carte'] });
  });

  it('écarte les types qui ne sont pas de la catégorie choisie', () => {
    expect(lire('c=blocs&type=navbar,bouton').types).toEqual(['navbar']);
    expect(lire('c=designs&type=navbar').types).toEqual([]);
    expect(lire('type=navbar,bouton,navbar').types).toEqual(['navbar', 'bouton']);
  });

  it('impose les axes de la page, quoi que dise l’URL', () => {
    expect(lire('c=blocs&secteur=voyage', { categorie: 'composant' })).toMatchObject({
      categorie: 'composant',
      secteurs: ['voyage'],
    });
    expect(lire('c=blocs&type=hero', { type: 'carte' })).toMatchObject({
      categorie: 'composant',
      types: ['carte'],
    });
    expect(lire('secteur=voyage', { secteur: 'restaurant' }).secteurs).toEqual(['restaurant']);
  });
});

describe('versParametres', () => {
  it('ne produit que des valeurs nulles pour les filtres par défaut', () => {
    expect(Object.values(versParametres(FILTRES_VIDES)).every((v) => v === null)).toBe(true);
    expect(aDesParametres(FILTRES_VIDES)).toBe(false);
  });

  it('écrit les filtres actifs, dans le format que lireFiltres relit', () => {
    const filtres: FiltresCatalogue = {
      categorie: 'bloc',
      types: ['hero', 'navbar'],
      secteurs: ['restaurant', 'voyage'],
      q: 'photo',
      tri: 'az',
      reglables: true,
      animees: true,
    };
    const parametres = versParametres(filtres);
    expect(parametres).toEqual({
      c: 'blocs',
      type: 'hero,navbar',
      secteur: 'restaurant,voyage',
      q: 'photo',
      tri: 'az',
      reglables: '1',
      animees: '1',
    });
    const url = new URLSearchParams(
      Object.entries(parametres).flatMap(([k, v]) => (v === null ? [] : [[k, v]])),
    );
    expect(lireFiltres(url)).toEqual(filtres);
    expect(aDesParametres(filtres)).toBe(true);
  });

  it('n’écrit jamais les axes imposés par la page (déjà dans le chemin)', () => {
    const portee = { type: 'navbar', secteur: 'restaurant' } as const;
    const filtres = lire('q=menu', portee);
    expect(versParametres(filtres, portee)).toMatchObject({
      c: null,
      type: null,
      secteur: null,
      q: 'menu',
    });
    expect(aDesParametres(lire('', portee), portee)).toBe(false);
  });

  it('compte le tri seul comme un paramètre : l’URL n’est plus celle de la page prérendue', () => {
    expect(aDesParametres({ ...FILTRES_VIDES, tri: 'az' })).toBe(true);
  });
});

describe('modification des filtres', () => {
  it('retire les types d’une autre catégorie quand on change de catégorie', () => {
    const filtres = { ...FILTRES_VIDES, types: ['bouton', 'navbar'] } as const;
    expect(avecCategorie(filtres, 'bloc').types).toEqual(['navbar']);
    expect(avecCategorie(filtres, 'design').types).toEqual([]);
    expect(avecCategorie({ ...filtres, categorie: 'bloc' }, null).types).toEqual([
      'bouton',
      'navbar',
    ]);
  });

  it('coche et décoche un type ou un secteur sans doublon', () => {
    let filtres = avecType(FILTRES_VIDES, 'carte', true);
    filtres = avecType(filtres, 'carte', true);
    filtres = avecSecteur(filtres, 'voyage', true);
    expect(filtres).toMatchObject({ types: ['carte'], secteurs: ['voyage'] });
    expect(avecType(filtres, 'carte', false).types).toEqual([]);
    expect(avecSecteur(filtres, 'voyage', false).secteurs).toEqual([]);
  });

  it('retire un filtre actif, ou tous sauf le tri et les axes de la page', () => {
    const filtres: FiltresCatalogue = {
      ...FILTRES_VIDES,
      categorie: 'composant',
      types: ['bouton'],
      secteurs: ['voyage'],
      q: 'x',
      tri: 'az',
      animees: true,
    };
    expect(filtresActifs(filtres)).toEqual([
      { axe: 'categorie', valeur: 'composant' },
      { axe: 'type', valeur: 'bouton' },
      { axe: 'secteur', valeur: 'voyage' },
      { axe: 'animees' },
      { axe: 'q' },
    ]);
    expect(sansFiltre(filtres, { axe: 'type', valeur: 'bouton' }).types).toEqual([]);
    expect(sansFiltre(filtres, { axe: 'q' }).q).toBe('');
    expect(sansFiltre(filtres, { axe: 'animees' }).animees).toBe(false);
    expect(sansFiltres(filtres)).toEqual({ ...FILTRES_VIDES, tri: 'az' });
    expect(sansFiltres(filtres, { secteur: 'voyage' }).secteurs).toEqual(['voyage']);
  });

  it('ne propose pas comme puces les axes imposés par la page', () => {
    const portee = { categorie: 'composant', secteur: 'voyage' } as const;
    const filtres = appliquerPortee({ ...FILTRES_VIDES, types: ['carte'] }, portee);
    expect(filtresActifs(filtres, portee)).toEqual([{ axe: 'type', valeur: 'carte' }]);
  });
});

describe('taxonomie des filtres', () => {
  it('retrouve la catégorie d’un type et les types proposés', () => {
    expect(categorieDuType('navbar')).toBe('bloc');
    expect(typesProposes('design')).toEqual([]);
    expect(typesProposes('bloc')).toContain('hero');
    expect(typesProposes(null)).toContain('bouton');
    expect(typesProposes(null)).toContain('landing');
  });
});

describe('correspond et filtrer', () => {
  it('combine les axes : tous doivent passer, les valeurs d’un même axe sont alternatives', () => {
    const voyage = { ...FILTRES_VIDES, secteurs: ['voyage'] } as const;
    expect(slugs(filtrer(ENTREES, voyage))).toEqual(['carte-voyage', 'navbar-resto']);
    const composantsVoyage = { ...voyage, categorie: 'composant' } as const;
    expect(slugs(filtrer(ENTREES, composantsVoyage))).toEqual(['carte-voyage']);
    const deuxTypes = { ...FILTRES_VIDES, types: ['bouton', 'navbar'] } as const;
    expect(slugs(filtrer(ENTREES, deuxTypes))).toEqual(['bouton', 'navbar-resto']);
  });

  it('filtre les ressources animées et réglables', () => {
    expect(slugs(filtrer(ENTREES, { ...FILTRES_VIDES, animees: true }))).toEqual([
      'carte-voyage',
      'navbar-resto',
    ]);
    const reglables = filtrer(ENTREES, { ...FILTRES_VIDES, reglables: true });
    expect(slugs(reglables)).not.toContain('champ-libre');
    expect(reglables).toHaveLength(4);
  });

  it('exclut un design dès qu’un type est choisi (il n’en a pas)', () => {
    expect(slugs(filtrer(ENTREES, { ...FILTRES_VIDES, types: ['carte'] }))).toEqual([
      'carte-voyage',
    ]);
  });

  it('laisse de côté l’axe demandé', () => {
    const filtres = { ...FILTRES_VIDES, categorie: 'bloc', animees: true } as const;
    expect(correspond(ENTREES[0], filtres)).toBe(false);
    expect(correspond(ENTREES[0], filtres, 'categorie')).toBe(true);
    expect(correspond(ENTREES[1], filtres, 'animees')).toBe(false);
  });

  it('trie par date décroissante en gardant l’ordre de l’index à date égale, ou de A à Z', () => {
    expect(slugs(trier(ENTREES, 'recent'))).toEqual([
      'carte-voyage',
      'bouton',
      'champ-libre',
      'navbar-resto',
      'fleuve',
    ]);
    expect(slugs(trier(ENTREES, 'az'))).toEqual([
      'bouton',
      'carte-voyage',
      'champ-libre',
      'navbar-resto',
      'fleuve',
    ]);
  });

  it('ne modifie pas la liste qu’on lui donne', () => {
    const copie = [...ENTREES];
    trier(ENTREES, 'az');
    expect(ENTREES).toEqual(copie);
  });
});

describe('compterFacettes', () => {
  it('compte chaque facette avec tous les autres filtres, pas le sien', () => {
    const filtres = { ...FILTRES_VIDES, categorie: 'composant', secteurs: ['voyage'] } as const;
    const facettes = compterFacettes(ENTREES, filtres);
    // catégories : le secteur est appliqué, la catégorie non
    expect(facettes.categories).toEqual({ composant: 1, bloc: 1 });
    expect(facettes.total).toBe(2);
    // types : la catégorie et le secteur sont appliqués
    expect(facettes.types).toEqual({ carte: 1 });
    // secteurs : la catégorie est appliquée, le secteur non
    expect(facettes.secteurs).toEqual({ voyage: 1 });
  });

  it('compte les options sans compter celle qu’on est en train de régler', () => {
    const facettes = compterFacettes(ENTREES, { ...FILTRES_VIDES, animees: true });
    expect(facettes.options).toEqual({ reglables: 2, animees: 2 });
    expect(compterFacettes(ENTREES, FILTRES_VIDES).options).toEqual({ reglables: 4, animees: 2 });
  });

  it('n’a aucune ressource à compter sans entrée', () => {
    expect(compterFacettes([], FILTRES_VIDES)).toEqual({
      total: 0,
      categories: {},
      types: {},
      secteurs: {},
      options: { reglables: 0, animees: 0 },
    });
  });

  it('reprend les compteurs globaux tant que l’index n’est pas chargé', () => {
    const globaux = {
      total: 3,
      categories: { composant: 3, bloc: 0, template: 0, design: 0 },
      types: { carte: 3 },
      secteurs: {},
      options: { reglables: 3, animees: 1 },
    };
    expect(facettesDepuisCompteurs(globaux)).toEqual(globaux);
  });
});
