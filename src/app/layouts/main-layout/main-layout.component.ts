import { Component, ElementRef, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TEXTES } from '@core/i18n/textes.fr';
import { FooterComponent } from './components/footer.component';
import { HeaderComponent } from './components/header.component';

/** Coquille commune des pages : lien d'évitement, header, contenu, pied de page. */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  protected readonly evitement = TEXTES.commun.evitement;
  private readonly contenu = viewChild.required<ElementRef<HTMLElement>>('contenu');

  /** Avec <base href="/">, href="#contenu" renverrait à l'accueil : on focalise le contenu nous-mêmes. */
  protected allerAuContenu(evenement: Event): void {
    evenement.preventDefault();
    this.contenu().nativeElement.focus();
  }
}
