import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { imagesDemo } from '@apercus/images-demo';
import { ElementGalerieAccordeon, GalerieAccordeonComponent } from '../galerie-accordeon.component';

const IMAGES = imagesDemo('galerie-accordeon');
const LEGENDES: readonly string[] = [
  'Aube ocre',
  'Rose poudré',
  'Forêt verte',
  'Nuit bleue',
  'Or chaud',
];

const ELEMENTS: readonly ElementGalerieAccordeon[] = LEGENDES.map((legende, i) => ({
  image: IMAGES[i]?.src ?? '',
  legende,
  alt: IMAGES[i]?.alt ?? legende,
}));

/** Scène de l'aperçu : cinq illustrations, la troisième ouverte (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [GalerieAccordeonComponent],
  template: `
    <div class="piece" style="--largeur-scene: 64rem">
      <ngs-galerie-accordeon
        data-hote
        libelle="Cinq ambiances de lumière"
        [elements]="elements"
        [orientation]="contexte.choix('orientation', ['horizontal', 'vertical'], 'horizontal')"
        [declencheur]="contexte.choix('declencheur', ['survol', 'clic'], 'survol')"
        [hauteur]="contexte.nombre('hauteur', 460)"
        [ratioOuverture]="contexte.nombre('ratioOuverture', 0.52)"
        [inclinaison]="contexte.nombre('inclinaison', 8)"
        [parallaxe]="contexte.nombre('parallaxe', 0.5)"
        [legendes]="contexte.booleen('legendes', true)"
        [nuancesDeGris]="contexte.booleen('nuancesDeGris', true)"
        [animations]="contexte.animations()"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly elements = ELEMENTS;
  protected readonly contexte = inject(ApercuService);
}
