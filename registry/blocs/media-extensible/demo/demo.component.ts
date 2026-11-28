import { Component, computed, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { creerProgressionAuto } from '@apercus/progression-auto';
import { MediaExtensibleComponent } from '../media-extensible.component';

/**
 * Scène de l'aperçu : un séjour en Casamance. Dans une case que le visiteur n'a pas activée, la progression
 * va et vient d'elle-même (non livrée) ; activée, la scène défile pour de vrai.
 */
@Component({
  selector: 'ngs-demo',
  imports: [MediaExtensibleComponent],
  template: `
    <div class="piece" style="--largeur-scene: 100%">
      <ngs-media-extensible
        data-hote
        src="images/or-chaud.svg"
        alt="Illustration abstraite : un grand soleil doré sur des terres brunes."
        titre="Casamance, côté rivière"
        indice="Défiler"
        [largeurDepart]="contexte.nombre('largeurDepart', 42)"
        [hauteurDepart]="contexte.nombre('hauteurDepart', 58)"
        [zoomDepart]="contexte.nombre('zoomDepart', 1.35)"
        [voile]="contexte.nombre('voile', 0.55)"
        [pilotage]="pilotage()"
        [progression]="progression()"
        [animations]="contexte.animations()"
      >
        <p class="m-0 max-w-[30rem] text-lg">
          Quatre jours entre mangrove et villages, au rythme des marées.
        </p>
        <a
          class="mt-4 inline-flex min-h-11 items-center rounded-ngs bg-ngs-action px-5 font-semibold text-ngs-on-action no-underline"
          href="/sejours"
          >Voir les séjours</a
        >
      </ngs-media-extensible>
    </div>
  `,
})
export class DemoComponent {
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
