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
  linkedSignal,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';

export interface ElementGalerieRoue {
  readonly image: string;
  readonly titre: string;
  readonly sousTitre?: string;
  readonly alt?: string;
}

/** Opacité d'un titre inactif selon sa distance |k| au titre actif : [distance, opacité], interpolée. */
const OPACITES: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 0.38],
  [2, 0.2],
  [3, 0.07],
  [3.6, 0],
];
const DISTANCE_MAX = 4;
const DUREE_DEFAUT_MS = 160;
/** La rotation de la roue dure ce multiple de `--ngs-duration`. */
const FACTEUR_ROTATION = 4;
const PAUSE_MOLETTE_MS = 450;
const SEUIL_MOLETTE = 50;
const SEUIL_BALAYAGE_PX = 40;
const IMAGE_DT_MAX_MS = 100;
const DEGRES_PAR_RADIAN = 180 / Math.PI;
const PRECISION = 100;

function borner(valeur: number, min: number, max: number): number {
  return Math.min(Math.max(valeur, min), max);
}

function opacite(distance: number): number {
  const dernier = OPACITES[OPACITES.length - 1];
  if (!dernier || distance >= dernier[0]) return 0;
  for (let i = 1; i < OPACITES.length; i++) {
    const [k1, o1] = OPACITES[i] ?? [0, 0];
    if (distance <= k1) {
      const [k0, o0] = OPACITES[i - 1] ?? [0, 0];
      return o0 + ((o1 - o0) * (distance - k0)) / (k1 - k0);
    }
  }
  return 0;
}

/** Durée lue dans `--ngs-duration` (« 160ms » ou « 0.2s »), en millisecondes. */
function lireDuree(hote: HTMLElement): number {
  const brut =
    hote.ownerDocument.defaultView?.getComputedStyle(hote).getPropertyValue('--ngs-duration') ?? '';
  const valeur = Number.parseFloat(brut);
  if (Number.isNaN(valeur)) return DUREE_DEFAUT_MS;
  return brut.trim().endsWith('ms') ? valeur : valeur * 1000;
}

function mouvementPermis(hote: HTMLElement, animations: boolean): boolean {
  if (!animations || hote.closest('.ngs-sans-animation')) return false;
  const reduit = hote.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
  return !reduit?.matches;
}

interface Rotation {
  readonly depart: number;
  readonly arrivee: number;
  /** Instant de la première image de la rotation, sur l'horloge de requestAnimationFrame. */
  debut: number | null;
  readonly duree: number;
}

/**
 * Galerie « roue » : les titres sont posés sur un arc de cercle, l'image du titre actif à côté. Défilement
 * infini et lecture automatique (le titre actif se remplit en couleur, puis la roue passe au suivant),
 * clic, molette, flèches du clavier et balayage tactile. Une seule boucle `requestAnimationFrame`, sans
 * bibliothèque : elle s'arrête quand rien ne bouge, se met en pause au survol, au focus, hors de l'écran,
 * et ne tourne jamais en mouvement réduit.
 */
@Component({
  selector: 'ngs-galerie-roue',
  templateUrl: './galerie-roue.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalerieRoueComponent {
  readonly elements = input.required<readonly ElementGalerieRoue[]>();
  /** Nom accessible de la galerie. */
  readonly libelle = input('Galerie');
  /** Élément affiché au départ (0 pour le premier). */
  readonly indexInitial = input(2, { transform: numberAttribute });
  /** Hauteur du composant en pixels. */
  readonly hauteur = input(560, { transform: numberAttribute });
  /** Rayon de l'arc en pixels (plus grand = arc plus plat). */
  readonly rayonArc = input(380, { transform: numberAttribute });
  /** Angle entre deux titres, en degrés. */
  readonly angle = input(15, { transform: numberAttribute });
  /** Le dernier élément revient au premier. */
  readonly boucle = input(true, { transform: booleanAttribute });
  /** Passe au suivant quand le titre actif est entièrement rempli. */
  readonly lectureAuto = input(true, { transform: booleanAttribute });
  /** Temps de remplissage du titre actif, en secondes. */
  readonly dureeLecture = input(4, { transform: numberAttribute });
  /** Met la lecture en pause au survol et au focus. */
  readonly pauseAuSurvol = input(true, { transform: booleanAttribute });
  /** Autorise la molette sur la liste des titres. */
  readonly molette = input(true, { transform: booleanAttribute });
  /** false : pas de rotation animée ni de lecture automatique (aussi : .ngs-sans-animation sur un parent, ou mouvement réduit). */
  readonly animations = input(true, { transform: booleanAttribute });

  readonly #depart = computed(() =>
    borner(Math.round(this.indexInitial()), 0, Math.max(0, this.elements().length - 1)),
  );
  protected readonly actif = linkedSignal(() => this.#depart());
  /** Position flottante de la roue (c'est elle qui est animée) : indépendante de l'élément actif, qu'elle rejoint. */
  readonly #position = linkedSignal(() => this.#depart());
  /** Progression (0 à 1) du remplissage du titre actif. */
  readonly #progression = signal(0);
  readonly #survol = signal(false);
  readonly #focus = signal(false);
  readonly #visible = signal(true);

  protected readonly noeuds = computed(() => {
    const elements = this.elements();
    const total = elements.length;
    const rayon = this.rayonArc();
    const pas = this.angle() / DEGRES_PAR_RADIAN;
    const position = this.#position();
    return elements.map((element, i) => {
      let k = i - position;
      if (this.boucle()) k = ((((k + total / 2) % total) + total) % total) - total / 2;
      const theta = borner(k, -DISTANCE_MAX, DISTANCE_MAX) * pas;
      const distance = Math.abs(k);
      const opaciteBase = opacite(distance);
      const presence = borner(1 - distance * 1.6, 0, 1);
      return {
        element,
        x: Math.round(rayon * (Math.cos(theta) - 1) * PRECISION) / PRECISION,
        y: Math.round(rayon * Math.sin(theta) * PRECISION) / PRECISION,
        angle: Math.round(theta * DEGRES_PAR_RADIAN * PRECISION) / PRECISION,
        base: opaciteBase * (1 - presence),
        presence,
        progression: i === this.actif() ? this.#progression() : 0,
        cache: opaciteBase < 0.02,
      };
    });
  });

  private readonly liste = viewChild.required<ElementRef<HTMLElement>>('liste');
  readonly #hote = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);

  #image = 0;
  #precedente: number | null = null;
  #rotation: Rotation | null = null;
  #cumulMolette = 0;
  #derniereMolette = 0;
  #dernierPas = 0;
  #departBalayage: number | null = null;
  #balaye = false;
  #demarre = false;

  constructor() {
    afterNextRender(() => {
      this.#demarre = true;
      this.#observerVisibilite();
      this.#relancer();
      this.#destroyRef.onDestroy(() => this.#arreter());
    });
  }

  protected survoler(oui: boolean): void {
    this.#survol.set(oui);
    this.#relancer();
  }

  protected focaliser(oui: boolean): void {
    this.#focus.set(oui);
    this.#relancer();
  }

  protected cliquer(index: number): void {
    if (this.#balaye) {
      this.#balaye = false;
      return;
    }
    this.#aller(index);
  }

  protected touche(evenement: KeyboardEvent): void {
    const cible = this.#indexVise(evenement.key);
    if (cible === null) return;
    evenement.preventDefault();
    if (!this.#aller(cible)) return;
    afterNextRender(
      () => this.liste().nativeElement.querySelectorAll('button')[this.actif()]?.focus(),
      { injector: this.#injector },
    );
  }

  protected surMolette(evenement: WheelEvent): void {
    if (!this.molette()) return;
    const sens = evenement.deltaY > 0 ? 1 : -1;
    if (!this.#peutAvancer(sens)) {
      this.#cumulMolette = 0;
      return; // aux extrémités, la page défile normalement
    }
    evenement.preventDefault();
    const maintenant = evenement.timeStamp;
    if (maintenant - this.#derniereMolette > 200) this.#cumulMolette = 0;
    this.#derniereMolette = maintenant;
    this.#cumulMolette += evenement.deltaY;
    if (maintenant - this.#dernierPas < PAUSE_MOLETTE_MS) return;
    if (Math.abs(this.#cumulMolette) < SEUIL_MOLETTE) return;
    this.#dernierPas = maintenant;
    this.#cumulMolette = 0;
    this.#aller(this.actif() + sens);
  }

  protected toucherDebut(evenement: PointerEvent): void {
    if (evenement.pointerType !== 'touch') return;
    this.#departBalayage = evenement.clientY;
    this.#balaye = false;
  }

  protected toucherFin(evenement: PointerEvent): void {
    if (evenement.pointerType !== 'touch' || this.#departBalayage === null) return;
    const dy = evenement.clientY - this.#departBalayage;
    this.#departBalayage = null;
    if (Math.abs(dy) > SEUIL_BALAYAGE_PX && this.#aller(this.actif() + (dy < 0 ? 1 : -1))) {
      this.#balaye = true; // le « click » qui suit le balayage ne doit pas changer d'élément une seconde fois
    }
  }

  /** Va à l'index donné ; renvoie faux si rien ne change (la page peut alors défiler aux extrémités). */
  #aller(index: number): boolean {
    const total = this.elements().length;
    if (total === 0) return false;
    const cible = this.boucle() ? ((index % total) + total) % total : borner(index, 0, total - 1);
    if (cible === this.actif()) return false;
    this.actif.set(cible);
    this.#progression.set(0);
    let arrivee = cible;
    if (this.boucle()) {
      // chemin le plus court sur le cercle
      const ecart =
        ((((cible - this.#position() + total / 2) % total) + total) % total) - total / 2;
      arrivee = this.#position() + ecart;
    }
    const hote = this.#hote.nativeElement;
    if (mouvementPermis(hote, this.animations()) && this.#demarre) {
      this.#rotation = {
        depart: this.#position(),
        arrivee,
        debut: null,
        duree: lireDuree(hote) * FACTEUR_ROTATION,
      };
    } else {
      this.#rotation = null;
      this.#position.set(arrivee);
    }
    this.#relancer();
    return true;
  }

  #peutAvancer(sens: 1 | -1): boolean {
    const total = this.elements().length;
    if (this.boucle()) return total > 1;
    const suivant = this.actif() + sens;
    return suivant >= 0 && suivant < total;
  }

  #indexVise(touche: string): number | null {
    if (touche === 'ArrowDown' || touche === 'ArrowRight') return this.actif() + 1;
    if (touche === 'ArrowUp' || touche === 'ArrowLeft') return this.actif() - 1;
    if (touche === 'Home') return 0;
    return touche === 'End' ? this.elements().length - 1 : null;
  }

  // ───────────────────────── Boucle d'animation ─────────────────────────

  #lectureEnCours(): boolean {
    const hote = this.#hote.nativeElement;
    const pause = this.pauseAuSurvol() && (this.#survol() || this.#focus());
    return (
      this.lectureAuto() &&
      this.elements().length > 1 &&
      this.#visible() &&
      !pause &&
      mouvementPermis(hote, this.animations())
    );
  }

  /** Lance la boucle si elle est arrêtée ; elle s'arrête d'elle-même quand rien ne bouge. */
  #relancer(): void {
    if (!this.#demarre || this.#image) return;
    this.#precedente = null;
    this.#planifier();
  }

  #planifier(): void {
    const fenetre = this.#hote.nativeElement.ownerDocument.defaultView;
    if (fenetre && !this.#image) this.#image = fenetre.requestAnimationFrame((t) => this.#pas(t));
  }

  #arreter(): void {
    if (this.#image)
      this.#hote.nativeElement.ownerDocument.defaultView?.cancelAnimationFrame(this.#image);
    this.#image = 0;
  }

  #pas(maintenant: number): void {
    this.#image = 0;
    const dt =
      this.#precedente === null ? 0 : Math.min(maintenant - this.#precedente, IMAGE_DT_MAX_MS);
    this.#precedente = maintenant;
    this.#avancerRotation(maintenant);
    const lecture = this.#lectureEnCours();
    if (lecture) this.#avancerLecture(dt);
    if (this.#rotation || lecture) this.#planifier();
  }

  #avancerRotation(maintenant: number): void {
    const rotation = this.#rotation;
    if (!rotation) return;
    rotation.debut ??= maintenant;
    const t = borner((maintenant - rotation.debut) / rotation.duree, 0, 1);
    const facile = 1 - Math.pow(1 - t, 3);
    this.#position.set(rotation.depart + (rotation.arrivee - rotation.depart) * facile);
    if (t >= 1) this.#rotation = null;
  }

  #avancerLecture(dt: number): void {
    const duree = Math.max(0.5, this.dureeLecture()) * 1000;
    const progression = this.#progression() + dt / duree;
    if (progression < 1) {
      this.#progression.set(progression);
      return;
    }
    this.#progression.set(0);
    this.#aller(this.actif() + 1);
  }

  #observerVisibilite(): void {
    const Observateur = this.#hote.nativeElement.ownerDocument.defaultView?.IntersectionObserver;
    if (!Observateur) return;
    const observateur = new Observateur(([entree]) => {
      this.#visible.set(entree?.isIntersecting ?? true);
      this.#relancer();
    });
    observateur.observe(this.#hote.nativeElement);
    this.#destroyRef.onDestroy(() => observateur.disconnect());
  }
}
