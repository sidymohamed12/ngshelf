import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export type VarianteBouton = 'principale' | 'secondaire' | 'discrete';

@Component({
  selector: 'ngs-bouton',
  templateUrl: './bouton.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoutonComponent {
  readonly variante = input<VarianteBouton>('principale');
  readonly type = input<'button' | 'submit'>('button');
  readonly chargement = input(false, { transform: booleanAttribute });
  readonly desactive = input(false, { transform: booleanAttribute });
}
