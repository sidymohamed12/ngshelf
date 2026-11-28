import { Component, input, model } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEXTES } from '@core/i18n/textes.fr';
import { TEXTES_ACCUEIL } from '@core/i18n/textes-accueil';
import { ChoixSegmentComponent } from '@shared/components/choix-segment/choix-segment.component';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { PieceVitrineComponent } from '@shared/components/piece-vitrine/piece-vitrine.component';
import { ValeursContrat } from '@shared/livraison/livraison';
import { OPTIONS_DESIGNS, PIECES_HERO } from '../accueil.donnees';

/**
 * Hero de l'accueil (mode « Convaincre ») : le titre, deux actions, le choix d'un design, et la vitrine, un
 * faux site de restaurant assemblé avec quatre pièces du catalogue (aperçus en vignette, étiquettes vers
 * leur fiche). Le design choisi est appliqué par la page, qui orchestre la vague.
 */
@Component({
  selector: 'app-hero-accueil',
  imports: [RouterLink, ChoixSegmentComponent, PieceVitrineComponent, IconeComponent],
  templateUrl: './hero-accueil.component.html',
})
export class HeroAccueilComponent {
  /** Design choisi (segments) : la page applique la vague à chaque changement. */
  readonly design = model.required<string>();
  /** Valeurs de tokens du design appliqué à la vitrine ; absentes, la vitrine garde son design par défaut. */
  readonly reglages = input<ValeursContrat>();
  /** Faux quand les valeurs des designs n'ont pas pu se charger : le choix serait sans effet, on le retire. */
  readonly habillable = input(false);

  protected readonly textes = TEXTES.pages.accueil;
  protected readonly t = TEXTES_ACCUEIL;
  protected readonly pieces = PIECES_HERO;
  protected readonly options = OPTIONS_DESIGNS;
}
