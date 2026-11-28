import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';

export interface ElementGalerieAccordeon {
  readonly image: string;
  readonly legende?: string;
  readonly alt?: string;
}

/** Largeur du bloc en dessous de laquelle la galerie s'empile, quelle que soit l'orientation demandée. */
const LARGEUR_EMPILEE_PX = 520;
const RATIO_MIN = 0.2;
const RATIO_MAX = 0.9;
const DERIVE_MAX = 1.5;

function borner(valeur: number, min: number, max: number): number {
  return Math.min(Math.max(valeur, min), max);
}

/**
 * Galerie en accordéon : un panneau s'ouvre au survol, au clic ou au clavier, les autres se referment en
 * s'inclinant, avec un décalage de l'image (parallaxe) et des niveaux de gris. Tout le mouvement est du CSS
 * (transitions sur flex-grow, transform, translate et filter) : aucune bibliothèque d'animation.
 */
@Component({
  selector: 'ngs-galerie-accordeon',
  templateUrl: './galerie-accordeon.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalerieAccordeonComponent {
  readonly elements = input.required<readonly ElementGalerieAccordeon[]>();
  /** Nom accessible du groupe d'images. */
  readonly libelle = input('Galerie d’images');
  /** Panneau ouvert au départ (0 pour le premier). */
  readonly indexInitial = input(2, { transform: numberAttribute });
  /** Hauteur de la rangée en pixels (de la colonne, en orientation verticale : ×1,6). */
  readonly hauteur = input(460, { transform: numberAttribute });
  /** Part de la rangée prise par le panneau ouvert (0,2 à 0,9). */
  readonly ratioOuverture = input(0.52, { transform: numberAttribute });
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly declencheur = input<'survol' | 'clic'>('survol');
  readonly legendes = input(true, { transform: booleanAttribute });
  readonly nuancesDeGris = input(true, { transform: booleanAttribute });
  /** Inclinaison des panneaux fermés, en degrés. */
  readonly inclinaison = input(8, { transform: numberAttribute });
  /** Décalage de l'image dans les panneaux fermés (0 = aucun, 1 = fort). */
  readonly parallaxe = input(0.5, { transform: numberAttribute });
  /** false : les panneaux changent sans transition (aussi : .ngs-sans-animation sur un parent, ou mouvement réduit). */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly actif = linkedSignal(() =>
    borner(Math.round(this.indexInitial()), 0, Math.max(0, this.elements().length - 1)),
  );
  protected readonly etroit = signal(false);
  protected readonly orientationEffective = computed(() =>
    this.etroit() ? 'vertical' : this.orientation(),
  );
  protected readonly ratio = computed(() => borner(this.ratioOuverture(), RATIO_MIN, RATIO_MAX));
  protected readonly panneaux = computed(() => {
    const elements = this.elements();
    const actif = this.actif();
    const ratio = this.ratio();
    const croissance = elements.length > 1 ? (ratio * (elements.length - 1)) / (1 - ratio) : 1;
    const inclinaison = this.inclinaison();
    return elements.map((element, i) => {
      const ouvert = i === actif;
      return {
        element,
        ouvert,
        croissance: ouvert ? croissance : 1,
        inclinaison: ouvert ? 0 : Math.sign(actif - i) * inclinaison,
        derive: borner(actif - i, -DERIVE_MAX, DERIVE_MAX),
      };
    });
  });

  private readonly liste = viewChild.required<ElementRef<HTMLElement>>('liste');
  readonly #hote = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);

  constructor() {
    // Mesure du bloc : navigateur seulement, observateur libéré à la destruction.
    afterNextRender(() => {
      const Observateur = this.#hote.nativeElement.ownerDocument.defaultView?.ResizeObserver;
      if (!Observateur) return;
      const observateur = new Observateur(() =>
        this.etroit.set(this.#hote.nativeElement.clientWidth < LARGEUR_EMPILEE_PX),
      );
      observateur.observe(this.#hote.nativeElement);
      this.#destroyRef.onDestroy(() => observateur.disconnect());
    });
  }

  protected ouvrir(index: number): void {
    this.actif.set(index);
  }

  protected survoler(index: number): void {
    if (this.declencheur() === 'survol') this.actif.set(index);
  }

  protected touche(evenement: KeyboardEvent): void {
    const total = this.elements().length;
    const suivant = this.indexVise(evenement.key, total);
    if (suivant === null) return;
    evenement.preventDefault();
    this.actif.set(suivant);
    // Le focus suit : sans cela, une deuxième pression repartirait du panneau précédent.
    this.liste().nativeElement.querySelectorAll('button')[suivant]?.focus();
  }

  private indexVise(touche: string, total: number): number | null {
    const courant = this.actif();
    if (touche === 'ArrowRight' || touche === 'ArrowDown') return (courant + 1) % total;
    if (touche === 'ArrowLeft' || touche === 'ArrowUp') return (courant - 1 + total) % total;
    if (touche === 'Home') return 0;
    return touche === 'End' ? total - 1 : null;
  }
}
