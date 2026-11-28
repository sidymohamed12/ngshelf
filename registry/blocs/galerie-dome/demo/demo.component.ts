import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { GalerieDomeComponent, ImageDome } from '../galerie-dome.component';

const IMAGES: readonly ImageDome[] = [
  {
    src: 'images/aube-ocre.svg',
    alt: 'Illustration abstraite : un soleil pâle sur des reliefs ocre.',
  },
  {
    src: 'images/rose-poudre.svg',
    alt: 'Illustration abstraite : un ciel rose au-dessus de collines framboise.',
  },
  {
    src: 'images/foret-verte.svg',
    alt: 'Illustration abstraite : une lune claire sur des crêtes vert sombre.',
  },
  {
    src: 'images/nuit-bleue.svg',
    alt: 'Illustration abstraite : une lune sur des reliefs bleu nuit.',
  },
  {
    src: 'images/or-chaud.svg',
    alt: 'Illustration abstraite : un grand soleil doré sur des terres brunes.',
  },
  {
    src: 'images/ciel-clair.svg',
    alt: 'Illustration abstraite : un ciel pâle au-dessus de collines bleues.',
  },
  {
    src: 'images/crepuscule.svg',
    alt: 'Illustration abstraite : un soleil orangé sur des crêtes violettes.',
  },
  {
    src: 'images/vert-profond.svg',
    alt: 'Illustration abstraite : une lune pâle sur des reliefs vert très sombre.',
  },
];

/** Scène de l'aperçu : huit illustrations sur un dôme (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [GalerieDomeComponent],
  template: `
    <div class="piece" style="--largeur-scene: 64rem">
      <ngs-galerie-dome
        data-hote
        libelle="Huit illustrations sur un dôme"
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
