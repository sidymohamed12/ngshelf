import {
  Component,
  DOCUMENT,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  model,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE } from '@core/config/site.config';
import { RegistreService } from '@core/registre/registre.service';
import { TEXTES } from '@core/i18n/textes.fr';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { MarqueComponent } from '@shared/components/marque/marque.component';
import { LigneCompteComponent } from './ligne-compte.component';
import { LIENS_MENU_MOBILE } from './liens-navigation';
import { construireMenuCatalogue } from './menu-catalogue';

/** Menu plein écran des petits écrans : ouvert par le bouton du header, fermé par Échap, le bouton ou un lien. */
@Component({
  selector: 'app-mobile-menu',
  imports: [RouterLink, IconeComponent, LigneCompteComponent, MarqueComponent],
  templateUrl: './mobile-menu.component.html',
  host: { '(keydown.escape)': 'fermer()' },
})
export class MobileMenuComponent {
  readonly #document = inject(DOCUMENT);

  /** Vrai quand le menu est ouvert ; le header le lie à son bouton. */
  readonly ouvert = model(false);

  protected readonly liens = LIENS_MENU_MOBILE;
  protected readonly secteurs = construireMenuCatalogue(inject(RegistreService).compteurs).secteurs;
  protected readonly textes = TEXTES;
  protected readonly depot = SITE.depot;

  private readonly boutonFermer = viewChild.required<ElementRef<HTMLButtonElement>>('boutonFermer');

  constructor() {
    const injector = inject(Injector);
    effect(() => {
      const ouvert = this.ouvert();
      // Le défilement de la page est bloqué tant que le menu couvre l'écran.
      this.#document.documentElement.style.overflow = ouvert ? 'hidden' : '';
      if (ouvert) {
        afterNextRender(() => this.boutonFermer().nativeElement.focus(), { injector });
      }
    });
  }

  protected fermer(): void {
    this.ouvert.set(false);
  }
}
