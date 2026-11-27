import { SITE } from '@core/config/site.config';
import { TEXTES } from './textes.fr';

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
});
