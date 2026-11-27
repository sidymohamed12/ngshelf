import { DOCUMENT, DestroyRef, Service, computed, inject, signal } from '@angular/core';
import { CookieService } from '@core/cookies/cookie.service';

export const CHOIX_THEME = ['clair', 'sombre', 'systeme'] as const;
export type ChoixTheme = (typeof CHOIX_THEME)[number];
export type ModeTheme = 'clair' | 'sombre';

export const COOKIE_THEME = 'ngs_theme';
const DUREE_COOKIE_THEME_SECONDES = 31_536_000; // un an
const REQUETE_SYSTEME_SOMBRE = '(prefers-color-scheme: dark)';

function estChoixTheme(valeur: string | null): valeur is ChoixTheme {
  return CHOIX_THEME.some((choix) => choix === valeur);
}

/**
 * Thème du site : clair, sombre ou système (cookie fonctionnel ngs_theme).
 *
 * Le prérendu ne connaît pas le visiteur : il rend `systeme`, et public/theme-init.js (script externe,
 * bloquant, avant le premier rendu) pose déjà data-theme sur <html> pour qu'aucun éclair n'apparaisse.
 * Ce service reprend la main côté navigateur uniquement, après le premier rendu : `initialiser()`
 * doit être appelé depuis afterNextRender.
 */
@Service()
export class ThemeService {
  readonly #cookies = inject(CookieService);
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);

  readonly #choix = signal<ChoixTheme>('systeme');
  readonly #systemeSombre = signal(false);

  /** Choix du visiteur (clair, sombre ou système). */
  readonly choix = this.#choix.asReadonly();

  /** Thème réellement affiché : le système est résolu en clair ou sombre. */
  readonly mode = computed<ModeTheme>(() => {
    const sombre =
      this.#choix() === 'sombre' || (this.#choix() === 'systeme' && this.#systemeSombre());
    return sombre ? 'sombre' : 'clair';
  });

  /** Lit le cookie et la préférence du système, suit ses changements, puis applique le thème. */
  initialiser(): void {
    const memorise = this.#cookies.lire(COOKIE_THEME);
    if (estChoixTheme(memorise)) {
      this.#choix.set(memorise);
    }
    this.#suivreSysteme();
    this.#appliquer();
  }

  choisir(choix: ChoixTheme): void {
    this.#choix.set(choix);
    this.#cookies.ecrire(COOKIE_THEME, choix, { dureeSecondes: DUREE_COOKIE_THEME_SECONDES });
    this.#appliquer();
  }

  #suivreSysteme(): void {
    const requete = this.#document.defaultView?.matchMedia?.(REQUETE_SYSTEME_SOMBRE);
    if (!requete) {
      return;
    }
    this.#systemeSombre.set(requete.matches);
    const surChangement = (evenement: MediaQueryListEvent): void => {
      this.#systemeSombre.set(evenement.matches);
      this.#appliquer();
    };
    requete.addEventListener('change', surChangement);
    this.#destroyRef.onDestroy(() => requete.removeEventListener('change', surChangement));
  }

  #appliquer(): void {
    const racine = this.#document.documentElement;
    racine.setAttribute('data-theme-choix', this.#choix());
    if (this.mode() === 'sombre') {
      racine.setAttribute('data-theme', 'sombre');
    } else {
      racine.removeAttribute('data-theme');
    }
    this.#synchroniserBarreNavigateur(racine);
  }

  /** La barre du navigateur mobile prend la couleur de fond du site, lue dans les tokens. */
  #synchroniserBarreNavigateur(racine: HTMLElement): void {
    const meta = this.#document.querySelector('meta[name="theme-color"]');
    const fond = this.#document.defaultView
      ?.getComputedStyle(racine)
      .getPropertyValue('--color-canvas')
      .trim();
    if (meta && fond) {
      meta.setAttribute('content', fond);
    }
  }
}
