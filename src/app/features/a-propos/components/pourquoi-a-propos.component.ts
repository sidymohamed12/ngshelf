import { Component } from '@angular/core';
import { TEXTES_APROPOS } from '@core/i18n/textes-apropos';

/** « Pourquoi ce catalogue existe » : trois promesses (gratuit, open source, sans compte). Séparateur des deux épinglages. */
@Component({
  selector: 'app-pourquoi-a-propos',
  templateUrl: './pourquoi-a-propos.component.html',
})
export class PourquoiAProposComponent {
  protected readonly t = TEXTES_APROPOS;
  protected readonly promesses = [
    { titre: TEXTES_APROPOS.gratuit, texte: TEXTES_APROPOS.gratuitTexte },
    { titre: TEXTES_APROPOS.libre, texte: TEXTES_APROPOS.libreTexte },
    { titre: TEXTES_APROPOS.sanscompte, texte: TEXTES_APROPOS.sanscompteTexte },
  ];
}
