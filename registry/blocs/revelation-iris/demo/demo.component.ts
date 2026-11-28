import { Component, computed, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { creerProgressionAuto } from '@apercus/progression-auto';
import { RevelationIrisComponent } from '../revelation-iris.component';

/**
 * Scène de l'aperçu : un carnet de voyage. Sans défilement possible (vignette d'une case), la progression
 * va et vient d'elle-même (non livrée).
 */
@Component({
  selector: 'ngs-demo',
  imports: [RevelationIrisComponent],
  template: `
    <div class="piece" style="--largeur-scene: 100%">
      <ngs-revelation-iris
        data-hote
        image="images/crepuscule.svg"
        alt="Illustration abstraite : un soleil orangé sur des crêtes violettes."
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
  protected readonly contexte = inject(ApercuService);
  readonly #auto = creerProgressionAuto();
  protected readonly pilotage = computed(() =>
    this.contexte.vignette()
      ? ('manuel' as const)
      : this.contexte.choix<'defilement' | 'manuel'>(
          'pilotage',
          ['defilement', 'manuel'],
          'defilement',
        ),
  );
  protected readonly progression = computed(() =>
    this.contexte.vignette() ? this.#auto() : this.contexte.nombre('progression', 0.5),
  );
}
