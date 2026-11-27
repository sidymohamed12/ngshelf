import { FILTRES_VIDES, FiltresCatalogue } from '@core/registre/filtres';
import { cheminCanonique } from './canonique';

function filtres(partiel: Partial<FiltresCatalogue>): FiltresCatalogue {
  return { ...FILTRES_VIDES, ...partiel };
}

describe('cheminCanonique (ADR 0012)', () => {
  it('garde le chemin d’une page de chemin, filtres ou non', () => {
    expect(cheminCanonique('/blocs', filtres({ q: 'nav' }))).toBe('/blocs');
    expect(cheminCanonique('/secteurs/restaurant', FILTRES_VIDES)).toBe('/secteurs/restaurant');
  });

  it('renvoie /catalogue sans filtre', () => {
    expect(cheminCanonique('/catalogue', FILTRES_VIDES)).toBe('/catalogue');
  });

  it('pointe /catalogue?c=blocs vers la page /blocs', () => {
    expect(cheminCanonique('/catalogue', filtres({ categorie: 'bloc' }))).toBe('/blocs');
    expect(cheminCanonique('/catalogue', filtres({ categorie: 'design' }))).toBe('/designs');
  });

  it('pointe un type vers sa page de type, et un secteur vers sa page de secteur', () => {
    expect(cheminCanonique('/catalogue', filtres({ categorie: 'bloc', types: ['navbar'] }))).toBe(
      '/blocs/navbar',
    );
    expect(cheminCanonique('/catalogue', filtres({ secteurs: ['restaurant'] }))).toBe(
      '/secteurs/restaurant',
    );
  });

  it('ignore la recherche, le tri et les options pour viser la page de chemin', () => {
    expect(
      cheminCanonique(
        '/catalogue',
        filtres({ categorie: 'composant', q: 'bouton', animees: true }),
      ),
    ).toBe('/composants');
  });

  it('retombe sur /catalogue quand les filtres ne décrivent aucune page de chemin', () => {
    expect(cheminCanonique('/catalogue', filtres({ secteurs: ['restaurant', 'voyage'] }))).toBe(
      '/catalogue',
    );
    expect(
      cheminCanonique('/catalogue', filtres({ categorie: 'bloc', secteurs: ['restaurant'] })),
    ).toBe('/catalogue');
    expect(
      cheminCanonique('/catalogue', filtres({ types: ['navbar'], secteurs: ['restaurant'] })),
    ).toBe('/catalogue');
  });
});
