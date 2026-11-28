import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  effect,
  inject,
  input,
  numberAttribute,
  untracked,
  viewChild,
} from '@angular/core';

let compteur = 0;

const SEUIL_ARRET = 0.0005;
const PRECISION = 10_000;
const LISSAGE_MIN = 0.01;
/** Cadence de référence du lissage : 60 images par seconde. */
const IMAGES_PAR_SECONDE = 60;

function borner(valeur: number, min: number, max: number): number {
  return Math.min(Math.max(valeur, min), max);
}

function mouvementPermis(hote: HTMLElement, animations: boolean): boolean {
  if (!animations || hote.closest('.ngs-sans-animation')) return false;
  return !hote.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

/**
 * Révélation en iris au défilement : sur fond uni, un disque au bord flou s'ouvre depuis le centre jusqu'à
 * remplir l'écran, l'image se dézoome en même temps, puis le texte apparaît. La section fait `longueur`
 * hauteurs d'écran ; son contenu reste épinglé pendant ce temps. L'effet est du CSS lu dans une seule
 * variable, `--ngs-p` (progression de 0 à 1), que le composant mesure dans le défilement de la page et
 * lisse, dans les deux sens. `pilotage="manuel"` la fixe à `progression`.
 */
@Component({
  selector: 'ngs-revelation-iris',
  templateUrl: './revelation-iris.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevelationIrisComponent {
  readonly image = input.required<string>();
  /** Texte alternatif de l'image ; vide si elle est purement décorative. */
  readonly alt = input('');
  /** Petite ligne au-dessus du titre ; vide pour la masquer. */
  readonly surtitre = input('');
  readonly titre = input.required<string>();
  readonly niveauTitre = input<1 | 2>(2);
  /** Indice en bas de l'écran, par exemple « Défiler » ; vide pour le masquer. */
  readonly indice = input('');
  /** Longueur du défilement de la section, en hauteurs d'écran : plus c'est grand, plus la révélation est lente. */
  readonly longueur = input(3, { transform: numberAttribute });
  /** Hauteur de la zone épinglée, en pourcentage de la hauteur de l'écran. */
  readonly hauteur = input(100, { transform: numberAttribute });
  /** Zoom de l'image au départ (1 = aucun). */
  readonly zoomDepart = input(1.6, { transform: numberAttribute });
  /** Largeur maximale du bord flou du disque, en pixels. */
  readonly douceur = input(90, { transform: numberAttribute });
  /** Coins arrondis de la zone épinglée (rayon du design). */
  readonly arrondi = input(false, { transform: booleanAttribute });
  /** Lissage de la progression (0,01 : quasi instantané). */
  readonly lissage = input(0.14, { transform: numberAttribute });
  /** `defilement` : la progression suit le défilement ; `manuel` : elle vaut `progression` (aperçu, capture, démonstration). */
  readonly pilotage = input<'defilement' | 'manuel'>('defilement');
  /** Progression de 0 à 1 quand le pilotage est manuel. */
  readonly progression = input(0, { transform: numberAttribute });
  /** false : pas de lissage, de zoom ni de flou de texte (aussi : .ngs-sans-animation sur un parent, ou mouvement réduit). */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly id = 'ngs-iris-' + compteur++;

  private readonly racine = viewChild.required<ElementRef<HTMLElement>>('racine');
  private readonly scene = viewChild.required<ElementRef<HTMLElement>>('scene');
  readonly #hote = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);

  #demarre = false;
  #image = 0;
  #courante = 0;
  #cible = 0;
  #nettoyer: (() => void) | null = null;

  constructor() {
    afterNextRender(() => {
      this.#demarre = true;
      this.#installer();
      this.#destroyRef.onDestroy(() => this.#nettoyer?.());
    });
    effect(() => {
      this.pilotage();
      this.progression();
      untracked(() => {
        if (this.#demarre) this.#installer();
      });
    });
  }

  #installer(): void {
    this.#nettoyer?.();
    const fenetre = this.racine().nativeElement.ownerDocument.defaultView;
    if (!fenetre) return;
    if (this.pilotage() === 'manuel') {
      this.#poser(borner(this.progression(), 0, 1));
      this.#nettoyer = null;
      return;
    }
    const surDefilement = (): void => {
      this.#cible = this.#lire();
      if (!this.#lisse()) {
        this.#courante = this.#cible;
        this.#poser(this.#courante);
        return;
      }
      this.#lancer();
    };
    const surTaille = (): void => {
      this.#cible = this.#courante = this.#lire();
      this.#poser(this.#courante);
    };
    this.#cible = this.#courante = this.#lire();
    this.#poser(this.#courante);
    fenetre.addEventListener('scroll', surDefilement, { passive: true });
    fenetre.addEventListener('resize', surTaille, { passive: true });
    this.#nettoyer = () => {
      if (this.#image) fenetre.cancelAnimationFrame(this.#image);
      this.#image = 0;
      fenetre.removeEventListener('scroll', surDefilement);
      fenetre.removeEventListener('resize', surTaille);
      this.#nettoyer = null;
    };
  }

  /** Progression de 0 à 1 : la part de la course épinglée déjà parcourue. */
  #lire(): number {
    const rect = this.racine().nativeElement.getBoundingClientRect();
    const course = Math.max(1, rect.height - this.scene().nativeElement.clientHeight);
    return borner(-rect.top / course, 0, 1);
  }

  #lisse(): boolean {
    return mouvementPermis(this.#hote.nativeElement, this.animations());
  }

  #lancer(): void {
    const fenetre = this.#hote.nativeElement.ownerDocument.defaultView;
    if (this.#image || !fenetre) return;
    this.#image = fenetre.requestAnimationFrame(() => this.#pas());
  }

  #pas(): void {
    this.#image = 0;
    const k = 1 - Math.exp(-1 / (IMAGES_PAR_SECONDE * Math.max(this.lissage(), LISSAGE_MIN)));
    this.#courante += (this.#cible - this.#courante) * k;
    const arrive = Math.abs(this.#cible - this.#courante) < SEUIL_ARRET;
    if (arrive) this.#courante = this.#cible;
    this.#poser(this.#courante);
    if (!arrive) this.#lancer();
  }

  #poser(valeur: number): void {
    this.racine().nativeElement.style.setProperty(
      '--ngs-p',
      String(Math.round(valeur * PRECISION) / PRECISION),
    );
  }
}
