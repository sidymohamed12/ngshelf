import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEXTES } from '@core/i18n/textes.fr';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {
  protected readonly textes = TEXTES.pages.introuvable;
}
