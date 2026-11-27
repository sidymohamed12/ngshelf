import { Component, DOCUMENT, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SITE } from '@core/config/site.config';
import { TEXTES } from '@core/i18n/textes.fr';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { MarqueComponent } from '@shared/components/marque/marque.component';
import { LIENS_HEADER } from './liens-navigation';
import { MegaMenuComponent } from './mega-menu.component';
import { MobileMenuComponent } from './mobile-menu.component';
import { RechercheDeclencheurComponent } from './recherche-declencheur.component';
import { RechercheDialogComponent } from './recherche-dialog.component';
import { ThemeMenuComponent } from './theme-menu.component';

/** Distance de défilement au-delà de laquelle le header gagne sa bordure. */
const SEUIL_DEFILEMENT_PX = 8;

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    IconeComponent,
    MarqueComponent,
    MegaMenuComponent,
    MobileMenuComponent,
    RechercheDeclencheurComponent,
    RechercheDialogComponent,
    ThemeMenuComponent,
  ],
  templateUrl: './header.component.html',
  host: { '(window:scroll)': 'surDefilement()' },
})
export class HeaderComponent {
  readonly #document = inject(DOCUMENT);

  protected readonly textes = TEXTES;
  protected readonly liens = LIENS_HEADER;
  protected readonly depot = SITE.depot;
  protected readonly defile = signal(false);
  protected readonly menuOuvert = signal(false);

  protected surDefilement(): void {
    this.defile.set((this.#document.defaultView?.scrollY ?? 0) > SEUIL_DEFILEMENT_PX);
  }
}
