import { SITE } from '@core/config/site.config';
import { TEXTES, libelleCompte } from './textes.fr';

describe('textes français', () => {
  it('insère le nom du site dans les textes qui le portent', () => {
    expect(TEXTES.pages.accueil.titrePage).toContain(SITE.nom);
    expect(TEXTES.pied.marque).toContain(`${SITE.nom} est un projet indépendant`);
    expect(TEXTES.commun.accueilDe).toBe(`Accueil de ${SITE.nom}`);
  });

  it('insère les paramètres des textes à trous', () => {
    expect(TEXTES.theme.bouton('sombre')).toBe('Thème du site : sombre');
    expect(TEXTES.pages.ressource.titrePage('Interrupteur')).toBe(`Interrupteur — ${SITE.nom}`);
  });

  it('accorde le nombre de ressources : le zéro est singulier', () => {
    expect(libelleCompte(0)).toBe('0 ressource');
    expect(libelleCompte(1)).toBe('1 ressource');
    expect(libelleCompte(7)).toBe('7 ressources');
  });

  it('annonce le nombre de résultats de la recherche et la requête sans résultat', () => {
    expect(TEXTES.recherche.annonce(1)).toBe('1 résultat');
    expect(TEXTES.recherche.annonce(3)).toBe('3 résultats');
    expect(TEXTES.recherche.videTitre('zz')).toBe('Aucune ressource ne correspond à « zz »');
    expect(TEXTES.recherche.voirTous('Composants', 7)).toBe('Voir tout : Composants (7)');
  });
});
