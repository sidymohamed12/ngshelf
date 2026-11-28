import { Component } from '@angular/core';
import { SITE } from '@core/config/site.config';
import { TEXTES } from '@core/i18n/textes.fr';
import { TEXTES_ACCUEIL } from '@core/i18n/textes-accueil';
import { IconeComponent } from '@shared/components/icone/icone.component';

/**
 * « Ajoutez votre pièce à la planche » : le texte et le parcours d'une contribution, tracé en SVG (il se
 * dessine au défilement, la page s'en occupe ; tracé complet sans animation). Les deux actions de la maquette
 * (guide de contribution, dépôt GitHub) : seul le dépôt est affiché, la page du guide n'existe pas (pas de
 * lien mort).
 */
@Component({
  selector: 'app-contribuer-accueil',
  imports: [IconeComponent],
  templateUrl: './contribuer-accueil.component.html',
})
export class ContribuerAccueilComponent {
  protected readonly t = TEXTES_ACCUEIL;
  protected readonly depot = SITE.depot;
  protected readonly nouvelOnglet = TEXTES.nav.nouvelOnglet;
}
