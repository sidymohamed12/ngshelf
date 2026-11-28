import { Component } from '@angular/core';
import { TEXTES_ACCUEIL } from '@core/i18n/textes-accueil';

/**
 * « Ajoutez votre pièce à la planche » : le texte et le parcours d'une contribution, tracé en SVG (il se
 * dessine au défilement, la page s'en occupe ; tracé complet sans animation). Les deux actions de la maquette
 * (guide de contribution, dépôt GitHub) ne sont pas affichées : la page du guide n'existe pas et le dépôt
 * n'est pas encore public (`SITE.depot` vaut null). Pas de lien mort.
 */
@Component({
  selector: 'app-contribuer-accueil',
  templateUrl: './contribuer-accueil.component.html',
})
export class ContribuerAccueilComponent {
  protected readonly t = TEXTES_ACCUEIL;
}
