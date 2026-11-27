import { TestBed } from '@angular/core/testing';
import { CookieService } from '@core/cookies/cookie.service';
import { COOKIE_THEME, ThemeService } from './theme.service';

interface FauxMedia {
  matches: boolean;
  declencher(sombre: boolean): void;
}

/** jsdom n'a pas matchMedia : on simule la préférence du système et ses changements. */
function simulerSysteme(sombre: boolean): FauxMedia {
  const ecouteurs = new Set<(e: MediaQueryListEvent) => void>();
  const media: FauxMedia = {
    matches: sombre,
    declencher(valeur) {
      media.matches = valeur;
      ecouteurs.forEach((ecouteur) => ecouteur({ matches: valeur } as MediaQueryListEvent));
    },
  };
  window.matchMedia = vi.fn().mockImplementation(() => ({
    get matches() {
      return media.matches;
    },
    addEventListener: (_: string, e: (ev: MediaQueryListEvent) => void) => ecouteurs.add(e),
    removeEventListener: (_: string, e: (ev: MediaQueryListEvent) => void) => ecouteurs.delete(e),
  }));
  return media;
}

function viderCookieEtAttributs(): void {
  document.cookie = `${COOKIE_THEME}=; Max-Age=0; Path=/`;
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-theme-choix');
}

describe('ThemeService', () => {
  beforeEach(viderCookieEtAttributs);
  afterEach(viderCookieEtAttributs);

  it('démarre en système et en clair avant toute initialisation (état du prérendu)', () => {
    const theme = TestBed.inject(ThemeService);
    expect(theme.choix()).toBe('systeme');
    expect(theme.mode()).toBe('clair');
  });

  it('suit un système clair quand aucun cookie n’existe', () => {
    simulerSysteme(false);
    const theme = TestBed.inject(ThemeService);
    theme.initialiser();
    expect(theme.mode()).toBe('clair');
    expect(document.documentElement.getAttribute('data-theme-choix')).toBe('systeme');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('suit un système sombre, puis ses changements', () => {
    const systeme = simulerSysteme(true);
    const theme = TestBed.inject(ThemeService);
    theme.initialiser();
    expect(theme.mode()).toBe('sombre');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sombre');

    systeme.declencher(false);
    expect(theme.mode()).toBe('clair');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('reprend le choix mémorisé dans le cookie, quel que soit le système', () => {
    simulerSysteme(false);
    TestBed.inject(CookieService).ecrire(COOKIE_THEME, 'sombre');
    const theme = TestBed.inject(ThemeService);
    theme.initialiser();
    expect(theme.choix()).toBe('sombre');
    expect(theme.mode()).toBe('sombre');
  });

  it('ignore un cookie qui n’est pas un choix connu', () => {
    simulerSysteme(false);
    TestBed.inject(CookieService).ecrire(COOKIE_THEME, 'violet');
    const theme = TestBed.inject(ThemeService);
    theme.initialiser();
    expect(theme.choix()).toBe('systeme');
  });

  it('mémorise le choix dans le cookie ngs_theme pour un an et applique le thème', () => {
    simulerSysteme(true);
    const cookies = TestBed.inject(CookieService);
    const ecrire = vi.spyOn(cookies, 'ecrire');
    const theme = TestBed.inject(ThemeService);
    theme.initialiser();

    theme.choisir('clair');
    expect(ecrire).toHaveBeenCalledWith('ngs_theme', 'clair', { dureeSecondes: 31_536_000 });
    expect(cookies.lire(COOKIE_THEME)).toBe('clair');
    expect(theme.mode()).toBe('clair');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);

    theme.choisir('sombre');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sombre');
    expect(document.documentElement.getAttribute('data-theme-choix')).toBe('sombre');
  });

  it('ne suit plus le système quand le visiteur a choisi clair ou sombre', () => {
    const systeme = simulerSysteme(false);
    const theme = TestBed.inject(ThemeService);
    theme.initialiser();
    theme.choisir('clair');
    systeme.declencher(true);
    expect(theme.mode()).toBe('clair');
  });
});
