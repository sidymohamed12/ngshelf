import { DOCUMENT, DestroyRef, Service, afterNextRender, inject, signal } from '@angular/core';

const REQUETE_MOUVEMENT_REDUIT = '(prefers-reduced-motion: reduce)';

/**
 * Préférence de mouvement du visiteur (ADR 0011) : le seul endroit qui lit `prefers-reduced-motion`.
 * GSAP, Lenis, les transitions de page et le splash lisent `mouvementReduit`. Pas de bouton
 * « Réduire les animations » ni de cookie `ngs_motion` en v1 : seule la préférence du système compte.
 *
 * Le prérendu ne la connaît pas : le signal vaut faux jusqu'à la première lecture, faite dans le
 * navigateur après le premier rendu, puis suit les changements du système.
 */
@Service()
export class MotionService {
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #mouvementReduit = signal(false);

  /** Vrai quand le visiteur demande moins de mouvement : aucune transition, aucune animation JS. */
  readonly mouvementReduit = this.#mouvementReduit.asReadonly();

  constructor() {
    afterNextRender(() => this.#suivre());
  }

  #suivre(): void {
    const requete = this.#document.defaultView?.matchMedia?.(REQUETE_MOUVEMENT_REDUIT);
    if (!requete) return;
    this.#mouvementReduit.set(requete.matches);
    const surChangement = (evenement: MediaQueryListEvent): void =>
      this.#mouvementReduit.set(evenement.matches);
    requete.addEventListener('change', surChangement);
    this.#destroyRef.onDestroy(() => requete.removeEventListener('change', surChangement));
  }
}
