import { COMPTEURS } from '@core/registre/registre.donnees';
import { Compteurs } from '@shared/models/index-catalogue.model';
import { SECTEURS, TYPES_PAR_CATEGORIE } from '@shared/models/taxonomie.model';
import { construireMenuCatalogue } from './menu-catalogue';

const COMPTEURS_TEST: Compteurs = {
  total: 5,
  categories: { composant: 3, bloc: 2, template: 0, design: 0 },
  types: { carte: 2, navbar: 2, bouton: 1 },
  secteurs: { restaurant: 2 },
  options: { reglables: 5, animees: 1 },
};

describe('construireMenuCatalogue', () => {
  const menu = construireMenuCatalogue(COMPTEURS_TEST);

  it('liste les quatre familles avec leur compteur, toujours en lien même à zéro', () => {
    expect(menu.familles.map((f) => [f.libelle, f.chemin, f.compte])).toEqual([
      ['Composants', '/composants', 3],
      ['Blocs', '/blocs', 2],
      ['Templates', '/templates', 0],
      ['Designs', '/designs', 0],
    ]);
    expect(menu.familles[0].classe).toBe('ngs-cat-composants');
  });

  it('liste tous les types de composants et de blocs, et ne lie que ceux qui ont une page', () => {
    expect(menu.composants).toHaveLength(TYPES_PAR_CATEGORIE.composant.length);
    expect(menu.blocs).toHaveLength(TYPES_PAR_CATEGORIE.bloc.length);
    const carte = menu.composants.find((l) => l.libelle === 'Carte');
    expect(carte).toMatchObject({ chemin: '/composants/carte', compte: 2 });
    const modale = menu.composants.find((l) => l.libelle === 'Modale');
    expect(modale).toMatchObject({ chemin: null, compte: 0 });
  });

  it('liste tous les secteurs avec leur icône, et ne lie que ceux qui ont une page', () => {
    expect(menu.secteurs).toHaveLength(SECTEURS.length);
    const restaurant = menu.secteurs.find((l) => l.libelle === 'Restaurant');
    expect(restaurant).toMatchObject({
      chemin: '/secteurs/restaurant',
      compte: 2,
      icone: 'fork-knife',
    });
    expect(menu.secteurs.find((l) => l.libelle === 'Voyage')?.chemin).toBeNull();
  });

  it('donne un texte de compteur accordé pour les lecteurs d’écran', () => {
    expect(menu.composants.find((l) => l.libelle === 'Bouton')?.compteTexte).toBe('1 ressource');
    expect(menu.composants.find((l) => l.libelle === 'Carte')?.compteTexte).toBe('2 ressources');
    expect(menu.composants.find((l) => l.libelle === 'Modale')?.compteTexte).toBe('0 ressource');
  });

  it('n’a un lien que vers des pages qui seront prérendues (compteurs du vrai registre)', () => {
    const vrai = construireMenuCatalogue(COMPTEURS);
    for (const ligne of [...vrai.composants, ...vrai.blocs, ...vrai.secteurs]) {
      expect(ligne.chemin !== null).toBe(ligne.compte > 0);
    }
  });
});
