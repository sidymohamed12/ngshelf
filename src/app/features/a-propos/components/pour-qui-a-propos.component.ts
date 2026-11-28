import { Component } from '@angular/core';
import { TEXTES_APROPOS } from '@core/i18n/textes-apropos';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { PieceVitrineComponent } from '@shared/components/piece-vitrine/piece-vitrine.component';
import { PIECE_CALENDRIER } from '../a-propos.donnees';

/**
 * « Pour qui » : un manifeste en très grand et l'avant / après d'un calendrier qu'on n'écrit plus. Moment
 * épinglé à partir de 1024 px (160 % de défilement) : le manifeste se lit mot à mot, le code « avant » s'écrit,
 * chaque « À faire » est rayé, puis le vrai calendrier prend sa place. Sans animation : état final (lignes rayées
 * et cochées, calendrier visible) ; l'avant reste au-dessus de l'après.
 */
@Component({
  selector: 'app-pour-qui-a-propos',
  imports: [IconeComponent, PieceVitrineComponent],
  templateUrl: './pour-qui-a-propos.component.html',
})
export class PourQuiAProposComponent {
  protected readonly t = TEXTES_APROPOS;
  protected readonly calendrier = PIECE_CALENDRIER;
  protected readonly taches = [
    TEXTES_APROPOS.avant1,
    TEXTES_APROPOS.avant2,
    TEXTES_APROPOS.avant3,
    TEXTES_APROPOS.avant4,
    TEXTES_APROPOS.avant5,
  ];
}
