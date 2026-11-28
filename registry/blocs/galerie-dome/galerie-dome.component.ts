import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';

export interface ImageDome {
  readonly src: string;
  readonly alt: string;
}

interface Tuile {
  readonly x: number;
  readonly y: number;
  readonly image: ImageDome;
}

interface Ouverture {
  readonly image: ImageDome;
  /** Rectangle de la tuile cliquée au moment du clic ; absent pour une ouverture au clavier. */
  readonly depart: { left: number; top: number; width: number; height: number } | null;
}

const COLONNES_DEPART = -37;
const PAS_COLONNE = 2;
const LIGNES_PAIRES = [-4, -2, 0, 2, 4];
const LIGNES_IMPAIRES = [-3, -1, 1, 3, 5];
const RAYON_MIN_PX = 600;
const RAPPORT_HAUTEUR_RAYON = 1.35;
const SEUIL_DEPLACEMENT_CARRE = 16;
const FENETRE_VITESSE_MS = 100;
const VITESSE_MAX = 1.4;
const ECHELLE_VITESSE = 80;
const DIVISEUR_INERTIE = 200;
const DELAI_ANTI_CLIC_MS = 80;
/** Un doigt immobile plus de ce délai avant d'être relâché ne lance pas la rotation. */
const ARRET_AVANT_RELACHE_MS = 80;
const OUVERTURE_MIN_MS = 250;
/** L'ouverture d'une image dure ce multiple de `--ngs-duration`. */
const FACTEUR_OUVERTURE = 2;
const DUREE_DEFAUT_MS = 160;

function borner(valeur: number, min: number, max: number): number {
  return Math.min(Math.max(valeur, min), max);
}

function angleSigne(degres: number): number {
  return ((((degres + 180) % 360) + 360) % 360) - 180;
}

/** Les tuiles d'un dôme de `segments` colonnes : cinq par colonne, en quinconce. */
function emplacements(segments: number): readonly { x: number; y: number }[] {
  return Array.from({ length: segments }, (_, c) => c).flatMap((c) =>
    (c % 2 === 0 ? LIGNES_PAIRES : LIGNES_IMPAIRES).map((y) => ({
      x: COLONNES_DEPART + c * PAS_COLONNE,
      y,
    })),
  );
}

/** Répète les images sur les emplacements, sans deux tuiles consécutives identiques quand c'est possible. */
function construireTuiles(images: readonly ImageDome[], segments: number): readonly Tuile[] {
  const [premiere] = images;
  if (!premiere) return [];
  const places = emplacements(segments);
  const choisies = places.map((_, i) => images[i % images.length] ?? premiere);
  for (let i = 1; i < choisies.length; i++) {
    const courante = choisies[i];
    if (courante?.src !== choisies[i - 1]?.src) continue;
    const autre = choisies.findIndex((candidate, j) => j > i && candidate.src !== courante?.src);
    const echange = choisies[autre];
    if (courante && echange) {
      choisies[i] = echange;
      choisies[autre] = courante;
    }
  }
  return places.map((place, i) => ({ ...place, image: choisies[i] ?? premiere }));
}

function lireDuree(hote: HTMLElement): number {
  const brut =
    hote.ownerDocument.defaultView?.getComputedStyle(hote).getPropertyValue('--ngs-duration') ?? '';
  const valeur = Number.parseFloat(brut);
  if (Number.isNaN(valeur)) return DUREE_DEFAUT_MS;
  return brut.trim().endsWith('ms') ? valeur : valeur * 1000;
}

function mouvementPermis(hote: HTMLElement, animations: boolean): boolean {
  if (!animations || hote.closest('.ngs-sans-animation')) return false;
  return !hote.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

/**
 * Galerie sur un dôme 3D : les images tapissent l'intérieur d'une sphère qu'on fait tourner au glisser
 * (souris, doigt) avec de l'inertie ; un clic ou Entrée agrandit une image, Échap la referme (la visionneuse
 * prend le focus à l'ouverture et le rend à la fermeture). Les tuiles sont
 * décoratives pour le clavier et les lecteurs d'écran : une liste d'accès, une entrée par image distincte,
 * ouvre la même visionneuse. Aucune bibliothèque : variables CSS, `requestAnimationFrame` pour l'inertie,
 * Web Animations pour l'ouverture.
 */
@Component({
  selector: 'ngs-galerie-dome',
  templateUrl: './galerie-dome.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalerieDomeComponent {
  readonly images = input.required<readonly ImageDome[]>();
  /** Nom accessible de la galerie. */
  readonly libelle = input('Galerie en dôme');
  /** Hauteur du dôme en pixels. */
  readonly hauteur = input(560, { transform: numberAttribute });
  /** Nombre de colonnes de tuiles sur le tour du dôme. */
  readonly segments = input(35, { transform: numberAttribute });
  /** Taille du dôme par rapport à la largeur du composant (0,3 à 1). */
  readonly ajustement = input(0.5, { transform: numberAttribute });
  /** Pixels de glisser pour un degré de rotation : plus c'est grand, plus la rotation est lente. */
  readonly sensibilite = input(20, { transform: numberAttribute });
  /** Durée de l'inertie après un lancer (0 = s'arrête net, 1 = glisse longtemps). */
  readonly amortissement = input(0.8, { transform: numberAttribute });
  /** Inclinaison verticale maximale du dôme, en degrés. */
  readonly inclinaisonMax = input(5, { transform: numberAttribute });
  /** Côté de l'image agrandie, en pixels. */
  readonly tailleOuverte = input(400, { transform: numberAttribute });
  readonly nuancesDeGris = input(true, { transform: booleanAttribute });
  /** false : ni inertie ni transition d'ouverture (aussi : .ngs-sans-animation sur un parent, ou mouvement réduit). */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly tuiles = computed(() =>
    construireTuiles(this.images(), Math.max(8, this.segments())),
  );
  protected readonly distinctes = computed(() => {
    const vues = new Set<string>();
    return this.images().filter((image) => {
      const nouvelle = !vues.has(image.src);
      vues.add(image.src);
      return nouvelle;
    });
  });
  protected readonly rotation = signal({ x: 0, y: 0 });
  protected readonly ouverte = signal<Ouverture | null>(null);
  readonly #taille = signal({ largeur: 0, hauteur: 0 });
  protected readonly rayon = computed(() => {
    const { largeur, hauteur } = this.#taille();
    if (largeur === 0 || hauteur === 0) return RAYON_MIN_PX;
    const base = largeur / hauteur >= 1.3 ? largeur : Math.min(largeur, hauteur);
    const rayon = Math.min(
      base * borner(this.ajustement(), 0.3, 1),
      hauteur * RAPPORT_HAUTEUR_RAYON,
    );
    return Math.round(Math.max(rayon, RAYON_MIN_PX));
  });
  protected readonly marge = computed(() => {
    const { largeur, hauteur } = this.#taille();
    return Math.max(8, Math.round(Math.min(largeur, hauteur) * 0.25));
  });

  private readonly scene = viewChild.required<ElementRef<HTMLElement>>('scene');
  private readonly agrandie = viewChild<ElementRef<HTMLElement>>('agrandie');
  readonly #hote = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);

  #pointeur: number | null = null;
  #depart: { x: number; y: number } | null = null;
  #rotationDepart = { x: 0, y: 0 };
  #deplace = false;
  #echantillons: { t: number; x: number; y: number }[] = [];
  #inertie = 0;
  #finGlisse = 0;
  #ouvertureLe = 0;
  #declencheur: HTMLElement | null = null;

  constructor() {
    afterNextRender(() => {
      const fenetre = this.#hote.nativeElement.ownerDocument.defaultView;
      if (!fenetre) return;
      const Observateur = fenetre.ResizeObserver;
      if (Observateur) {
        const observateur = new Observateur(() => {
          const scene = this.scene().nativeElement;
          this.#taille.set({ largeur: scene.clientWidth, hauteur: scene.clientHeight });
        });
        observateur.observe(this.scene().nativeElement);
        this.#destroyRef.onDestroy(() => observateur.disconnect());
      }
      this.#destroyRef.onDestroy(() => {
        this.#arreterInertie();
        this.#retirerEcouteursGlisse();
      });
    });
  }

  // ───────────────────────── Glisser et inertie ─────────────────────────

  protected glisserDebut(evenement: PointerEvent): void {
    if (this.ouverte() || this.#pointeur !== null) return;
    if (evenement.pointerType === 'mouse' && evenement.button !== 0) return;
    this.#arreterInertie();
    this.#pointeur = evenement.pointerId;
    this.#deplace = false;
    this.#rotationDepart = this.rotation();
    this.#depart = { x: evenement.clientX, y: evenement.clientY };
    this.#echantillons = [{ t: evenement.timeStamp, x: evenement.clientX, y: evenement.clientY }];
    const fenetre = this.#hote.nativeElement.ownerDocument.defaultView;
    fenetre?.addEventListener('pointermove', this.#surDeplacement, { passive: true });
    fenetre?.addEventListener('pointerup', this.#surRelache);
    fenetre?.addEventListener('pointercancel', this.#surRelache);
  }

  readonly #surDeplacement = (evenement: PointerEvent): void => {
    if (evenement.pointerId !== this.#pointeur || !this.#depart) return;
    const dx = evenement.clientX - this.#depart.x;
    const dy = evenement.clientY - this.#depart.y;
    if (!this.#deplace && dx * dx + dy * dy > SEUIL_DEPLACEMENT_CARRE) this.#deplace = true;
    this.#echantillons.push({ t: evenement.timeStamp, x: evenement.clientX, y: evenement.clientY });
    while (
      this.#echantillons.length > 2 &&
      evenement.timeStamp - (this.#echantillons[0]?.t ?? 0) > FENETRE_VITESSE_MS
    ) {
      this.#echantillons.shift();
    }
    const sensibilite = Math.max(1, this.sensibilite());
    const max = this.inclinaisonMax();
    this.rotation.set({
      x: borner(this.#rotationDepart.x - dy / sensibilite, -max, max),
      y: angleSigne(this.#rotationDepart.y + dx / sensibilite),
    });
  };

  readonly #surRelache = (evenement: PointerEvent): void => {
    if (evenement.pointerId !== this.#pointeur) return;
    this.#retirerEcouteursGlisse();
    this.#pointeur = null;
    this.#depart = null;
    if (this.#deplace) {
      const premier = this.#echantillons[0];
      const dernier = this.#echantillons[this.#echantillons.length - 1];
      if (
        premier &&
        dernier &&
        evenement.timeStamp - dernier.t < ARRET_AVANT_RELACHE_MS &&
        dernier.t > premier.t
      ) {
        const duree = dernier.t - premier.t;
        this.#lancer((dernier.x - premier.x) / duree, (dernier.y - premier.y) / duree);
      }
      this.#finGlisse = evenement.timeStamp;
    }
    this.#echantillons = [];
  };

  #retirerEcouteursGlisse(): void {
    const fenetre = this.#hote.nativeElement.ownerDocument.defaultView;
    fenetre?.removeEventListener('pointermove', this.#surDeplacement);
    fenetre?.removeEventListener('pointerup', this.#surRelache);
    fenetre?.removeEventListener('pointercancel', this.#surRelache);
  }

  #lancer(vx: number, vy: number): void {
    const hote = this.#hote.nativeElement;
    if (!mouvementPermis(hote, this.animations())) return;
    if (Math.abs(vx) <= 0.005 && Math.abs(vy) <= 0.005) return;
    const amortissement = borner(this.amortissement(), 0, 1);
    const frottement = 0.94 + 0.055 * amortissement;
    const seuil = 0.015 - 0.01 * amortissement;
    const imagesMax = Math.round(90 + 270 * amortissement);
    const max = this.inclinaisonMax();
    let vitesseX = borner(vx, -VITESSE_MAX, VITESSE_MAX) * ECHELLE_VITESSE;
    let vitesseY = borner(vy, -VITESSE_MAX, VITESSE_MAX) * ECHELLE_VITESSE;
    let images = 0;
    const fenetre = hote.ownerDocument.defaultView;
    const pas = (): void => {
      vitesseX *= frottement;
      vitesseY *= frottement;
      images += 1;
      if ((Math.abs(vitesseX) < seuil && Math.abs(vitesseY) < seuil) || images > imagesMax) {
        this.#inertie = 0;
        return;
      }
      const { x, y } = this.rotation();
      this.rotation.set({
        x: borner(x - vitesseY / DIVISEUR_INERTIE, -max, max),
        y: angleSigne(y + vitesseX / DIVISEUR_INERTIE),
      });
      this.#inertie = fenetre?.requestAnimationFrame(pas) ?? 0;
    };
    this.#arreterInertie();
    this.#inertie = fenetre?.requestAnimationFrame(pas) ?? 0;
  }

  #arreterInertie(): void {
    if (this.#inertie)
      this.#hote.nativeElement.ownerDocument.defaultView?.cancelAnimationFrame(this.#inertie);
    this.#inertie = 0;
  }

  // ───────────────────────── Visionneuse ─────────────────────────

  protected ouvrir(evenement: Event, image: ImageDome): void {
    if (this.ouverte() || this.#deplace) return;
    if (this.#finGlisse > 0 && evenement.timeStamp - this.#finGlisse < DELAI_ANTI_CLIC_MS) return;
    const declencheur =
      evenement.currentTarget instanceof HTMLElement ? evenement.currentTarget : null;
    const rect = declencheur?.getBoundingClientRect();
    this.#declencheur = declencheur;
    this.#ouvertureLe = this.#maintenant();
    this.#arreterInertie();
    this.ouverte.set({
      image,
      depart: rect
        ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
        : null,
    });
    afterNextRender(() => this.#animerOuverture(), { injector: this.#injector });
  }

  protected fermer(): void {
    const ouverte = this.ouverte();
    if (!ouverte || this.#maintenant() - this.#ouvertureLe < OUVERTURE_MIN_MS) return;
    const figure = this.agrandie()?.nativeElement;
    const hote = this.#hote.nativeElement;
    const termine = (): void => {
      this.ouverte.set(null);
      this.#declencheur?.focus();
      this.#declencheur = null;
    };
    if (!figure?.animate || !ouverte.depart || !mouvementPermis(hote, this.animations())) {
      termine();
      return;
    }
    const arrivee = figure.getBoundingClientRect();
    const animation = figure.animate(
      [
        { transform: 'none', opacity: 1 },
        { transform: this.#transformDepuis(ouverte.depart, arrivee), opacity: 0.4 },
      ],
      {
        duration: lireDuree(hote) * FACTEUR_OUVERTURE,
        easing: 'cubic-bezier(.65,0,.35,1)',
        fill: 'forwards',
      },
    );
    void animation.finished.then(termine, termine);
  }

  #maintenant(): number {
    return this.#hote.nativeElement.ownerDocument.defaultView?.performance.now() ?? 0;
  }

  #animerOuverture(): void {
    const figure = this.agrandie()?.nativeElement;
    const ouverte = this.ouverte();
    const hote = this.#hote.nativeElement;
    figure?.focus();
    if (!figure?.animate || !ouverte?.depart || !mouvementPermis(hote, this.animations())) return;
    figure.animate(
      [
        {
          transform: this.#transformDepuis(ouverte.depart, figure.getBoundingClientRect()),
          opacity: 0.4,
        },
        { transform: 'none', opacity: 1 },
      ],
      { duration: lireDuree(hote) * FACTEUR_OUVERTURE, easing: 'cubic-bezier(.22,1,.36,1)' },
    );
  }

  #transformDepuis(depart: NonNullable<Ouverture['depart']>, arrivee: DOMRect): string {
    const dx = depart.left - arrivee.left;
    const dy = depart.top - arrivee.top;
    const ex = arrivee.width > 0 ? depart.width / arrivee.width : 1;
    const ey = arrivee.height > 0 ? depart.height / arrivee.height : 1;
    return `translate(${dx}px, ${dy}px) scale(${ex}, ${ey})`;
  }
}
