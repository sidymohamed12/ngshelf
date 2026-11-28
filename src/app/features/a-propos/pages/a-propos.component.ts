import { Component, computed, inject, input, signal } from '@angular/core';
import { MouvementPageService } from '@core/motion/mouvement-page.service';
import { ThemeService } from '@core/theme/theme.service';
import { ValeursContrat, valeursDuDesign } from '@shared/livraison/livraison';
import { FicheRessource } from '@shared/models/fiche.model';
import { ChiffresAProposComponent } from '../components/chiffres-a-propos.component';
import { CommentAProposComponent } from '../components/comment-a-propos.component';
import { ContribuerAProposComponent } from '../components/contribuer-a-propos.component';
import { GestesAProposComponent } from '../components/gestes-a-propos.component';
import { HeroAProposComponent } from '../components/hero-a-propos.component';
import { PourQuiAProposComponent } from '../components/pour-qui-a-propos.component';
import { PourquoiAProposComponent } from '../components/pourquoi-a-propos.component';
import { QuiAProposComponent } from '../components/qui-a-propos.component';
import { DESIGNS, NOMS_DESIGNS } from '../a-propos.donnees';
import { monterAPropos } from '../a-propos.motion';

/**
 * « À propos » (mode « Convaincre », page vitrine) : hero, catalogue en chiffres, « Copier, Régler, Livrer »
 * (épinglé), pourquoi, pour qui (épinglé), comment c'est fait, contribuer, qui le développe. La fiche de la
 * ressource de démonstration arrive du resolver (`null` si son chargement a échoué : les zones concernées
 * l'indiquent, le reste est intact). Mise en scène par `MouvementPageService`, défaite à la destruction.
 */
@Component({
  selector: 'app-a-propos',
  imports: [
    HeroAProposComponent,
    ChiffresAProposComponent,
    GestesAProposComponent,
    PourquoiAProposComponent,
    PourQuiAProposComponent,
    CommentAProposComponent,
    ContribuerAProposComponent,
    QuiAProposComponent,
  ],
  providers: [MouvementPageService],
  templateUrl: './a-propos.component.html',
  host: { class: 'block' },
})
export class AProposComponent {
  /** Fiche de la ressource de démonstration (resolver, lié par `withComponentInputBinding`). */
  readonly fiche = input.required<FicheRessource | null>();

  readonly #mode = inject(ThemeService).mode;
  /** Design montré dans « Régler » : le défilement le fait passer de Planche à Fleuve puis Latérite. */
  protected readonly designGestes = signal(0);
  protected readonly pointComment = signal(0);

  protected readonly nomDesign = computed(
    () => NOMS_DESIGNS[DESIGNS[this.designGestes()] ?? 'planche'],
  );
  protected readonly reglagesGestes = computed<ValeursContrat | undefined>(() => {
    const slug = DESIGNS[this.designGestes()];
    const definition = this.fiche()?.designs.find((d) => d.slug === slug);
    return definition ? valeursDuDesign(definition, this.#mode()) : undefined;
  });

  constructor() {
    inject(MouvementPageService).demarrer({
      lenis: true,
      monter: (contexte) =>
        monterAPropos(contexte, {
          designGestes: (index) => this.designGestes.set(index),
          pointComment: (index) => this.pointComment.set(index),
        }),
    });
  }
}
