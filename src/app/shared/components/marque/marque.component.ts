import { Component } from '@angular/core';
import { SITE } from '@core/config/site.config';
import { CHEMIN_SPRITE } from '../icone/icones';

/**
 * Marque : logo (symbole du sprite, aux couleurs du thème via --logo-tuile) puis « Shelf ».
 * À placer dans un élément .ngs-brand (lien ou span), qui porte le nom accessible.
 */
@Component({
  selector: 'app-marque',
  host: { class: 'contents' },
  template: `
    <svg class="ngs-brand__logo" aria-hidden="true" focusable="false">
      <use [attr.href]="logo" />
    </svg>
    <span aria-hidden="true">{{ nomCourt }}</span>
  `,
})
export class MarqueComponent {
  protected readonly logo = `${CHEMIN_SPRITE}#ngshelf-logo`;
  protected readonly nomCourt = SITE.nomCourt;
}
