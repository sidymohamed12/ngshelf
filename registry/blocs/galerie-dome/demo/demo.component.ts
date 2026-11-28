import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { imagesDemo } from '@apercus/images-demo';
import { GalerieDomeComponent, ImageDome } from '../galerie-dome.component';

const IMAGES: readonly ImageDome[] = imagesDemo('galerie-dome');

/** Scène de l'aperçu : images sur un dôme (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [GalerieDomeComponent],
  template: `
    <div class="piece" style="--largeur-scene: 64rem">
      <ngs-galerie-dome
        data-hote
        libelle="Galerie d’images sur un dôme"
        [images]="images"
        [hauteur]="contexte.nombre('hauteur', 560)"
        [segments]="contexte.nombre('segments', 35)"
        [ajustement]="contexte.nombre('ajustement', 0.5)"
        [sensibilite]="contexte.nombre('sensibilite', 20)"
        [amortissement]="contexte.nombre('amortissement', 0.8)"
        [inclinaisonMax]="contexte.nombre('inclinaisonMax', 5)"
        [tailleOuverte]="contexte.nombre('tailleOuverte', 400)"
        [nuancesDeGris]="contexte.booleen('nuancesDeGris', true)"
        [animations]="contexte.animations()"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly images = IMAGES;
  protected readonly contexte = inject(ApercuService);
}
