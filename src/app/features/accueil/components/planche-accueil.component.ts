import { Component, computed, input, output } from '@angular/core';
import { TEXTES_ACCUEIL } from '@core/i18n/textes-accueil';
import { PlancheComponent } from '@shared/components/planche/planche.component';
import { ValeursContrat } from '@shared/livraison/livraison';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { SLUGS_PLANCHE } from '../accueil.donnees';

/**
 * « Toutes les pièces, en vrai » : la planche composée de l'accueil. Les cases sont celles du catalogue
 * (même composant, même grille uniforme, mêmes aperçus en vignette, même morph vers la fiche) ; seul le choix
 * et l'ordre des pièces sont propres à l'accueil. `null` = l'index n'a pas pu se charger : la planche affiche son état d'erreur avec « Réessayer ».
 */
@Component({
  selector: 'app-planche-accueil',
  imports: [PlancheComponent],
  templateUrl: './planche-accueil.component.html',
})
export class PlancheAccueilComponent {
  readonly entrees = input.required<readonly EntreeIndex[] | null>();
  readonly reglages = input<Readonly<Record<string, ValeursContrat>>>({});
  readonly reessayer = output();

  protected readonly t = TEXTES_ACCUEIL;

  protected readonly cases = computed<readonly EntreeIndex[] | undefined>(() => {
    const entrees = this.entrees();
    if (entrees === null) return undefined;
    return SLUGS_PLANCHE.flatMap((slug) => entrees.filter((e) => e.slug === slug));
  });
}
