import { Component, computed, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { imagesDemo } from '@apercus/images-demo';
import { creerProgressionAuto } from '@apercus/progression-auto';
import { HeroGrilleDefilanteComponent } from '../hero-grille-defilante.component';

/**
 * Scène de l'aperçu. Dans une case que le visiteur n'a pas activée, la progression va et vient d'elle-même
 * (non livrée) ; activée, la scène défile pour de vrai.
 */
@Component({
  selector: 'ngs-demo',
  imports: [HeroGrilleDefilanteComponent],
  template: `
    <div class="piece" style="--largeur-scene: 100%">
      <ngs-hero-grille-defilante
        data-hote
        [images]="images"
        [titre]="titre"
        texte="Une grille qui se compose au défilement, puis s’écarte pour laisser place à votre titre."
        libelle="Commencer"
        indice="Défiler"
        [longueur]="contexte.nombre('longueur', 4)"
        [rangs]="contexte.nombre('rangs', 4)"
        [pilotage]="pilotage()"
        [progression]="progression()"
        [animations]="contexte.animations()"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly titre = 'Pensé pour\nce qui vient';
  protected readonly images = imagesDemo('hero-grille-defilante').map((image) => image.src);
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
