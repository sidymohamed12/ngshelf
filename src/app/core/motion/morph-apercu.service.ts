import { DestroyRef, Service, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  Router,
} from '@angular/router';
import { MotionService } from './motion.service';
import { NOM_TRANSITION_APERCU } from './transitions';

/**
 * Morph case vers fiche (ADR 0011) : le nom `apercu-ressource` ne doit exister que sur UN élément à la
 * fois. Il est posé sur la scène de la case cliquée juste avant la navigation, et retiré dès que la
 * navigation se termine, réussie ou non (sinon une navigation annulée laisserait la case nommée et la
 * suivante échouerait). Le cadre d'aperçu de la fiche porte le même nom en CSS, en permanence.
 */
@Service()
export class MorphApercuService {
  readonly #motion = inject(MotionService);
  #scene: HTMLElement | null = null;

  constructor() {
    const abonnement = inject(Router).events.subscribe((evenement) => {
      if (
        evenement instanceof NavigationEnd ||
        evenement instanceof NavigationCancel ||
        evenement instanceof NavigationError ||
        evenement instanceof NavigationSkipped
      ) {
        this.retirer();
      }
    });
    inject(DestroyRef).onDestroy(() => abonnement.unsubscribe());
  }

  /** Nomme la scène d'une case : à appeler au clic sur son lien, avant la navigation. */
  nommer(scene: HTMLElement | null): void {
    if (!scene || this.#motion.mouvementReduit()) return;
    this.retirer();
    scene.style.viewTransitionName = NOM_TRANSITION_APERCU;
    this.#scene = scene;
  }

  retirer(): void {
    this.#scene?.style.removeProperty('view-transition-name');
    this.#scene = null;
  }
}
