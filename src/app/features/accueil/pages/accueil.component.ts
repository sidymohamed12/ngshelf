import { Component, DOCUMENT, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Bibliotheques } from '@core/motion/bibliotheques-mouvement.service';
import { MouvementPageService } from '@core/motion/mouvement-page.service';
import { RegistreService } from '@core/registre/registre.service';
import { ThemeService } from '@core/theme/theme.service';
import { FicheService } from '@features/ressource/services/fiche.service';
import { ValeursContrat, valeursDuDesign } from '@shared/livraison/livraison';
import { DonneesVitrine, chargerDonneesVitrine } from '@shared/vitrine/donnees-vitrine';
import { ContratAccueilComponent } from '../components/contrat-accueil.component';
import { ContribuerAccueilComponent } from '../components/contribuer-accueil.component';
import { FamillesAccueilComponent } from '../components/familles-accueil.component';
import { GestesAccueilComponent } from '../components/gestes-accueil.component';
import { HeroAccueilComponent } from '../components/hero-accueil.component';
import { PlancheAccueilComponent } from '../components/planche-accueil.component';
import { DESIGN_PAR_DEFAUT, DesignAccueil, estDesignAccueil } from '../accueil.donnees';
import { monterAccueil } from '../accueil.motion';

/** Écart entre deux éléments de la vague d'habillage (maquette : 70 ms) et pulsation de chaque case. */
const PAS_VAGUE_S = 0.07;
const PULSATION = { echelle: 0.985, duree: 0.12 } as const;
const CIBLE_VITRINE = 'vitrine';

type Gsap = Bibliotheques['gsap'];
type TimelineVague = ReturnType<Gsap['timeline']>;

/**
 * Accueil « page vitrine » (mode « Convaincre ») : hero avec la vitrine, planche, quatre familles épinglées,
 * deux gestes, douze tokens, contribuer. Les données (index, fiche de démonstration) arrivent du resolver : le
 * HTML prérendu est complet et lisible sans JavaScript ; la mise en scène (GSAP, Lenis, ScrollTrigger) est
 * montée après le premier rendu par `MouvementPageService` et défaite à la destruction.
 */
@Component({
  selector: 'app-accueil',
  imports: [
    HeroAccueilComponent,
    PlancheAccueilComponent,
    FamillesAccueilComponent,
    GestesAccueilComponent,
    ContratAccueilComponent,
    ContribuerAccueilComponent,
  ],
  providers: [MouvementPageService],
  templateUrl: './accueil.component.html',
  host: { class: 'block' },
})
export class AccueilComponent {
  /** Résultat du resolver (lié par `withComponentInputBinding`). */
  readonly donnees = input.required<DonneesVitrine>();

  readonly #registre = inject(RegistreService);
  readonly #fiches = inject(FicheService);
  readonly #mode = inject(ThemeService).mode;
  readonly #mouvement = inject(MouvementPageService);
  readonly #document = inject(DOCUMENT);

  /** Les données affichées : celles du resolver, remplacées par « Réessayer ». */
  readonly #courantes = linkedSignal(() => this.donnees());
  protected readonly entrees = computed(() => this.#courantes().entrees);
  protected readonly fiche = computed(() => this.#courantes().fiche);

  /** Design choisi dans les segments, et design que montrent la vitrine et chaque case (la vague les décale). */
  protected readonly design = signal<DesignAccueil>(DESIGN_PAR_DEFAUT);
  readonly #designVitrine = signal<DesignAccueil>(DESIGN_PAR_DEFAUT);
  readonly #designsCases = signal<Readonly<Record<string, DesignAccueil>>>({});

  protected readonly habillable = computed(() => this.fiche() !== null);
  protected readonly reglagesVitrine = computed(() => this.#valeursDe(this.#designVitrine()));
  protected readonly reglagesCases = computed(() => {
    const reglages: Record<string, ValeursContrat> = {};
    for (const [slug, design] of Object.entries(this.#designsCases())) {
      const valeurs = this.#valeursDe(design);
      if (valeurs) reglages[slug] = valeurs;
    }
    return reglages;
  });

  #gsap: Gsap | null = null;
  #vague: TimelineVague | null = null;

  constructor() {
    this.#mouvement.demarrer({
      lenis: true,
      monter: (contexte) => {
        this.#gsap = contexte.gsap;
        const demontage = monterAccueil(contexte);
        return () => {
          demontage();
          this.#vague?.kill();
          this.#vague = null;
          this.#gsap = null;
        };
      },
    });
  }

  protected async recharger(): Promise<void> {
    this.#courantes.set(await chargerDonneesVitrine(this.#registre, this.#fiches));
  }

  /**
   * « Habiller avec un design » (#9) : la vitrine puis chaque case reçoivent les tokens du design, l'une après
   * l'autre (70 ms), chaque case pulse. En mouvement réduit (rien de chargé), tout change d'un coup, sans pulsation.
   */
  protected habiller(valeur: string): void {
    if (!estDesignAccueil(valeur) || valeur === this.design()) return;
    this.design.set(valeur);
    this.#vague?.kill();
    const cases = Array.from(
      this.#document.querySelectorAll<HTMLElement>('.accueil-planche .ngs-case[data-slug]'),
    );
    const slugs = this.#slugsHabillables(cases);
    const gsap = this.#gsap;
    if (!gsap) {
      this.#appliquer(CIBLE_VITRINE, valeur);
      for (const { slug } of slugs) this.#appliquer(slug, valeur);
      return;
    }
    const vague = gsap.timeline();
    this.#vague = vague;
    vague.call(() => this.#appliquer(CIBLE_VITRINE, valeur), [], 0);
    slugs.forEach(({ slug, element }, i) => {
      const debut = (i + 1) * PAS_VAGUE_S;
      vague.call(() => this.#appliquer(slug, valeur), [], debut);
      vague.fromTo(
        element,
        { scale: 1 },
        {
          scale: PULSATION.echelle,
          duration: PULSATION.duree,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
          clearProps: 'transform',
        },
        debut,
      );
    });
  }

  /** Les cases qui montrent une pièce en vrai : un design (icône seule) n'a rien à habiller. */
  #slugsHabillables(cases: readonly HTMLElement[]): { slug: string; element: HTMLElement }[] {
    const slugs = new Set(
      (this.entrees() ?? []).filter((e) => e.categorie !== 'design').map((e) => e.slug),
    );
    return cases.flatMap((element) => {
      const slug = element.dataset['slug'];
      return slug && slugs.has(slug) ? [{ slug, element }] : [];
    });
  }

  #appliquer(cible: string, design: DesignAccueil): void {
    if (cible === CIBLE_VITRINE) this.#designVitrine.set(design);
    else this.#designsCases.update((courants) => ({ ...courants, [cible]: design }));
  }

  #valeursDe(design: DesignAccueil): ValeursContrat | undefined {
    const definition = this.fiche()?.designs.find((d) => d.slug === design);
    return definition ? valeursDuDesign(definition, this.#mode()) : undefined;
  }
}
