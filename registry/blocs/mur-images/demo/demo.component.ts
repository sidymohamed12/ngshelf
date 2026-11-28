import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { MurImagesComponent } from '../mur-images.component';

const IMAGES: readonly string[] = [
  'images/aube-ocre.svg',
  'images/rose-poudre.svg',
  'images/foret-verte.svg',
  'images/nuit-bleue.svg',
  'images/or-chaud.svg',
  'images/ciel-clair.svg',
  'images/crepuscule.svg',
  'images/vert-profond.svg',
];

/** Scène de l'aperçu : un atelier de tirages d'art et son mur de paysages (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [MurImagesComponent],
  template: `
    <div class="piece" style="--largeur-scene: 72rem">
      <ngs-mur-images
        data-hote
        [images]="images"
        titre="Des paysages imprimés en grand."
        texte="Tirages d’art sur commande : dunes, lagunes et ciels de Casamance, en six formats."
        action="Voir les tirages"
        routeAction="/tirages"
        lien="Les formats"
        routeLien="/formats"
        [hauteur]="contexte.nombre('hauteur', 640)"
        [nombreLignes]="contexte.nombre('nombreLignes', 5)"
        [duree]="contexte.nombre('duree', 150)"
        [perspective]="contexte.nombre('perspective', 1400)"
        [rotation]="contexte.nombre('rotation', 28)"
        [animations]="contexte.animations()"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly images = IMAGES;
  protected readonly contexte = inject(ApercuService);
}
