import { InstantaneRoute, cheminDePage, doitSauter } from './transitions';

function route(chemin: string, enfant: InstantaneRoute | null = null): InstantaneRoute {
  const segments = chemin === '' ? [] : chemin.split('/').map((path) => ({ path }));
  return { url: segments, firstChild: enfant };
}

/** Layout vide (path ''), puis la page : la forme réelle de app.routes.ts. */
function page(chemin: string): InstantaneRoute {
  return route('', route(chemin));
}

describe('transitions de page (ADR 0011)', () => {
  it('lit le chemin de toute la chaîne de routes, sans paramètres d’URL', () => {
    expect(cheminDePage(page('composants/bouton/boutons'))).toBe('composants/bouton/boutons');
    expect(cheminDePage(page('catalogue'))).toBe('catalogue');
    expect(cheminDePage(route('', null))).toBe('');
  });

  it('saute la transition quand seuls les paramètres changent (même chemin)', () => {
    expect(
      doitSauter({ mouvementReduit: false, de: page('catalogue'), vers: page('catalogue') }),
    ).toBe(true);
  });

  it('saute la transition en mouvement réduit, quelle que soit la page', () => {
    expect(
      doitSauter({ mouvementReduit: true, de: page('catalogue'), vers: page('a-propos') }),
    ).toBe(true);
  });

  it('joue la transition entre deux pages différentes', () => {
    expect(
      doitSauter({
        mouvementReduit: false,
        de: page('composants'),
        vers: page('composants/bouton/boutons'),
      }),
    ).toBe(false);
  });
});
