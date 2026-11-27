import { EntreeIndex } from '@shared/models/index-catalogue.model';
import {
  MAX_PAR_GROUPE,
  chercher,
  filtrerParRequete,
  construireIndexRecherche,
  normaliser,
  segmenter,
} from './recherche';

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
  entree({
    slug: 'calendrier',
    type: 'calendrier',
    titre: { fr: 'Calendrier' },
    description: { fr: 'Choisir une date dans le mois.' },
    tags: ['date', 'réservation'],
  }),
  entree({
    slug: 'champ-email',
    type: 'champ',
    titre: { fr: 'Champ e-mail validé' },
    tags: ['formulaire', 'input'],
  }),
  entree({
    slug: 'navbar-restaurant',
    categorie: 'bloc',
    type: 'navbar',
    titre: { fr: 'Barre de navigation' },
    secteurs: ['restaurant'],
    tags: ['menu'],
  }),
  entree({
    slug: 'fleuve',
    categorie: 'design',
    type: null,
    titre: { fr: 'Design Fleuve' },
    tags: ['mode-sombre', 'thème-visuel'],
  }),
];

const INDEX = construireIndexRecherche(ENTREES);

function slugs(requete: string): string[] {
  return chercher(INDEX, requete).groupes.flatMap((g) => g.entrees.map((e) => e.slug));
}

describe('normaliser', () => {
  it('ignore la casse, les accents, les tirets et les espaces en trop', () => {
    expect(normaliser('  RÉSERVATION  ')).toBe('reservation');
    expect(normaliser('Fil-d’Ariane')).toBe('fil d ariane');
    expect(normaliser('a   b')).toBe('a b');
  });
});

describe('chercher', () => {
  it('renvoie tout, groupé par catégorie dans l’ordre du catalogue, pour une requête vide', () => {
    const { groupes, total } = chercher(INDEX, '   ');
    expect(total).toBe(4);
    expect(groupes.map((g) => g.categorie)).toEqual(['composant', 'bloc', 'design']);
  });

  it('trouve sans tenir compte des accents ni de la casse', () => {
    expect(slugs('reservation')).toEqual(['calendrier']);
    expect(slugs('THEME')).toEqual(['fleuve']);
  });

  it('cherche dans le titre, la description, les tags, le type, le secteur et la catégorie', () => {
    expect(slugs('barre')).toEqual(['navbar-restaurant']);
    expect(slugs('choisir')).toEqual(['calendrier']);
    expect(slugs('input')).toEqual(['champ-email']);
    expect(slugs('navbar')).toEqual(['navbar-restaurant']);
    expect(slugs('restaurant')).toEqual(['navbar-restaurant']);
    expect(slugs('blocs')).toEqual(['navbar-restaurant']);
  });

  it('exige tous les mots de la requête, dans n’importe quel ordre', () => {
    expect(slugs('mois date')).toEqual(['calendrier']);
    expect(slugs('mois menu')).toEqual([]);
  });

  it('trouve un mot d’un tag à tirets', () => {
    expect(slugs('sombre')).toEqual(['fleuve']);
  });

  it('fait remonter les titres qui correspondent avant les autres', () => {
    const index = construireIndexRecherche([
      entree({ slug: 'a', titre: { fr: 'Autre' }, tags: ['carte'] }),
      entree({ slug: 'b', titre: { fr: 'Carte de séjour' } }),
    ]);
    const ordre = chercher(index, 'carte').groupes[0].entrees.map((e) => e.slug);
    expect(ordre).toEqual(['b', 'a']);
  });

  it('ne montre que MAX_PAR_GROUPE résultats par catégorie mais en compte le total', () => {
    const nombreux = Array.from({ length: MAX_PAR_GROUPE + 3 }, (_, i) =>
      entree({ slug: `carte-${i}` }),
    );
    const { groupes } = chercher(construireIndexRecherche(nombreux), '');
    expect(groupes[0].entrees).toHaveLength(MAX_PAR_GROUPE);
    expect(groupes[0].total).toBe(MAX_PAR_GROUPE + 3);
  });

  it('ne renvoie aucun groupe quand rien ne correspond', () => {
    expect(chercher(INDEX, 'zzzz')).toEqual({ groupes: [], total: 0 });
  });
});

describe('filtrerParRequete', () => {
  it('renvoie toutes les ressources, dans l’ordre de l’index, pour une requête vide', () => {
    expect(filtrerParRequete(INDEX, '  ')).toEqual(ENTREES);
  });

  it('renvoie à plat, sans la limite par groupe de la recherche globale, les mieux classées d’abord', () => {
    const dates = filtrerParRequete(INDEX, 'date').map((e) => e.slug);
    expect(dates).toEqual(['calendrier']);
    expect(filtrerParRequete(INDEX, 'rien de tel')).toEqual([]);
  });
});

describe('segmenter', () => {
  it('surligne les mots trouvés en gardant le texte d’origine, accents compris', () => {
    expect(segmenter('Champ e-mail validé', 'valide')).toEqual([
      { texte: 'Champ e-mail ', surligne: false },
      { texte: 'validé', surligne: true },
    ]);
  });

  it('fusionne les mots qui se touchent et surligne plusieurs mots', () => {
    expect(segmenter('Barre de navigation', 'bar nav')).toEqual([
      { texte: 'Bar', surligne: true },
      { texte: 're de ', surligne: false },
      { texte: 'nav', surligne: true },
      { texte: 'igation', surligne: false },
    ]);
    expect(segmenter('abc', 'ab bc')).toEqual([{ texte: 'abc', surligne: true }]);
  });

  it('ne surligne rien sans requête ou sans correspondance', () => {
    expect(segmenter('Calendrier', '')).toEqual([{ texte: 'Calendrier', surligne: false }]);
    expect(segmenter('Calendrier', 'zz')).toEqual([{ texte: 'Calendrier', surligne: false }]);
  });

  it('renvoie le texte tel quel, sans HTML, même s’il contient des chevrons', () => {
    expect(segmenter('<b>x</b>', 'x')).toEqual([
      { texte: '<b>', surligne: false },
      { texte: 'x', surligne: true },
      { texte: '</b>', surligne: false },
    ]);
  });
});
