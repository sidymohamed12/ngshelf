import { Component, computed, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { imagesDemo } from '@apercus/images-demo';
import { creerProgressionAuto } from '@apercus/progression-auto';
import { RevelationIrisComponent } from '../revelation-iris.component';

/**
 * Scène de l'aperçu : un carnet de voyage. Dans une case que le visiteur n'a pas activée, la progression
 * va et vient d'elle-même (non livrée) ; activée, la scène défile pour de vrai.
 */
@Component({
  selector: 'ngs-demo',
  imports: [RevelationIrisComponent],
  template: `
    <div class="piece" style="--largeur-scene: 100%">
      <ngs-revelation-iris
        data-hote
        [image]="image.src"
        [alt]="image.alt"
        surtitre="Carnet de voyage"
        titre="Tout arrive d’un coup"
        indice="Défiler"
        [longueur]="contexte.nombre('longueur', 3)"
        [hauteur]="contexte.nombre('hauteur', 100)"
        [zoomDepart]="contexte.nombre('zoomDepart', 1.6)"
        [douceur]="contexte.nombre('douceur', 90)"
        [arrondi]="contexte.booleen('arrondi', false)"
        [pilotage]="pilotage()"
        [progression]="progression()"
        [animations]="contexte.animations()"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly image = imagesDemo('revelation-iris')[0] ?? { src: '', alt: '' };
  protected readonly contexte = inject(ApercuService);
  readonly #auto = creerProgressionAuto();
  /** Case de la planche que le visiteur n'a pas activée : boucle automatique ; activée : vrai défilement. */
  readonly #enBoucle = computed(() => this.contexte.vignette() && !this.contexte.manipulation());
  protected readonly pilotage = computed(() =>
    this.#enBoucle()
      ? ('manuel' as const)
      : this.contexte.choix<'defilement' | 'manuel'>(
          'pilotage',
          ['defilement', 'manuel'],
          'defilement',
        ),
  );
  protected readonly progression = computed(() =>
    this.#enBoucle() ? this.#auto() : this.contexte.nombre('progression', 0.5),
  );
}
