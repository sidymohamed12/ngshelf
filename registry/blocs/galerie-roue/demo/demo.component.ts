import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { imagesDemo } from '@apercus/images-demo';
import { ElementGalerieRoue, GalerieRoueComponent } from '../galerie-roue.component';

const IMAGES = imagesDemo('galerie-roue');
const TITRES: readonly (readonly [string, string])[] = [
  ['Aube ocre', 'Série Lumières'],
  ['Rose poudré', 'Série Lumières'],
  ['Forêt verte', 'Série Nuits'],
  ['Nuit bleue', 'Série Nuits'],
  ['Crépuscule', 'Série Horizons'],
  ['Ciel clair', 'Série Horizons'],
  ['Or chaud', 'Série Lumières'],
];

const ELEMENTS: readonly ElementGalerieRoue[] = TITRES.map(([titre, sousTitre], i) => ({
  image: IMAGES[i]?.src ?? '',
  titre,
  sousTitre,
  alt: IMAGES[i]?.alt ?? titre,
}));

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
