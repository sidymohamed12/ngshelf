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
  signal,
  untracked,
  viewChild,
} from '@angular/core';

let compteur = 0;

const PROGRESSION_CONTENU = 0.68;
const SEUIL_ARRET = 0.0004;
/** Cadence de référence du lissage : 60 images par seconde. */
const IMAGES_PAR_SECONDE = 60;
const DISTANCE_MIN = 0.01;
const PRECISION = 10_000;

function borner(valeur: number, min: number, max: number): number {
  return Math.min(Math.max(valeur, min), max);
}

function mouvementPermis(hote: HTMLElement, animations: boolean): boolean {
  if (!animations || hote.closest('.ngs-sans-animation')) return false;
  return !hote.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

/**
 * Média qui s'étend au défilement : un cadre arrondi au centre de la page grandit jusqu'à remplir l'écran
 * pendant que l'image se dézoome, le titre s'efface puis le contenu projeté apparaît. Tout l'effet est du
 * CSS lu dans une seule variable, `--ngs-p` (la progression de 0 à 1) : le composant ne fait que la mesurer
 * (défilement de la fenêtre ou du conteneur) et la lisser. `pilotage="manuel"` la fixe à `progression` (aperçu,
 * capture, démonstration).
 */
@Component({
  selector: 'ngs-media-extensible',
  templateUrl: './media-extensible.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaExtensibleComponent {
  /** Adresse de l'image, ou de la vidéo avec `typeMedia="video"`. */
  readonly src = input.required<string>();
  readonly typeMedia = input<'image' | 'video'>('image');
  /** Image affichée avant la lecture d'une vidéo. */
  readonly poster = input('');
  /** Texte alternatif de l'image (ou nom accessible de la vidéo) ; vide si le média est purement décoratif. */
  readonly alt = input('');
  readonly titre = input('');
  readonly niveauTitre = input<1 | 2>(2);
  /** Indice sous le cadre, par exemple « Défiler » ; vide pour le masquer. */
  readonly indice = input('');
  /** `fenetre` : la page défile ; `conteneur` : le composant défile dans la hauteur que son parent lui donne. */
  readonly defilement = input<'fenetre' | 'conteneur'>('fenetre');
  /** Largeur du cadre au départ, en % de l'écran. */
  readonly largeurDepart = input(42, { transform: numberAttribute });
  /** Hauteur du cadre au départ, en % de l'écran. */
  readonly hauteurDepart = input(58, { transform: numberAttribute });
  /** Zoom de l'image au départ (1 = aucun). */
  readonly zoomDepart = input(1.35, { transform: numberAttribute });
  /** Opacité maximale du voile qui rend le contenu lisible sur l'image (0 à 1). */
  readonly voile = input(0.55, { transform: numberAttribute });
  /** Distance de défilement de l'expansion, en hauteurs d'écran. */
  readonly distance = input(1.2, { transform: numberAttribute });
  /** Distance de défilement pendant laquelle le cadre reste plein écran, en hauteurs d'écran. */
  readonly maintien = input(0.35, { transform: numberAttribute });
  /** Lissage de la progression (0 = elle suit le défilement sans délai). */
  readonly lissage = input(0.1, { transform: numberAttribute });
  /** `defilement` : la progression suit le défilement ; `manuel` : elle vaut `progression` (aperçu, capture, démonstration). */
  readonly pilotage = input<'defilement' | 'manuel'>('defilement');
  /** Progression de 0 à 1 quand le pilotage est manuel. */
  readonly progression = input(0, { transform: numberAttribute });
  /** false : pas de lissage ni de zoom de l'image (aussi : .ngs-sans-animation sur un parent, ou mouvement réduit). */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly id = 'ngs-media-' + compteur++;
  /** Le contenu projeté n'est atteignable (clavier, lecteurs d'écran) que lorsqu'il est visible. */
  protected readonly contenuVisible = signal(false);

  private readonly racine = viewChild.required<ElementRef<HTMLElement>>('racine');
  private readonly piste = viewChild.required<ElementRef<HTMLElement>>('piste');
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
      this.#gererVideo();
      this.#destroyRef.onDestroy(() => this.#nettoyer?.());
    });
    // Un réglage qui change la mesure (mode de défilement, progression imposée) réinstalle la lecture.
    effect(() => {
      this.defilement();
      this.pilotage();
      this.progression();
      this.distance();
      this.maintien();
      untracked(() => {
        if (this.#demarre) this.#installer();
      });
    });
  }

  /** Une vidéo ne démarre pas toute seule quand le visiteur demande moins de mouvement. */
  #gererVideo(): void {
    const racine = this.racine().nativeElement;
    const video = racine.querySelector('video');
    if (video && !mouvementPermis(this.#hote.nativeElement, this.animations())) video.pause();
  }

  #installer(): void {
    this.#nettoyer?.();
    const racine = this.racine().nativeElement;
    const fenetre = racine.ownerDocument.defaultView;
    if (!fenetre) return;
    if (this.pilotage() === 'manuel') {
      this.#poser(borner(this.progression(), 0, 1));
      this.#nettoyer = null;
      return;
    }
    const defilant: Window | HTMLElement = this.defilement() === 'fenetre' ? fenetre : racine;
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
    defilant.addEventListener('scroll', surDefilement, { passive: true });
    fenetre.addEventListener('resize', surTaille);
    const Observateur = fenetre.ResizeObserver;
    const observateur = Observateur ? new Observateur(surTaille) : null;
    observateur?.observe(racine);
    this.#nettoyer = () => {
      if (this.#image) fenetre.cancelAnimationFrame(this.#image);
      this.#image = 0;
      defilant.removeEventListener('scroll', surDefilement);
      fenetre.removeEventListener('resize', surTaille);
      observateur?.disconnect();
      this.#nettoyer = null;
    };
  }

  /** Progression de 0 à 1 lue dans le défilement. */
  #lire(): number {
    const hauteur = this.scene().nativeElement.clientHeight;
    if (hauteur <= 0) return 0;
    const course = hauteur * Math.max(DISTANCE_MIN, this.distance());
    if (this.defilement() === 'fenetre') {
      return borner(-this.piste().nativeElement.getBoundingClientRect().top / course, 0, 1);
    }
    return borner(this.racine().nativeElement.scrollTop / course, 0, 1);
  }

  #lisse(): boolean {
    return this.lissage() > 0 && mouvementPermis(this.#hote.nativeElement, this.animations());
  }

  #lancer(): void {
    const fenetre = this.#hote.nativeElement.ownerDocument.defaultView;
    if (this.#image || !fenetre) return;
    this.#image = fenetre.requestAnimationFrame(() => this.#pas());
  }

  #pas(): void {
    this.#image = 0;
    const k = 1 - Math.exp(-1 / (IMAGES_PAR_SECONDE * Math.max(this.lissage(), DISTANCE_MIN)));
    this.#courante += (this.#cible - this.#courante) * k;
    const arrive = Math.abs(this.#cible - this.#courante) < SEUIL_ARRET;
    if (arrive) this.#courante = this.#cible;
    this.#poser(this.#courante);
    if (!arrive) this.#lancer();
  }

  /** Écrit la progression dans la variable CSS qui pilote tout l'effet, et rend le contenu atteignable à temps. */
  #poser(valeur: number): void {
    this.racine().nativeElement.style.setProperty(
      '--ngs-p',
      String(Math.round(valeur * PRECISION) / PRECISION),
    );
    const visible = valeur >= PROGRESSION_CONTENU;
    if (visible !== this.contenuVisible()) this.contenuVisible.set(visible);
  }
}
