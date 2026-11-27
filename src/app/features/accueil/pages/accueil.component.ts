import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEXTES } from '@core/i18n/textes.fr';

/** Page squelette : le contenu (hero, vitrine, familles) vient dans une phase ultérieure. */
@Component({
  selector: 'app-accueil',
  imports: [RouterLink],
  templateUrl: './accueil.component.html',
})
export class AccueilComponent {
  protected readonly textes = TEXTES.pages.accueil;
}
