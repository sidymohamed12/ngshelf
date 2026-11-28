import { EntreeIndex } from '@shared/models/index-catalogue.model';
import composants from '@generated/registre/index-composant.json';
import blocs from '@generated/registre/index-bloc.json';
import designs from '@generated/registre/index-design.json';
import {
  DESIGNS_ACCUEIL,
  DISPOSITION_PLANCHE,
  PIECES_HERO,
  SLUGS_FAMILLES,
  estDesignAccueil,
} from './accueil.donnees';

const REGISTRE = [...composants, ...blocs, ...designs] as unknown as readonly EntreeIndex[];

describe("données de l'accueil", () => {
  it('pose dans la vitrine des pièces qui existent dans le registre, avec leur vrai type', () => {
    for (const piece of Object.values(PIECES_HERO)) {
      const entree = REGISTRE.find((e) => e.slug === piece.slug);
      expect(entree?.categorie).toBe(piece.categorie);
      expect(entree?.type).toBe(piece.type);
    }
  });

  it('ne compose la planche et les familles que de ressources du registre', () => {
    const slugs = new Set(REGISTRE.map((e) => e.slug));
    for (const { slug } of DISPOSITION_PLANCHE) expect(slugs.has(slug)).toBe(true);
    for (const liste of Object.values(SLUGS_FAMILLES)) {
      for (const slug of liste) expect(slugs.has(slug)).toBe(true);
    }
  });

  it('reconnaît les trois designs du catalogue et eux seuls', () => {
    expect(DESIGNS_ACCUEIL.every(estDesignAccueil)).toBe(true);
    expect(estDesignAccueil('inconnu')).toBe(false);
    const slugsDesigns = REGISTRE.filter((e) => e.categorie === 'design').map((e) => e.slug);
    expect([...slugsDesigns].sort()).toEqual([...DESIGNS_ACCUEIL].sort());
  });
});
