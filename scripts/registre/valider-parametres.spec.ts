import { validerParametres } from './valider-parametres.ts';

const LIBELLE = { fr: 'Libellé' };
const FICHE = JSON.stringify({
  usage: '<ngs-x />',
  api: [
    { nom: 'orientation', type: 'input<string>()', defaut: "'a'", role: 'x' },
    { nom: 'hauteur / espace', type: 'input<number>()', defaut: '1', role: 'x' },
    { nom: 'legendes', type: 'input<boolean>()', defaut: 'true', role: 'x' },
  ],
});
const FICHIERS = { 'fiche.json': FICHE };

const CHOIX = {
  nom: 'orientation',
  genre: 'choix',
  libelle: LIBELLE,
  options: [
    { valeur: 'horizontal', libelle: LIBELLE },
    { valeur: 'vertical', libelle: LIBELLE },
  ],
  defaut: 'horizontal',
};
const NOMBRE = {
  nom: 'hauteur',
  genre: 'nombre',
  libelle: LIBELLE,
  min: 200,
  max: 600,
  pas: 20,
  defaut: 400,
  unite: 'px',
};
const INTERRUPTEUR = { nom: 'legendes', genre: 'interrupteur', libelle: LIBELLE, defaut: true };

describe('validerParametres', () => {
  it('accepte l’absence de paramètres et une définition complète', () => {
    expect(validerParametres(undefined, FICHIERS)).toEqual([]);
    expect(validerParametres([CHOIX, NOMBRE, INTERRUPTEUR], FICHIERS)).toEqual([]);
  });

  it('refuse une liste vide ou qui n’est pas une liste', () => {
    expect(validerParametres([], FICHIERS)).toHaveLength(1);
    expect(validerParametres({}, FICHIERS)).toHaveLength(1);
  });

  it('refuse un paramètre absent du tableau « Paramètres » de la fiche', () => {
    const erreurs = validerParametres([{ ...INTERRUPTEUR, nom: 'inconnu' }], FICHIERS);
    expect(erreurs.join()).toContain('absent du tableau');
  });

  it('refuse un nom en double et un nom mal formé', () => {
    expect(validerParametres([INTERRUPTEUR, INTERRUPTEUR], FICHIERS).join()).toContain('en double');
    expect(validerParametres([{ ...INTERRUPTEUR, nom: 'Mal-forme' }], FICHIERS).join()).toContain(
      'camelCase',
    );
  });

  it('refuse un choix à une seule option, doublonné ou au défaut hors liste', () => {
    expect(validerParametres([{ ...CHOIX, options: [CHOIX.options[0]] }], FICHIERS)).not.toEqual(
      [],
    );
    expect(
      validerParametres(
        [{ ...CHOIX, options: [CHOIX.options[0], CHOIX.options[0]] }],
        FICHIERS,
      ).join(),
    ).toContain('en double');
    expect(validerParametres([{ ...CHOIX, defaut: 'diagonale' }], FICHIERS).join()).toContain(
      'défaut hors',
    );
  });

  it('refuse un nombre aux bornes, au pas ou au défaut incohérents', () => {
    expect(validerParametres([{ ...NOMBRE, min: 700 }], FICHIERS).join()).toContain('inférieur');
    expect(validerParametres([{ ...NOMBRE, pas: 0 }], FICHIERS).join()).toContain('positif');
    expect(validerParametres([{ ...NOMBRE, defaut: 900 }], FICHIERS).join()).toContain(
      'défaut hors',
    );
    expect(validerParametres([{ ...NOMBRE, max: Number.NaN }], FICHIERS)).not.toEqual([]);
  });

  it('refuse un interrupteur au défaut non booléen et un champ inconnu', () => {
    expect(validerParametres([{ ...INTERRUPTEUR, defaut: 'oui' }], FICHIERS)).not.toEqual([]);
    expect(validerParametres([{ ...INTERRUPTEUR, min: 1 }], FICHIERS).join()).toContain(
      'champ inconnu',
    );
  });

  it('refuse un genre inconnu', () => {
    expect(validerParametres([{ ...CHOIX, genre: 'couleur' }], FICHIERS).join()).toContain('genre');
  });
});
