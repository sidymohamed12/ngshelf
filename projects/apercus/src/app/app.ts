import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApercuService } from './apercu.service';

/**
 * Coquille de l'aperçu : une scène centrée, rien d'autre (pas d'en-tête, pas de style du site). Les liens
 * des ressources sont neutralisés : un clic dans l'aperçu ne doit jamais faire naviguer l'iframe.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<main class="compo"><router-outlet /></main>',
  host: { '(click)': 'neutraliserLiens($event)' },
})
export class App {
  constructor() {
    inject(ApercuService);
  }

  protected neutraliserLiens(evenement: Event): void {
    const cible = evenement.target;
    if (cible instanceof Element && cible.closest('a')) evenement.preventDefault();
  }
}
