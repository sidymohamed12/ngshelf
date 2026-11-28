import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LienSectionDirective } from '@core/motion/lien-section.directive';
import { TEXTES } from '@core/i18n/textes.fr';
import { TEXTES_APROPOS } from '@core/i18n/textes-apropos';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { PieceVitrineComponent } from '@shared/components/piece-vitrine/piece-vitrine.component';
import { PIECES_APESANTEUR } from '../a-propos.donnees';

/** Hero : le titre, deux actions, cinq vraies pièces du catalogue « en apesanteur » et trois faits. */
@Component({
  selector: 'app-hero-a-propos',
  imports: [RouterLink, LienSectionDirective, IconeComponent, PieceVitrineComponent],
  templateUrl: './hero-a-propos.component.html',
})
export class HeroAProposComponent {
  protected readonly page = TEXTES.pages.apropos;
  protected readonly cta = TEXTES.pages.accueil.cta;
  protected readonly t = TEXTES_APROPOS;
  protected readonly pieces = PIECES_APESANTEUR;
  protected readonly faits = [
    { classe: 'a', texte: TEXTES_APROPOS.faitMit, profondeur: 22 },
    { classe: 'b', texte: TEXTES_APROPOS.faitPrix, profondeur: 16 },
    { classe: 'c', texte: TEXTES_APROPOS.faitCompte, profondeur: 26 },
  ] as const;
}
