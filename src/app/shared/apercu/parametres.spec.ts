import type { ParametreReglable } from '../models/parametre.model';
import {
  filtrerParametresBruts,
  parametresDepuisRecherche,
  parametresParDefaut,
  parametresVersRecherche,
  resoudreParametres,
} from './parametres';

const LIBELLE = { fr: 'x' };
const DEFINITIONS: readonly ParametreReglable[] = [
  {
    nom: 'orientation',
    genre: 'choix',
    libelle: LIBELLE,
    options: [
      { valeur: 'horizontal', libelle: LIBELLE },
      { valeur: 'vertical', libelle: LIBELLE },
    ],
    defaut: 'horizontal',
  },
  { nom: 'hauteur', genre: 'nombre', libelle: LIBELLE, min: 200, max: 600, pas: 20, defaut: 400 },
  { nom: 'legendes', genre: 'interrupteur', libelle: LIBELLE, defaut: true },
];

describe('filtrerParametresBruts', () => {
  it('garde les noms simples et les valeurs scalaires courtes', () => {
    expect(filtrerParametresBruts({ a: 1, b: 'x', c: true })).toEqual({ a: 1, b: 'x', c: true });
  });

  it.each([
    ['nom avec tiret', { 'a-b': 1 }],
    ['nom commençant par un chiffre', { '1a': 1 }],
    ['nom prototype', { __proto__x: 1 }],
    ['valeur nulle', { a: null }],
    ['valeur objet', { a: { b: 1 } }],
    ['nombre infini', { a: Infinity }],
    ['texte trop long', { a: 'x'.repeat(41) }],
  ])('écarte : %s', (_cas, brut) => {
    expect(filtrerParametresBruts(brut)).toEqual({});
  });

  it('plafonne le nombre d’entrées et refuse ce qui n’est pas un objet', () => {
    const beaucoup = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`p${i}`, i]));
    expect(Object.keys(filtrerParametresBruts(beaucoup))).toHaveLength(16);
    expect(filtrerParametresBruts(null)).toEqual({});
    expect(filtrerParametresBruts([1])).toEqual({});
  });
});

describe('resoudreParametres', () => {
  it('retombe sur les défauts sans valeur', () => {
    expect(resoudreParametres(DEFINITIONS, {})).toEqual(parametresParDefaut(DEFINITIONS));
    expect(resoudreParametres(DEFINITIONS, null)).toEqual({
      orientation: 'horizontal',
      hauteur: 400,
      legendes: true,
    });
  });

  it('retient les valeurs valides', () => {
    expect(
      resoudreParametres(DEFINITIONS, { orientation: 'vertical', hauteur: 260, legendes: false }),
    ).toEqual({ orientation: 'vertical', hauteur: 260, legendes: false });
  });

  it('refuse un choix hors liste, un mauvais type et un nom inconnu', () => {
    const resolu = resoudreParametres(DEFINITIONS, {
      orientation: 'diagonale',
      hauteur: '300',
      legendes: 'oui',
      intrus: 'x',
    });
    expect(resolu).toEqual({ orientation: 'horizontal', hauteur: 400, legendes: true });
    expect('intrus' in resolu).toBe(false);
  });

  it('borne et aligne les nombres sur le pas', () => {
    expect(resoudreParametres(DEFINITIONS, { hauteur: 5000 })['hauteur']).toBe(600);
    expect(resoudreParametres(DEFINITIONS, { hauteur: -3 })['hauteur']).toBe(200);
    expect(resoudreParametres(DEFINITIONS, { hauteur: 311 })['hauteur']).toBe(320);
    expect(resoudreParametres(DEFINITIONS, { hauteur: Number.NaN })['hauteur']).toBe(400);
  });
});

describe('paramètres et URL', () => {
  it('relit les paramètres de l’URL en reconstituant les types', () => {
    expect(
      parametresDepuisRecherche(DEFINITIONS, '?p.orientation=vertical&p.hauteur=240&p.legendes=0'),
    ).toEqual({ orientation: 'vertical', hauteur: 240, legendes: false });
  });

  it('ignore une valeur invalide de l’URL', () => {
    expect(parametresDepuisRecherche(DEFINITIONS, '?p.orientation=x&p.hauteur=abc')).toEqual({
      orientation: 'horizontal',
      hauteur: 400,
      legendes: true,
    });
  });

  it('n’écrit dans l’URL que ce qui diffère du défaut', () => {
    const url = new URLSearchParams();
    parametresVersRecherche(
      DEFINITIONS,
      { orientation: 'vertical', hauteur: 400, legendes: false },
      url,
    );
    expect(url.toString()).toBe('p.orientation=vertical&p.legendes=0');
  });
});
