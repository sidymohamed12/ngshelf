import { Component } from '@angular/core';
import { TEXTES } from '@core/i18n/textes.fr';

/** Page squelette : la planche, les filtres et la recherche viennent dans une phase ultérieure. */
@Component({
  selector: 'app-catalogue',
  templateUrl: './catalogue.component.html',
})
export class CatalogueComponent {
  protected readonly textes = TEXTES.pages.catalogue;
}
