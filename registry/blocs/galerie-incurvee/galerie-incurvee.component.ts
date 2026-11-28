import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';

let compteur = 0;

/** Distance au centre (en cartes) au-delà de laquelle une carte n'est plus cliquable. */
const PORTEE_VISIBLE = 2.6;
/** Durée d'un changement d'image demandé (flèche, clic, clavier, fin de glissé). */
const DUREE_CHANGEMENT_MS = 700;
/** Délai sans interaction avant que le défilement automatique reprenne. */
const DELAI_REPRISE_MS = 2500;
/** Durée de la montée en vitesse du défilement automatique, pour qu'il démarre en douceur. */
const RAMPE_S = 1.6;
/** Déplacement du pointeur, en pixels, au-delà duquel un appui devient un glissé. */
const SEUIL_GLISSE = 6;
/** Écart à l'écran entre deux cartes voisines, en largeurs de carte (mesuré sur le cylindre). */
const PAS_ECRAN = 1.05;
const PRECISION = 10_000;
const MS_PAR_SECONDE = 1000;
/** Plus grand pas de temps pris en compte (onglet revenu au premier plan). */
const PAS_MAX_S = 0.25;

const TEXTES = {
  precedent: 'Image précédente',
  suivant: 'Image suivante',
} as const;

export interface ElementGalerie {
  readonly image: string;
  readonly titre: string;
  /** Petite ligne sous le titre ; facultative. */
  readonly legende?: string;
}

interface Glisse {
  readonly x: number;
  readonly position: number;
  bouge: boolean;
}

interface Changement {
  readonly de: number;
  readonly vers: number;
  readonly debut: number;
}

/** Place d'une carte autour de la position courante, dans une boucle de `n` cartes : [-n/2, n/2[. */
function decalage(index: number, position: number, n: number): number {
  const d = (((index - position) % n) + n) % n;
  return d >= n / 2 ? d - n : d;
}

function modulo(valeur: number, n: number): number {
  return ((valeur % n) + n) % n;
}

function deuxChiffres(valeur: number): string {
  return String(valeur).padStart(2, '0');
}

function adoucir(t: number): number {
  return 1 - (1 - t) ** 3;
}

function arrondir(valeur: number): string {
  return String(Math.round(valeur * PRECISION) / PRECISION);
}

/**
 * Galerie incurvée : les images sont posées sur l'intérieur d'un cylindre, vu depuis son axe. La carte
 * active est au centre avec son titre et sa légende ; ses voisines, plus grandes et tournées vers elle,
 * s'assombrissent vers les bords, avec un reflet au sol. Sans interaction, la galerie défile d'elle-même,
 * lentement et en continu ; elle s'arrête au survol, au focus et pendant un glissé, puis reprend en douceur.
 * Flèches, compteur, clic sur une voisine, glissé et flèches du clavier ; la galerie boucle.
 * La position est un nombre à virgule : chaque carte lit sa place, `--k`, écrite à chaque image.
 */
@Component({
  selector: 'ngs-galerie-incurvee',
  templateUrl: './galerie-incurvee.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalerieIncurveeComponent {
  readonly elements = input.required<readonly ElementGalerie[]>();
  /** Nom de la galerie pour les lecteurs d'écran. */
  readonly libelle = input('Galerie');
  /** Image affichée au départ (à partir de 0). */
  readonly depart = input(0, { transform: numberAttribute });
  /** Défilement automatique, lent et continu, quand personne n'interagit. */
  readonly defilementAuto = input(true, { transform: booleanAttribute });
  /** Durée du défilement automatique d'une image à la suivante, en secondes. */
  readonly vitesse = input(7, { transform: numberAttribute });
  /** Reflet des images au sol. */
  readonly reflet = input(true, { transform: booleanAttribute });
  /** false : changements immédiats et pas de défilement automatique (aussi : .ngs-sans-animation, mouvement réduit). */
  readonly animations = input(true, { transform: booleanAttribute });
  /** Index de la nouvelle image active. */
  readonly changement = output<number>();

  protected readonly id = 'ngs-galerie-incurvee-' + compteur++;
  protected readonly textes = TEXTES;

  protected readonly actif = signal(0);
  protected readonly enLecture = signal(false);
  protected readonly numero = computed(() => deuxChiffres(this.actif() + 1));
  protected readonly total = computed(() => deuxChiffres(this.elements().length));
  protected readonly annonce = computed(() => {
    const element = this.elements()[this.actif()];
    if (!element) return '';
    const legende = element.legende ? ` : ${element.legende}` : '';
    return `${element.titre}${legende} (${this.actif() + 1} sur ${this.elements().length})`;
  });

  private readonly cartes = viewChildren<ElementRef<HTMLElement>>('carte');
  readonly #hote = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);

  #position = 0;
  #changement: Changement | null = null;
  #glisse: Glisse | null = null;
  #ignorerClic = false;
  #vitesseCourante = 0;
  #derniereInteraction = 0;
  #survol = false;
  #focus = false;
  #visible = true;
  #image = 0;
  #precedente = 0;

  constructor() {
    afterNextRender(() => {
      this.#position = this.#borner(this.depart());
      this.#derniereInteraction = this.#maintenant();
      this.#poser();
      this.#observer();
      this.#lancer();
    });
    afterRenderEffect(() => {
      this.elements();
      this.cartes();
      untracked(() => this.#poser());
    });
  }

  protected precedent(): void {
    this.#aller(-1);
  }

  protected suivant(): void {
    this.#aller(1);
  }

  protected choisir(index: number): void {
    if (this.#ignorerClic) return;
    const n = this.elements().length;
    if (n === 0) return;
    this.#vers(Math.round(this.#position + decalage(index, this.#position, n)));
  }

  protected surTouche(evenement: KeyboardEvent): void {
    if (evenement.key === 'ArrowLeft') {
      evenement.preventDefault();
      this.precedent();
    } else if (evenement.key === 'ArrowRight') {
      evenement.preventDefault();
      this.suivant();
    }
  }

  protected survoler(dedans: boolean): void {
    this.#survol = dedans;
    this.#interagir();
  }

  protected focaliser(dedans: boolean): void {
    this.#focus = dedans;
    this.#interagir();
  }

  protected debutGlisse(evenement: PointerEvent): void {
    if (evenement.button !== 0) return;
    this.#changement = null;
    this.#glisse = { x: evenement.clientX, position: this.#position, bouge: false };
    this.#interagir();
  }

  protected glisser(evenement: PointerEvent): void {
    const glisse = this.#glisse;
    if (!glisse) return;
    const ecart = evenement.clientX - glisse.x;
    if (Math.abs(ecart) > SEUIL_GLISSE) glisse.bouge = true;
    if (!glisse.bouge) return;
    this.#position = glisse.position - ecart / this.#pasEcran();
    this.#interagir();
    this.#poser();
  }

  protected finGlisse(): void {
    const glisse = this.#glisse;
    this.#glisse = null;
    if (!glisse?.bouge) return;
    // Le clic qui suit le relâchement ne doit pas choisir la carte sous le pointeur.
    this.#ignorerClic = true;
    setTimeout(() => (this.#ignorerClic = false));
    this.#vers(Math.round(this.#position));
  }

  #aller(pas: number): void {
    const base = this.#changement?.vers ?? Math.round(this.#position);
    this.#vers(base + pas);
  }

  #vers(cible: number): void {
    this.#interagir();
    if (!this.#mouvementPermis()) {
      this.#changement = null;
      this.#position = cible;
      this.#poser();
      return;
    }
    this.#changement = { de: this.#position, vers: cible, debut: this.#maintenant() };
    this.#lancer();
  }

  #interagir(): void {
    this.#derniereInteraction = this.#maintenant();
    this.#vitesseCourante = 0;
    this.#lancer();
  }

  #lancer(): void {
    const fenetre = this.#hote.nativeElement.ownerDocument.defaultView;
    if (this.#image || !fenetre?.requestAnimationFrame) return;
    this.#precedente = this.#maintenant();
    this.#image = fenetre.requestAnimationFrame((t) => this.#pas(t));
  }

  #pas(maintenant: number): void {
    this.#image = 0;
    const dt = Math.min(PAS_MAX_S, Math.max(0, (maintenant - this.#precedente) / MS_PAR_SECONDE));
    this.#precedente = maintenant;
    let continuer = this.#glisse !== null;
    const changement = this.#changement;
    if (changement) {
      const t = Math.min(1, (maintenant - changement.debut) / DUREE_CHANGEMENT_MS);
      this.#position = changement.de + (changement.vers - changement.de) * adoucir(t);
      if (t >= 1) this.#changement = null;
      continuer = true;
    } else if (this.#peutDefiler()) {
      const max = 1 / Math.max(1, this.vitesse());
      this.#vitesseCourante = Math.min(max, this.#vitesseCourante + (max * dt) / RAMPE_S);
      this.#position += this.#vitesseCourante * dt;
      continuer = true;
    } else if (this.#attendReprise()) {
      continuer = true;
    }
    this.enLecture.set(this.#changement === null && this.#vitesseCourante > 0);
    this.#poser();
    if (continuer && this.#visible) this.#lancer();
  }

  /** Le défilement automatique est permis mais attend la fin du délai après une interaction. */
  #attendReprise(): boolean {
    return this.#defilementPermis() && !this.#peutDefiler();
  }

  #defilementPermis(): boolean {
    const document = this.#hote.nativeElement.ownerDocument;
    return (
      this.defilementAuto() &&
      this.elements().length > 1 &&
      this.#mouvementPermis() &&
      this.#visible &&
      !document.hidden
    );
  }

  #peutDefiler(): boolean {
    return (
      this.#defilementPermis() &&
      !this.#survol &&
      !this.#focus &&
      this.#glisse === null &&
      this.#maintenant() - this.#derniereInteraction >= DELAI_REPRISE_MS
    );
  }

  #poser(): void {
    const n = this.elements().length;
    const cartes = this.cartes();
    if (n === 0 || cartes.length !== n) return;
    for (const [index, carte] of cartes.entries()) {
      const k = decalage(index, this.#position, n);
      const element = carte.nativeElement;
      element.style.setProperty('--k', arrondir(k));
      element.style.setProperty('--ka', arrondir(Math.abs(k)));
      element.dataset['visible'] = String(Math.abs(k) < PORTEE_VISIBLE);
    }
    const actif = modulo(Math.round(this.#position), n);
    if (actif !== this.actif()) {
      this.actif.set(actif);
      this.changement.emit(actif);
    }
  }

  #observer(): void {
    const hote = this.#hote.nativeElement;
    const document = hote.ownerDocument;
    const fenetre = document.defaultView;
    const surVisibilite = (): void => this.#interagir();
    document.addEventListener('visibilitychange', surVisibilite);
    let observateur: IntersectionObserver | null = null;
    if (fenetre && 'IntersectionObserver' in fenetre) {
      observateur = new fenetre.IntersectionObserver(([entree]) => {
        this.#visible = entree?.isIntersecting ?? true;
        if (this.#visible) this.#lancer();
      });
      observateur.observe(hote);
    }
    this.#destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', surVisibilite);
      observateur?.disconnect();
      if (this.#image) fenetre?.cancelAnimationFrame(this.#image);
      this.#image = 0;
    });
  }

  #pasEcran(): number {
    const largeur = this.cartes()[0]?.nativeElement.offsetWidth ?? 0;
    return Math.max(1, largeur * PAS_ECRAN);
  }

  #mouvementPermis(): boolean {
    const hote = this.#hote.nativeElement;
    if (!this.animations() || hote.closest('.ngs-sans-animation')) return false;
    return !hote.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')
      ?.matches;
  }

  #maintenant(): number {
    return this.#hote.nativeElement.ownerDocument.defaultView?.performance.now() ?? 0;
  }

  #borner(index: number): number {
    const n = this.elements().length;
    return n === 0 ? 0 : modulo(Math.round(index), n);
  }
}
