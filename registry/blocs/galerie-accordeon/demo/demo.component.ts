import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { ElementGalerieAccordeon, GalerieAccordeonComponent } from '../galerie-accordeon.component';

const ELEMENTS: readonly ElementGalerieAccordeon[] = [
  {
    image: 'images/aube-ocre.svg',
    legende: 'Aube ocre',
    alt: 'Illustration abstraite : un soleil pâle sur des reliefs ocre.',
  },
  {
    image: 'images/rose-poudre.svg',
    legende: 'Rose poudré',
    alt: 'Illustration abstraite : un ciel rose au-dessus de collines framboise.',
  },
  {
    image: 'images/foret-verte.svg',
    legende: 'Forêt verte',
    alt: 'Illustration abstraite : une lune claire sur des crêtes vert sombre.',
  },
  {
    image: 'images/nuit-bleue.svg',
    legende: 'Nuit bleue',
    alt: 'Illustration abstraite : une lune sur des reliefs bleu nuit.',
  },
  {
    image: 'images/or-chaud.svg',
    legende: 'Or chaud',
    alt: 'Illustration abstraite : un grand soleil doré sur des terres brunes.',
  },
];

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
