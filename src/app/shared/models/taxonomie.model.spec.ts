import { LIBELLES_CATEGORIE, LIBELLES_SECTEUR, LIBELLES_TYPE } from '@core/i18n/textes.fr';
import { CATEGORIES, SECTEURS, SEGMENT_CATEGORIE, TYPES_PAR_CATEGORIE } from './taxonomie.model';

describe('taxonomie', () => {
  const types = Object.values(TYPES_PAR_CATEGORIE).flat();

  it('donne un libellé français à chaque catégorie, type et secteur', () => {
    for (const c of CATEGORIES) {
      expect(LIBELLES_CATEGORIE[c].pluriel).not.toBe('');
      expect(LIBELLES_CATEGORIE[c].singulier).not.toBe('');
    }
    for (const t of types) expect(LIBELLES_TYPE[t], t).toBeTruthy();
    for (const s of SECTEURS) expect(LIBELLES_SECTEUR[s], s).toBeTruthy();
  });

  it("n'a aucun type en double : un type appartient à une seule catégorie", () => {
    expect(new Set(types).size).toBe(types.length);
  });

  it('a un segment d’URL distinct par catégorie', () => {
    const segments = Object.values(SEGMENT_CATEGORIE);
    expect(new Set(segments).size).toBe(CATEGORIES.length);
  });
});
