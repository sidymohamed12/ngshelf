import blocs from '@generated/registre/index-bloc.json';
import composants from '@generated/registre/index-composant.json';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import {
  DESIGNS,
  PIECES_APESANTEUR,
  PIECES_HABIT,
  PIECE_CALENDRIER,
  PIECE_NOTIFICATIONS,
} from './a-propos.donnees';

const REGISTRE = [...composants, ...blocs] as unknown as readonly EntreeIndex[];

describe('données de « À propos »', () => {
  it('pose des pièces qui existent dans le registre, avec leur vrai type', () => {
    const pieces = [
      ...PIECES_APESANTEUR.map((p) => p.piece),
      ...PIECES_HABIT,
      PIECE_CALENDRIER,
      PIECE_NOTIFICATIONS,
    ];
    for (const piece of pieces) {
      const entree = REGISTRE.find((e) => e.slug === piece.slug);
      expect(entree?.categorie).toBe(piece.categorie);
      expect(entree?.type).toBe(piece.type);
    }
  });

  it('garde cinq pièces dans le hero, chacune avec un départ et une rotation', () => {
    expect(PIECES_APESANTEUR).toHaveLength(5);
    for (const p of PIECES_APESANTEUR) expect(p.depart).toHaveLength(2);
  });

  it('parcourt les trois designs du catalogue', () => {
    expect(DESIGNS).toEqual(['planche', 'fleuve', 'laterite']);
  });
});
