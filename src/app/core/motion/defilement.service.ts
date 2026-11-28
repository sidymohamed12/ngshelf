import { DOCUMENT, Service, inject } from '@angular/core';
import { NavigationStart, Router, Scroll } from '@angular/router';
import type Lenis from 'lenis';
import { MotionService } from './motion.service';

/** Durée du défilement vers une section avec Lenis, en secondes. */
const DUREE_LENIS_S = 1.1;
/** Air laissé entre le bas du header collé et le haut de la section. */
const AIR_SOUS_HEADER_PX = 16;
/** Écart toléré entre la section et sa place sous le header avant de recaler. */
const TOLERANCE_RECALAGE_PX = 4;
const SELECTEUR_HEADER = '.ngs-header';

/** Chemin d'une adresse, sans paramètres ni fragment. */
function cheminDe(url: string): string {
  return url.split(/[?#]/)[0] ?? '';
}

/**
 * Défilement doux vers les sections de la page (ADR 0025) : les liens « #section » (accueil, « À propos »)
 * glissent au lieu de sauter. Le routeur ne défile plus vers les ancres (`anchorScrolling: 'disabled'`) :
 * ce service reçoit l'ancre de chaque navigation (événement `Scroll`) et la rejoint ainsi.
 *
 * - Lenis actif (accueil, « À propos ») : `lenis.scrollTo`, pour rester d'accord avec son défilement lissé ;
 *   sinon `window.scrollTo({ behavior: 'smooth' })`.
 * - Mouvement réduit (`MotionService`) : saut instantané. Arrivée sur une autre page, ou premier chargement
 *   avec une ancre dans l'adresse : saut instantané aussi (un glissement depuis le haut serait inutile).
 * - Le header collé est déduit de la position ; la section reçoit le focus (sans défilement) pour que le
 *   clavier et les lecteurs d'écran partent de là. L'adresse porte déjà le fragment (navigation du routeur).
 * - Sans navigateur (prérendu) : rien.
 */
@Service()
export class DefilementService {
  readonly #document = inject(DOCUMENT);
  readonly #router = inject(Router);
  readonly #motion = inject(MotionService);
  #lenis: Lenis | null = null;
  #cheminAvant: string | null = null;

  constructor() {
    this.#router.events.subscribe((evenement) => {
      // La page quittée est celle de l'adresse au départ de la navigation (le routeur ne la change qu'à l'arrivée).
      if (evenement instanceof NavigationStart) this.#cheminAvant = cheminDe(this.#router.url);
      else if (evenement instanceof Scroll) {
        this.suivreNavigation(evenement.routerEvent.url, evenement.anchor, this.#cheminAvant);
      }
    });
  }

  /**
   * Une navigation s'est terminée sur `url`, avec l'ancre `ancre` (fragment), en partant de la page
   * `cheminAvant` : on rejoint la section en douceur si la page est la même, d'un saut sinon (arrivée sur la
   * page, premier chargement).
   */
  suivreNavigation(url: string, ancre: string | null, cheminAvant: string | null): void {
    if (ancre) this.versSection(ancre, cheminAvant === cheminDe(url));
  }

  /** Lenis de la page en cours (accueil, « À propos »), ou null quand il n'y en a pas. */
  enregistrerLenis(lenis: Lenis | null): void {
    this.#lenis = lenis;
  }

  /** Fragment de l'adresse courante (sans le #), pour savoir si un lien vise déjà la section affichée. */
  fragmentCourant(): string | null {
    return this.#router.parseUrl(this.#router.url).fragment;
  }

  /**
   * Défile jusqu'à la section `id` ; `doux` faux force le saut. Renvoie faux si la section n'existe pas
   * (le routeur a pu naviguer avant que la page soit rendue : un autre événement suivra).
   */
  versSection(id: string, doux = true): boolean {
    const fenetre = this.#document.defaultView;
    const cible = this.#document.getElementById(id);
    if (!fenetre || !cible) return false;
    const glisse = doux && !this.#motion.mouvementReduit();
    const decalage = this.#decalage(cible, fenetre);
    const haut = (): number =>
      Math.max(0, cible.getBoundingClientRect().top + fenetre.scrollY - decalage);
    if (this.#lenis && glisse) {
      const lenis = this.#lenis;
      // La page a grandi depuis la création de Lenis (images, sections épinglées) : sa limite doit être à jour.
      lenis.resize();
      // Position chiffrée (et non l'élément) : Lenis retrancherait lui-même la marge de défilement de la section.
      lenis.scrollTo(haut(), {
        duration: DUREE_LENIS_S,
        // Des sections épinglées plus haut changent la page pendant le glissement : on recale à l'arrivée.
        onComplete: () => this.#recaler(lenis, cible, haut),
      });
    } else {
      fenetre.scrollTo({ top: haut(), behavior: glisse ? 'smooth' : 'instant' });
    }
    this.#focaliser(cible);
    return true;
  }

  #recaler(lenis: Lenis, cible: HTMLElement, haut: () => number): void {
    const ecart = haut() - lenis.scroll;
    if (Math.abs(ecart) > TOLERANCE_RECALAGE_PX) lenis.scrollTo(haut(), { immediate: true });
  }

  /** Ce que le header collé, ou la marge de défilement de la section, cache en haut de l'écran. */
  #decalage(cible: HTMLElement, fenetre: Window): number {
    const header = this.#document.querySelector<HTMLElement>(SELECTEUR_HEADER);
    const sousHeader = header ? header.getBoundingClientRect().height + AIR_SOUS_HEADER_PX : 0;
    const marge = Number.parseFloat(fenetre.getComputedStyle(cible).scrollMarginTop) || 0;
    return Math.max(sousHeader, marge);
  }

  #focaliser(cible: HTMLElement): void {
    if (!cible.hasAttribute('tabindex')) cible.setAttribute('tabindex', '-1');
    cible.focus({ preventScroll: true });
  }
}
