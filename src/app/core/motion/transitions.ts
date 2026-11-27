import { DOCUMENT, inject } from '@angular/core';
import { Router, ViewTransitionInfo } from '@angular/router';
import { MotionService } from './motion.service';

/** Nom partagé de l'aperçu : la scène de la case (liste) et le cadre d'aperçu de la fiche (ADR 0011). */
export const NOM_TRANSITION_APERCU = 'apercu-ressource';

/** Sens de la navigation, posé sur <html> le temps de la transition (`data-transition`). */
export type SensTransition = 'avant' | 'arriere';
const ATTRIBUT_SENS = 'data-transition';

/** Ce que la comparaison des pages lit d'un instantané de route (sous-ensemble d'ActivatedRouteSnapshot). */
export interface InstantaneRoute {
  readonly url: readonly { readonly path: string }[];
  readonly firstChild: InstantaneRoute | null;
}

/**
 * Chemin de la page d'un instantané, sans paramètres d'URL ni fragment : les segments de toute la chaîne
 * de routes, de la racine à la feuille.
 */
export function cheminDePage(racine: InstantaneRoute): string {
  const segments: string[] = [];
  for (let route: InstantaneRoute | null = racine; route; route = route.firstChild) {
    segments.push(...route.url.map((segment) => segment.path));
  }
  return segments.join('/');
}

/**
 * Sauter la transition : en mouvement réduit, et quand seuls les paramètres d'URL changent (filtres du
 * catalogue) ou que la route est la même. Un fondu de la page entière y serait un clignotement.
 */
export function doitSauter(contexte: {
  readonly mouvementReduit: boolean;
  readonly de: InstantaneRoute;
  readonly vers: InstantaneRoute;
}): boolean {
  return contexte.mouvementReduit || cheminDePage(contexte.de) === cheminDePage(contexte.vers);
}

/**
 * `onViewTransitionCreated` du router (ADR 0011) : saute la transition au besoin, sinon pose le sens
 * le temps de l'animation. Aucun repli GSAP : sans View Transitions, la navigation est sans animation.
 * Le router l'exécute dans un contexte d'injection.
 */
export function surTransitionCreee({ transition, from, to }: ViewTransitionInfo): void {
  const motion = inject(MotionService);
  const racine = inject(DOCUMENT).documentElement;
  const retour = inject(Router).currentNavigation()?.trigger === 'popstate';
  if (doitSauter({ mouvementReduit: motion.mouvementReduit(), de: from, vers: to })) {
    transition.skipTransition();
    return;
  }
  const sens: SensTransition = retour ? 'arriere' : 'avant';
  racine.setAttribute(ATTRIBUT_SENS, sens);
  const retirer = (): void => racine.removeAttribute(ATTRIBUT_SENS);
  transition.finished.then(retirer, retirer);
}
