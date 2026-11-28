import {
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Service,
  afterNextRender,
  afterRenderEffect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import type Lenis from 'lenis';
import {
  Bibliotheques,
  BibliothequesMouvementService,
  ClasseLenis,
} from './bibliotheques-mouvement.service';
import { DefilementService } from './defilement.service';
import { MotionService } from './motion.service';

/** Posée sur l'élément de la page tant que sa mise en scène existe : c'est elle qui permet de cacher ce qui va entrer. */
export const CLASSE_MOTION = 'ngs-motion';

/** Points de rupture et pointeur du design (HANDOFF §8.2) : « grand » = 1024 px et plus. */
export const REQUETES_MOUVEMENT = {
  large: '(min-width: 64rem)',
  pointeurFin: '(hover: hover) and (pointer: fine)',
} as const;

const ATTENTE_POLICES_MAX_MS = 1500;
const LAG_DEFAUT_MS = 500;
const LAG_DEFAUT_IMAGE_MS = 33;
const MS_PAR_S = 1000;
/** Éléments dans lesquels la molette garde son comportement natif (code défilant, dialogues, menu). */
const SELECTEUR_SANS_LENIS = 'pre, dialog, .ngs-menu';

/** Ce que reçoit la mise en scène d'une page : les bibliothèques, l'élément de la page et l'état des requêtes. */
export interface ContexteMouvement extends Bibliotheques {
  readonly hote: HTMLElement;
  /** Vrai à partir de 1024 px : épinglages et défilement horizontal ; sinon les sections s'empilent. */
  readonly large: boolean;
  /** Vrai avec une souris : profondeur au pointeur, bouton magnétique. */
  readonly pointeurFin: boolean;
  readonly lenis: Lenis | null;
}

export type Demontage = () => void;

export interface OptionsMouvement {
  /** Lenis (accueil et « À propos » seulement, ADR 0011). */
  readonly lenis?: boolean;
  /** Données prêtes : tant que c'est faux (ex. planche pas encore rendue), la mise en scène attend. */
  readonly pret?: () => boolean;
  /**
   * Crée les animations. Elle est rejouée quand une requête (1024 px, pointeur) change : tout ce qu'elle
   * pose (classes, états de départ, SplitText) doit être défait par la fonction qu'elle renvoie.
   */
  readonly monter: (contexte: ContexteMouvement) => Demontage | void;
}

/**
 * Mise en scène d'une page vitrine : à fournir dans les `providers` du composant de la page.
 *
 * - Rien ne s'exécute pendant le prérendu ni sans navigateur : le HTML prérendu est le contenu complet,
 *   les états de départ (cachés) ne sont posés que par la mise en scène, jamais par le CSS seul.
 * - `prefers-reduced-motion` : lu par `MotionService` seulement. En mouvement réduit les bibliothèques ne
 *   sont même pas téléchargées et la page reste à son état final ; si la préférence change en cours de
 *   visite, la mise en scène est défaite (ou montée) sans recharger.
 * - Chargement : GSAP, ScrollTrigger, SplitText et Lenis en import dynamique ; un échec laisse la page
 *   complète, sans animation.
 * - Nettoyage dans `DestroyRef` : `matchMedia.revert()` (animations, ScrollTrigger, SplitText), Lenis
 *   détruit, ticker rendu. Lenis s'arrête dès le début d'une navigation (ADR 0011).
 */
@Service()
export class MouvementPageService {
  readonly #document = inject(DOCUMENT);
  readonly #hote = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #motion = inject(MotionService);
  readonly #chargeur = inject(BibliothequesMouvementService);
  readonly #defilement = inject(DefilementService);

  readonly #navigateur = signal(false);
  readonly #bibliotheques = signal<Bibliotheques | null>(null);
  #ClasseLenis: ClasseLenis | null = null;
  #enChargement = false;
  #detruit = false;
  #monte: Demontage | null = null;
  #lenis: Lenis | null = null;
  #pasLenis: ((temps: number) => void) | null = null;

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((evenement) => {
        if (evenement instanceof NavigationStart) this.#lenis?.stop();
        else if (
          evenement instanceof NavigationEnd ||
          evenement instanceof NavigationCancel ||
          evenement instanceof NavigationError
        )
          this.#lenis?.start();
      });
    inject(DestroyRef).onDestroy(() => {
      this.#detruit = true;
      this.#demonter();
    });
  }

  demarrer(options: OptionsMouvement): void {
    afterNextRender(() => this.#navigateur.set(true));
    afterRenderEffect(() => {
      const navigateur = this.#navigateur();
      const reduit = this.#motion.mouvementReduit();
      const donneesPretes = options.pret?.() ?? true;
      const bibliotheques = this.#bibliotheques();
      untracked(() => {
        if (!navigateur || reduit) {
          this.#demonter();
        } else if (!bibliotheques) {
          void this.#charger(options.lenis === true);
        } else if (donneesPretes) {
          this.#monter(bibliotheques, options);
        } else {
          this.#demonter();
        }
      });
    });
  }

  async #charger(avecLenis: boolean): Promise<void> {
    if (this.#enChargement) return;
    this.#enChargement = true;
    try {
      const [bibliotheques, ClasseLenis] = await Promise.all([
        this.#chargeur.charger(),
        avecLenis ? this.#chargeur.chargerLenis() : Promise.resolve(null),
      ]);
      await this.#attendrePolices();
      if (this.#detruit) return;
      this.#ClasseLenis = ClasseLenis;
      this.#bibliotheques.set(bibliotheques);
    } catch (erreur) {
      // L'animation est un confort : la page reste complète et lisible sans elle.
      console.warn('Animations indisponibles, la page reste statique.', erreur);
    } finally {
      this.#enChargement = false;
    }
  }

  /** SplitText mesure le texte : on attend les polices (au plus 1,5 s) pour ne pas découper un texte de repli. */
  async #attendrePolices(): Promise<void> {
    const polices = this.#document.fonts;
    if (!polices) return;
    await Promise.race([
      polices.ready,
      new Promise<void>((resoudre) => setTimeout(resoudre, ATTENTE_POLICES_MAX_MS)),
    ]);
  }

  #monter(bibliotheques: Bibliotheques, options: OptionsMouvement): void {
    if (this.#monte || this.#detruit) return;
    const { gsap, ScrollTrigger } = bibliotheques;
    const hote = this.#hote.nativeElement;
    hote.classList.add(CLASSE_MOTION);
    const lenis = this.#creerLenis(bibliotheques);
    const media = gsap.matchMedia();
    media.add(REQUETES_MOUVEMENT, (contexte) => {
      const conditions = contexte.conditions as Record<keyof typeof REQUETES_MOUVEMENT, boolean>;
      const demontage = options.monter({
        ...bibliotheques,
        hote,
        large: conditions.large,
        pointeurFin: conditions.pointeurFin,
        lenis,
      });
      return () => demontage?.();
    });
    ScrollTrigger.refresh();
    this.#monte = () => {
      media.revert();
      this.#arreterLenis(bibliotheques);
      hote.classList.remove(CLASSE_MOTION);
    };
  }

  #creerLenis({ gsap, ScrollTrigger }: Bibliotheques): Lenis | null {
    if (!this.#ClasseLenis) return null;
    const lenis = new this.#ClasseLenis({
      autoRaf: false,
      prevent: (noeud) => noeud.closest(SELECTEUR_SANS_LENIS) !== null,
    });
    lenis.on('scroll', () => ScrollTrigger.update());
    const pas = (temps: number): void => lenis.raf(temps * MS_PAR_S);
    gsap.ticker.add(pas);
    gsap.ticker.lagSmoothing(0);
    this.#lenis = lenis;
    this.#pasLenis = pas;
    this.#defilement.enregistrerLenis(lenis);
    return lenis;
  }

  #arreterLenis({ gsap }: Bibliotheques): void {
    if (!this.#lenis) return;
    if (this.#pasLenis) gsap.ticker.remove(this.#pasLenis);
    gsap.ticker.lagSmoothing(LAG_DEFAUT_MS, LAG_DEFAUT_IMAGE_MS);
    this.#lenis.destroy();
    this.#defilement.enregistrerLenis(null);
    this.#lenis = null;
    this.#pasLenis = null;
  }

  #demonter(): void {
    const demontage = this.#monte;
    this.#monte = null;
    demontage?.();
  }
}
