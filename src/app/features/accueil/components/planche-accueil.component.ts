import { Component, computed, input, output } from '@angular/core';
import { TEXTES_ACCUEIL } from '@core/i18n/textes-accueil';
import { PlancheComponent } from '@shared/components/planche/planche.component';
import { ValeursContrat } from '@shared/livraison/livraison';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { DISPOSITION_PLANCHE } from '../accueil.donnees';

/**
 * « Toutes les pièces, en vrai » : la planche composée de l'accueil. Les cases sont celles du catalogue
 * (même composant, mêmes aperçus en vignette, même morph vers la fiche) ; seule la disposition est propre à
 * l'accueil. `null` = l'index n'a pas pu se charger : la planche affiche son état d'erreur avec « Réessayer ».
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
    return DISPOSITION_PLANCHE.flatMap(({ slug, taille }) => {
      const entree = entrees.find((e) => e.slug === slug);
      return entree ? [{ ...entree, tailleCase: taille }] : [];
    });
  });
}
