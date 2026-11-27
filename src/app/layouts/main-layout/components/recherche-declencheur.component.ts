import { Component, DOCUMENT, afterNextRender, inject, signal } from '@angular/core';
import { TEXTES } from '@core/i18n/textes.fr';
import { RechercheService } from '@core/recherche/recherche.service';
import { IconeComponent } from '@shared/components/icone/icone.component';

const PLATEFORMES_APPLE = /Mac|iPhone|iPad/;

/** Bouton du header qui ouvre la recherche ; il annonce le raccourci ⌘K ou Ctrl K selon la plateforme. */
@Component({
  selector: 'app-recherche-declencheur',
  imports: [IconeComponent],
  templateUrl: './recherche-declencheur.component.html',
})
export class RechercheDeclencheurComponent {
  protected readonly recherche = inject(RechercheService);
  protected readonly textes = TEXTES.recherche;
  /** Le prérendu ne connaît pas la plateforme : ⌘K par défaut, corrigé après le premier rendu. */
  protected readonly apple = signal(true);

  constructor() {
    const navigateur = inject(DOCUMENT).defaultView?.navigator;
    afterNextRender(() => {
      this.apple.set(PLATEFORMES_APPLE.test(navigateur?.userAgent ?? ''));
    });
  }
}
