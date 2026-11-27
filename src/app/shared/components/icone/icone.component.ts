import { Component, computed, input } from '@angular/core';
import { CHEMIN_SPRITE, NomIcone, TailleIcone } from './icones';

/**
 * Icône du sprite SVG (Phosphor). S'applique à un élément <svg> :
 * <svg appIcone="sun" taille="sm"></svg>
 * Le sélecteur sur <svg> garde la structure attendue par components.css (.ngs-icon enfant direct).
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- composant d'attribut sur <svg> voulu (voir ci-dessus)
  selector: 'svg[appIcone]',
  template: '<svg:use [attr.href]="reference()" />',
  host: {
    class: 'ngs-icon',
    'aria-hidden': 'true',
    focusable: 'false',
    '[class.ngs-icon--sm]': "taille() === 'sm'",
    '[class.ngs-icon--lg]': "taille() === 'lg'",
  },
})
export class IconeComponent {
  readonly nom = input.required<NomIcone>({ alias: 'appIcone' });
  readonly taille = input<TailleIcone>('md');

  protected readonly reference = computed(() => `${CHEMIN_SPRITE}#${this.nom()}`);
}
