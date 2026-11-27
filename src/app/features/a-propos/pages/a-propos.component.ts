import { Component } from '@angular/core';
import { TEXTES } from '@core/i18n/textes.fr';

/** Page squelette : la page vitrine (mosaïque, moment épinglé, portrait) vient dans une phase ultérieure. */
@Component({
  selector: 'app-a-propos',
  templateUrl: './a-propos.component.html',
})
export class AProposComponent {
  protected readonly textes = TEXTES.pages.apropos;
}
