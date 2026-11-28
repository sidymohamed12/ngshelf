import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  untracked,
  viewChild,
} from '@angular/core';

let compteur = 0;

/** Les trois colonnes : `c` leur place horizontale, `cote` 1 pour celles qui descendent, 0 pour celle du centre qui monte. */
const COLONNES = [
  { cle: 'gauche', c: -1, cote: 1 },
  { cle: 'centre', c: 0, cote: 0 },
  { cle: 'droite', c: 1, cote: 1 },
] as const;

const SEUIL_ARRET = 0.0005;
const PRECISION = 10_000;
const LISSAGE_MIN = 0.01;
/** Part de la course à partir de laquelle le texte secondaire et le bouton sont atteignables. */
const SEUIL_FIN = 0.88;
/** Cadence de référence du lissage : 60 images par seconde. */
const IMAGES_PAR_SECONDE = 60;

export interface TuileGrille {
  readonly cle: string;
  readonly src: string;
  readonly colonne: (typeof COLONNES)[number]['cle'];
  /** Colonne : -1, 0 ou 1. */
  readonly c: number;
  /** Rang centré sur le titre : -1,5, -0,5, 0,5, 1,5… (un espace reste toujours au milieu). */
  readonly r: number;
  readonly cote: 0 | 1;
}

function borner(valeur: number, min: number, max: number): number {
  return Math.min(Math.max(valeur, min), max);
}

function mouvementPermis(hote: HTMLElement, animations: boolean): boolean {
  if (!animations || hote.closest('.ngs-sans-animation')) return false;
  return !hote.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

/**
 * Hero à grille d'images liée au défilement. Les colonnes de côté descendent depuis le haut pendant que
 * celle du centre monte depuis le bas ; quand elle arrive entre les deux, la grille s'agrandit et s'écarte,
 * les colonnes de côté sortent de l'écran, puis les deux images du centre se séparent verticalement et
 * laissent place au texte et au bouton, qui se révèlent sous le titre. La section fait `longueur` hauteurs
 * d'écran ; son contenu reste épinglé pendant ce temps. Toute la mise en scène est du CSS lu dans une seule
 * variable, `--ngs-p` (progression de 0 à 1), que le composant mesure dans le défilement de la page et
 * lisse, dans les deux sens. `pilotage="manuel"` la fixe à `progression`.
 * Les images sont décoratives : le sens de la page est porté par le titre.
 */
@Component({
  selector: 'ngs-hero-grille-defilante',
  templateUrl: './hero-grille-defilante.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroGrilleDefilanteComponent {
  /** Adresses des images (au moins une) ; elles se répètent pour remplir la grille. */
  readonly images = input.required<readonly string[]>();
  /** Titre ; un retour à la ligne (`\n`) force le passage à la ligne. */
  readonly titre = input.required<string>();
  readonly niveauTitre = input<1 | 2>(2);
  /** Texte sous le titre ; vide pour le masquer. */
  readonly texte = input('');
  /** Libellé du bouton ; vide pour le masquer. */
  readonly libelle = input('');
  /** Adresse du bouton : vide, il reste un bouton et émet `action` ; renseignée, c'est un lien. */
  readonly lien = input('');
  /** Indice en bas de l'écran, par exemple « Défiler » ; vide pour le masquer. */
  readonly indice = input('');
  /** Longueur du défilement de la section, en hauteurs d'écran : plus c'est grand, plus l'effet est lent. */
  readonly longueur = input(4, { transform: numberAttribute });
  /** Nombre d'images par colonne, arrondi au nombre pair (2 au minimum) pour garder un espace au centre. */
  readonly rangs = input(4, { transform: numberAttribute });
  /** Lissage de la progression (0,01 : quasi instantané). */
  readonly lissage = input(0.14, { transform: numberAttribute });
  /** `defilement` : la progression suit le défilement ; `manuel` : elle vaut `progression` (aperçu, capture, démonstration). */
  readonly pilotage = input<'defilement' | 'manuel'>('defilement');
  /** Progression de 0 à 1 quand le pilotage est manuel. */
  readonly progression = input(0, { transform: numberAttribute });
  /** false : pas de lissage ni de flou du texte (aussi : .ngs-sans-animation sur un parent, ou mouvement réduit). */
  readonly animations = input(true, { transform: booleanAttribute });
  /** Clic sur le bouton quand `lien` est vide. */
  readonly action = output<void>();

  protected readonly id = 'ngs-grille-' + compteur++;

  protected readonly rangsPairs = computed(() => Math.max(2, Math.round(this.rangs() / 2) * 2));

  protected readonly tuiles = computed<readonly TuileGrille[]>(() => {
    const images = this.images();
    const rangs = this.rangsPairs();
    if (images.length === 0) return [];
    return COLONNES.flatMap((colonne, indice) =>
      Array.from({ length: rangs }, (_, rang) => ({
        cle: `${colonne.cle}-${rang}`,
        src: images[(rang * COLONNES.length + indice) % images.length],
        colonne: colonne.cle,
        c: colonne.c,
        r: rang - (rangs - 1) / 2,
        cote: colonne.cote,
      })),
    );
  });

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

  protected cliquer(): void {
    this.action.emit();
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
    const racine = this.racine().nativeElement;
    racine.style.setProperty('--ngs-p', String(Math.round(valeur * PRECISION) / PRECISION));
    // Le texte secondaire et le bouton ne se tabulent qu'une fois visibles.
    racine.dataset['fin'] = valeur >= SEUIL_FIN ? 'oui' : 'non';
  }
}
