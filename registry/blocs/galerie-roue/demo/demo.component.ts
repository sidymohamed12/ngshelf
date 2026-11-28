import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { ElementGalerieRoue, GalerieRoueComponent } from '../galerie-roue.component';

const ELEMENTS: readonly ElementGalerieRoue[] = [
  {
    image: 'images/aube-ocre.svg',
    titre: 'Aube ocre',
    sousTitre: 'Série Lumières',
    alt: 'Illustration abstraite : un soleil pâle sur des reliefs ocre.',
  },
  {
    image: 'images/rose-poudre.svg',
    titre: 'Rose poudré',
    sousTitre: 'Série Lumières',
    alt: 'Illustration abstraite : un ciel rose au-dessus de collines framboise.',
  },
  {
    image: 'images/foret-verte.svg',
    titre: 'Forêt verte',
    sousTitre: 'Série Nuits',
    alt: 'Illustration abstraite : une lune claire sur des crêtes vert sombre.',
  },
  {
    image: 'images/nuit-bleue.svg',
    titre: 'Nuit bleue',
    sousTitre: 'Série Nuits',
    alt: 'Illustration abstraite : une lune sur des reliefs bleu nuit.',
  },
  {
    image: 'images/crepuscule.svg',
    titre: 'Crépuscule',
    sousTitre: 'Série Horizons',
    alt: 'Illustration abstraite : un soleil orangé sur des crêtes violettes.',
  },
  {
    image: 'images/ciel-clair.svg',
    titre: 'Ciel clair',
    sousTitre: 'Série Horizons',
    alt: 'Illustration abstraite : un ciel pâle au-dessus de collines bleues.',
  },
  {
    image: 'images/or-chaud.svg',
    titre: 'Or chaud',
    sousTitre: 'Série Lumières',
    alt: 'Illustration abstraite : un grand soleil doré sur des terres brunes.',
  },
];

/** Scène de l'aperçu : sept illustrations, la troisième au départ (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [GalerieRoueComponent],
  template: `
    <div class="piece" style="--largeur-scene: 64rem">
      <ngs-galerie-roue
        data-hote
        libelle="Sept illustrations, série Lumières"
        [elements]="elements"
        [hauteur]="contexte.nombre('hauteur', 520)"
        [angle]="contexte.nombre('angle', 15)"
        [rayonArc]="contexte.nombre('rayonArc', 380)"
        [dureeLecture]="contexte.nombre('dureeLecture', 4)"
        [lectureAuto]="contexte.booleen('lectureAuto', true)"
        [boucle]="contexte.booleen('boucle', true)"
        [pauseAuSurvol]="contexte.booleen('pauseAuSurvol', true)"
        [molette]="contexte.booleen('molette', true)"
        [animations]="contexte.animations()"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly elements = ELEMENTS;
  protected readonly contexte = inject(ApercuService);
}
