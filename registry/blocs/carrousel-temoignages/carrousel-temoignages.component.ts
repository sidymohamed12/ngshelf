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
  linkedSignal,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/** Pictogramme d'un logo ; `aucune` n'affiche que le nom. */
export type IconeLogo = 'traits' | 'carre' | 'disque' | 'cube' | 'vagues' | 'aucune';

export interface Temoignage {
  readonly image: string;
  readonly citation: string;
  readonly nom: string;
  readonly fonction: string;
  /** Nom du logo (de `logos`) allumé quand ce témoignage est affiché. */
  readonly entreprise: string;
  /** Texte alternatif du portrait ; par défaut « Portrait de <nom> ». */
  readonly alt?: string;
}

export interface LogoEntreprise {
  readonly nom: string;
  readonly icone?: IconeLogo;
}

/** Cartes visibles de part et d'autre de la carte active ; au-delà, elles sont masquées. */
const PORTEE = 2;
const MS_PAR_SECONDE = 1000;
const DUREE_MIN_MS = 1000;
const TEXTES = {
  carrousel: 'Témoignages',
  precedent: 'Témoignage précédent',
  suivant: 'Témoignage suivant',
  pause: 'Mettre le défilement en pause',
  lecture: 'Relancer le défilement',
  voir: 'Afficher le témoignage de',
} as const;

let compteur = 0;

function mouvementPermis(hote: HTMLElement, animations: boolean): boolean {
  if (!animations || hote.closest('.ngs-sans-animation')) return false;
  const reduit = hote.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
  return !reduit?.matches;
}

/**
 * Bloc « témoignages » : un carrousel de cartes portrait (la carte active au centre, ses voisines atténuées
 * derrière) synchronisé avec une grille de logos, à côté d'un titre, d'une phrase et de deux boutons.
 * Défilement automatique en boucle, mis en pause au survol, au focus, hors de l'écran et sur demande
 * (bouton), jamais en mouvement réduit. Flèches du clavier, boutons Précédent / Suivant, clic sur un logo
 * ou sur une carte voisine.
 */
@Component({
  selector: 'ngs-carrousel-temoignages',
  imports: [RouterLink],
  templateUrl: './carrousel-temoignages.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarrouselTemoignagesComponent {
  readonly temoignages = input.required<readonly Temoignage[]>();
  readonly logos = input.required<readonly LogoEntreprise[]>();
  readonly titre = input.required<string>();
  readonly texte = input('');
  readonly niveauTitre = input<1 | 2>(2);
  readonly action = input('');
  readonly routeAction = input('');
  readonly lien = input('');
  readonly routeLien = input('');
  /** Nom accessible du carrousel. */
  readonly libelle = input<string>(TEXTES.carrousel);
  /** Défilement automatique. */
  readonly lectureAuto = input(true, { transform: booleanAttribute });
  /** Durée d'affichage de chaque témoignage, en secondes. */
  readonly dureeAffichage = input(4, { transform: numberAttribute });
  /** false : pas de défilement automatique, cartes changées sans transition (aussi : .ngs-sans-animation sur un parent, ou mouvement réduit). */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly textes = TEXTES;
  protected readonly actif = linkedSignal(() => {
    this.temoignages();
    return 0;
  });
  protected readonly entrepriseActive = computed(
    () => this.temoignages()[this.actif()]?.entreprise ?? '',
  );
  /** Cartes avec leur position (de -2 à 2 ; au-delà, masquées) : tout ce que le gabarit lit. */
  protected readonly cartes = computed(() => {
    const actif = this.actif();
    const sauts = this.sautantes();
    return this.temoignages().map((temoignage, index) => {
      const position = Math.max(-PORTEE, Math.min(PORTEE, this.#decalage(index, actif)));
      return {
        temoignage,
        index,
        position,
        saut: sauts.has(index),
        voisine: Math.abs(position) === 1,
        alt: temoignage.alt ?? `Portrait de ${temoignage.nom}`,
        voir: `${TEXTES.voir} ${temoignage.nom}`,
      };
    });
  });
  protected readonly logosAffiches = computed(() =>
    this.logos().map((logo) => ({
      nom: logo.nom,
      icone: logo.icone ?? 'aucune',
      actif: logo.nom === this.entrepriseActive(),
    })),
  );
  /** Cartes qui traversent la scène d'un bord à l'autre (boucle) : repositionnées sans transition. */
  protected readonly sautantes = signal<ReadonlySet<number>>(new Set());
  /** Pause demandée par le visiteur (bouton). */
  protected readonly enPause = signal(false);
  readonly #survol = signal(false);
  readonly #visible = signal(true);
  readonly #hote = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly #destroyRef = inject(DestroyRef);
  #minuteur: ReturnType<typeof setInterval> | undefined;

  protected readonly libellePause = computed(() =>
    this.enPause() ? TEXTES.lecture : TEXTES.pause,
  );
  protected readonly id = `ngs-temoignages-${compteur++}`;

  /** Le défilement tourne : demandé, permis, et ni mis en pause ni survolé. */
  protected readonly enLecture = computed(
    () => this.lectureAuto() && !this.enPause() && !this.#survol(),
  );

  constructor() {
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') return;
      const observateur = new IntersectionObserver(([entree]) =>
        this.#visible.set(entree?.isIntersecting ?? true),
      );
      observateur.observe(this.#hote);
      this.#destroyRef.onDestroy(() => observateur.disconnect());
    });
    afterRenderEffect(() => {
      this.enLecture();
      this.dureeAffichage();
      this.animations();
      this.temoignages();
      untracked(() => this.#demarrer());
    });
    this.#destroyRef.onDestroy(() => this.#arreter());
  }

  /** Décalage signé le plus court de la carte `i` par rapport à la carte `a`. */
  #decalage(i: number, a: number): number {
    const total = this.temoignages().length;
    const ecart = (((i - a) % total) + total) % total;
    return ecart > total / 2 ? ecart - total : ecart;
  }

  #aller(suivant: number): void {
    const total = this.temoignages().length;
    if (total === 0) return;
    const cible = ((suivant % total) + total) % total;
    const precedent = this.actif();
    if (cible === precedent) return;
    const traversent = new Set<number>();
    for (let i = 0; i < total; i++) {
      if (Math.abs(this.#decalage(i, cible) - this.#decalage(i, precedent)) > PORTEE) {
        traversent.add(i);
      }
    }
    this.sautantes.set(traversent);
    this.actif.set(cible);
    if (traversent.size > 0) {
      requestAnimationFrame(() => requestAnimationFrame(() => this.sautantes.set(new Set())));
    }
  }

  /** Action du visiteur : la minuterie repart de zéro. */
  protected choisir(index: number): void {
    this.#aller(index);
    this.#demarrer();
  }

  protected precedent(): void {
    this.choisir(this.actif() - 1);
  }

  protected suivant(): void {
    this.choisir(this.actif() + 1);
  }

  protected choisirEntreprise(entreprise: string): void {
    const index = this.temoignages().findIndex((t) => t.entreprise === entreprise);
    if (index >= 0) this.choisir(index);
  }

  protected basculerPause(): void {
    this.enPause.update((pause) => !pause);
  }

  protected surTouche(evenement: KeyboardEvent): void {
    if (evenement.key === 'ArrowRight') {
      evenement.preventDefault();
      this.suivant();
    } else if (evenement.key === 'ArrowLeft') {
      evenement.preventDefault();
      this.precedent();
    }
  }

  protected survoler(survol: boolean): void {
    this.#survol.set(survol);
  }

  #demarrer(): void {
    this.#arreter();
    const permis = mouvementPermis(this.#hote, this.animations());
    if (!this.enLecture() || !permis || this.temoignages().length < 2) return;
    const duree = Math.max(DUREE_MIN_MS, this.dureeAffichage() * MS_PAR_SECONDE);
    this.#minuteur = setInterval(() => {
      if (this.#visible() && !this.#hote.ownerDocument.hidden) this.#aller(this.actif() + 1);
    }, duree);
  }

  #arreter(): void {
    if (this.#minuteur === undefined) return;
    clearInterval(this.#minuteur);
    this.#minuteur = undefined;
  }
}
