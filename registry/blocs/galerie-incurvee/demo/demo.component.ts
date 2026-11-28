import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { imagesDemo } from '@apercus/images-demo';
import { ElementGalerie, GalerieIncurveeComponent } from '../galerie-incurvee.component';

const TEXTES: readonly (readonly [string, string])[] = [
  ['Tambour', 'Une forme ronde dans le bleu'],
  ['Flèches', 'Pointées vers le ciel'],
  ['Voûte', 'Des côtes de lumière'],
  ['Balcons', 'Verre et murs blancs'],
  ['Treillis', 'Une façade qui grimpe dans le bleu'],
  ['Patio', 'Deux pins, un mur'],
  ['Escalier', 'La lumière gravit un mur calme'],
  ['Monolithe', 'Le béton en rythme'],
];

/** Scène de l'aperçu : huit images d'architecture, la cinquième active au départ. */
@Component({
  selector: 'ngs-demo',
  imports: [GalerieIncurveeComponent],
  template: `
    <div class="piece" style="--largeur-scene: 100%">
      <ngs-galerie-incurvee
        data-hote
        libelle="Architecture"
        [elements]="elements"
        [depart]="4"
        [defilementAuto]="contexte.booleen('defilementAuto', true)"
        [vitesse]="contexte.nombre('vitesse', 7)"
        [reflet]="contexte.booleen('reflet', true)"
        [animations]="contexte.animations()"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly contexte = inject(ApercuService);
  protected readonly elements: readonly ElementGalerie[] = imagesDemo('galerie-incurvee').map(
    (image, i) => {
      const [titre, legende] = TEXTES[i % TEXTES.length];
      return { image: image.src, titre, legende };
    },
  );
}
