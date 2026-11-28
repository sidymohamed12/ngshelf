import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEXTES_ACCUEIL } from '@core/i18n/textes-accueil';
import { ThemeService } from '@core/theme/theme.service';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { PieceVitrineComponent } from '@shared/components/piece-vitrine/piece-vitrine.component';
import {
  TOKENS_CONTRAT,
  TokenContrat,
  ValeursContrat,
  valeursDuDesign,
} from '@shared/livraison/livraison';
import { FicheRessource } from '@shared/models/fiche.model';
import { PieceVitrine } from '@shared/components/piece-vitrine/piece-vitrine.component';
import { DESIGN_PAR_DEFAUT, DESIGN_TEMOIN } from '../accueil.donnees';

/** Un jeton « passé » est au-dessus de 62 % de la hauteur de l'écran (maquette : `top 62%`). */
const LIGNE_ECRAN = 0.62;

const TEMOINS: readonly { readonly piece: PieceVitrine; readonly ratio: string }[] = [
  {
    piece: { slug: 'interrupteur', categorie: 'composant', type: 'interrupteur' },
    ratio: '520 / 90',
  },
  { piece: { slug: 'champ-email', categorie: 'composant', type: 'champ' }, ratio: '520 / 120' },
  {
    piece: { slug: 'notifications', categorie: 'composant', type: 'notification' },
    ratio: '520 / 110',
  },
];

/**
 * « Douze tokens pour tout régler » : la liste des jetons du contrat et trois pièces témoins. Chaque jeton qui
 * passe à 62 % de l'écran « s'allume » et applique sa valeur Fleuve aux témoins ; en remontant, la valeur
 * Planche revient. C'est un changement d'état, pas une animation : il marche aussi en mouvement réduit (la page
 * n'y charge pas GSAP), d'où une lecture du défilement ici plutôt qu'un ScrollTrigger. Les valeurs viennent des
 * vrais designs (fiche) ; sans elles, la liste garde noms et rôles.
 */
@Component({
  selector: 'app-contrat-accueil',
  imports: [RouterLink, IconeComponent, PieceVitrineComponent],
  templateUrl: './contrat-accueil.component.html',
})
export class ContratAccueilComponent {
  readonly fiche = input.required<FicheRessource | null>();

  protected readonly t = TEXTES_ACCUEIL;
  protected readonly temoins = TEMOINS;
  readonly #mode = inject(ThemeService).mode;
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  private readonly lignes = viewChildren<ElementRef<HTMLElement>>('ligne');

  protected readonly actifs = signal<ReadonlySet<TokenContrat>>(new Set());

  readonly #valeurs = (slug: string): ValeursContrat | null => {
    const design = this.fiche()?.designs.find((d) => d.slug === slug);
    return design ? valeursDuDesign(design, this.#mode()) : null;
  };

  protected readonly planche = computed(() => this.#valeurs(DESIGN_PAR_DEFAUT));
  protected readonly fleuve = computed(() => this.#valeurs(DESIGN_TEMOIN));

  protected readonly jetons = computed(() =>
    TOKENS_CONTRAT.map((nom) => ({
      nom,
      role: TEXTES_ACCUEIL.jetons[nom],
      // Une valeur de police compte des virgules : on garde le premier nom, comme la maquette.
      valeur: this.fleuve()?.[nom].split(',')[0] ?? null,
    })),
  );

  /** Les 12 valeurs posées sur les témoins : Planche, avec la valeur Fleuve des jetons déjà allumés. */
  protected readonly reglagesTemoins = computed<ValeursContrat | undefined>(() => {
    const base = this.planche();
    const fleuve = this.fleuve();
    if (!base || !fleuve) return undefined;
    const actifs = this.actifs();
    return Object.fromEntries(
      TOKENS_CONTRAT.map((nom) => [nom, actifs.has(nom) ? fleuve[nom] : base[nom]]),
    ) as unknown as ValeursContrat;
  });

  constructor() {
    afterNextRender(() => this.#suivreDefilement());
  }

  /**
   * Un jeton est « passé » quand son bord haut est au-dessus de la ligne des 62 % de l'écran. Lu à chaque
   * défilement (une image à la fois) plutôt qu'avec un IntersectionObserver : celui-ci ne signale rien quand
   * on saute d'un coup au-delà des jetons (ancre, retour de page).
   */
  #suivreDefilement(): void {
    const fenetre = this.#document.defaultView;
    if (!fenetre) return;
    let image = 0;
    const lire = (): void => {
      image = 0;
      const ligne = fenetre.innerHeight * LIGNE_ECRAN;
      for (const element of this.lignes()) {
        const nom = element.nativeElement.dataset['jeton'] as TokenContrat | undefined;
        if (nom) this.#regler(nom, element.nativeElement.getBoundingClientRect().top <= ligne);
      }
    };
    const planifier = (): void => {
      if (image === 0) image = fenetre.requestAnimationFrame(lire);
    };
    lire();
    fenetre.addEventListener('scroll', planifier, { passive: true });
    fenetre.addEventListener('resize', planifier, { passive: true });
    this.#destroyRef.onDestroy(() => {
      fenetre.removeEventListener('scroll', planifier);
      fenetre.removeEventListener('resize', planifier);
      fenetre.cancelAnimationFrame(image);
    });
  }

  #regler(nom: TokenContrat, allume: boolean): void {
    this.actifs.update((courants) => {
      if (courants.has(nom) === allume) return courants;
      const suivants = new Set(courants);
      if (allume) suivants.add(nom);
      else suivants.delete(nom);
      return suivants;
    });
  }
}
