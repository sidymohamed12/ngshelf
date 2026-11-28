import { Service } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

/** Clé de `data` d'une route dont la page doit être recréée quand un paramètre d'URL change. */
export const CLE_RECREER_SI_PARAMS = 'recreerSiParams';

function memesParametres(a: ActivatedRouteSnapshot, b: ActivatedRouteSnapshot): boolean {
  const nomsA = Object.keys(a.params);
  return (
    nomsA.length === Object.keys(b.params).length &&
    nomsA.every((nom) => a.params[nom] === b.params[nom])
  );
}

/**
 * Par défaut, le routeur réutilise le composant d'une route quand seul un paramètre change
 * (/blocs/hero/a vers /blocs/hero/b) : la page garde alors l'état de la précédente (cadre d'aperçu sur
 * l'ancien slug, onglet de code, fragment CSS, « Réessayer »). Une route marquée `recreerSiParams` est
 * recréée à chaque changement de paramètre ; les autres gardent le comportement du routeur.
 */
@Service()
export class ReutilisationRouteStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(
    futur: ActivatedRouteSnapshot,
    courant: ActivatedRouteSnapshot,
  ): boolean {
    if (!super.shouldReuseRoute(futur, courant)) return false;
    if (futur.routeConfig?.data?.[CLE_RECREER_SI_PARAMS] !== true) return true;
    return memesParametres(futur, courant);
  }
}
