import { DOCUMENT, DestroyRef, Service, afterNextRender, inject, signal } from '@angular/core';
import {
  MessageReglages,
  MessageSortie,
  ModeApercu,
  lireMessageVersApercu,
  messageHauteur,
  messagePret,
  messageSortieFin,
  vientDuSite,
} from '@shared/apercu/protocole';
import { ORIGINES_SITE } from './origines';

const CLASSE_SOMBRE = 'dark';
const CLASSE_SANS_ANIMATION = 'ngs-sans-animation';
const SELECTEUR_HOTES = '[data-hote]';
/** Délai après lequel une sortie sans animation en cours est considérée comme terminée. */
const DELAI_DETECTION_SORTIE_MS = 80;
/** Garde-fou : la sortie est terminée au plus tard après ce délai. */
const DELAI_MAX_SORTIE_MS = 1200;
/** Marge verticale du corps de l'aperçu (styles.css : padding de 32 px). */
const MARGE_VERTICALE_PX = 32;

/** Mode et animations demandés par l'URL : l'état initial seulement, les messages prennent ensuite le relais. */
export function etatInitial(recherche: string): { mode: ModeApercu; animations: boolean } {
  const parametres = new URLSearchParams(recherche);
  return {
    mode: parametres.get('mode') === 'sombre' ? 'sombre' : 'clair',
    animations: parametres.get('animations') !== '0',
  };
}

/**
 * Côté aperçu du protocole (ADR 0010) : reçoit les réglages du site, annonce qu'il est prêt, rejoue une
 * sortie à la demande, signale sa hauteur. Navigateur seulement : tout démarre après le premier rendu.
 */
@Service()
export class ApercuService {
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #animations = signal(true);
  readonly #mode = signal<ModeApercu>('clair');

  /** Animations permises : les scènes la passent à l'input `animations` de leur ressource. */
  readonly animations = this.#animations.asReadonly();
  readonly mode = this.#mode.asReadonly();

  constructor() {
    afterNextRender(() => this.#demarrer());
  }

  #demarrer(): void {
    const fenetre = this.#document.defaultView;
    if (!fenetre) return;
    const initial = etatInitial(fenetre.location.search);
    this.#appliquerMode(initial.mode);
    this.#appliquerAnimations(initial.animations);
    const surMessage = (evenement: MessageEvent<unknown>): void => {
      if (!vientDuSite(evenement, fenetre.parent, ORIGINES_SITE)) return;
      const message = lireMessageVersApercu(evenement.data);
      if (message?.type === 'ngs-reglages') this.#appliquerReglages(message);
      if (message?.type === 'ngs-sortie') this.#jouerSortie(message, fenetre);
    };
    fenetre.addEventListener('message', surMessage);
    this.#destroyRef.onDestroy(() => fenetre.removeEventListener('message', surMessage));
    this.#suivreHauteur(fenetre);
    this.#envoyer(fenetre, messagePret());
  }

  #envoyer(fenetre: Window, message: object): void {
    // Origine opaque côté site : '*' est le seul targetOrigin possible, rien de secret n'est envoyé (ADR 0010).
    if (fenetre.parent !== fenetre) fenetre.parent.postMessage(message, '*');
  }

  #appliquerReglages(message: MessageReglages): void {
    const racine = this.#document.documentElement;
    for (const [cle, valeur] of Object.entries(message.vars)) racine.style.setProperty(cle, valeur);
    this.#appliquerMode(message.mode);
    this.#appliquerAnimations(message.animations);
  }

  #appliquerMode(mode: ModeApercu): void {
    this.#mode.set(mode);
    this.#document.documentElement.classList.toggle(CLASSE_SOMBRE, mode === 'sombre');
  }

  #appliquerAnimations(permises: boolean): void {
    this.#animations.set(permises);
    this.#document.documentElement.classList.toggle(CLASSE_SANS_ANIMATION, !permises);
  }

  /** « Rejouer la sortie » : la classe est posée sur l'hôte, comme le ferait animate.leave. */
  #jouerSortie(message: MessageSortie, fenetre: Window): void {
    const hotes = [...this.#document.querySelectorAll<HTMLElement>(SELECTEUR_HOTES)];
    let termine = false;
    const finir = (): void => {
      if (termine) return;
      termine = true;
      this.#envoyer(fenetre, messageSortieFin());
    };
    for (const hote of hotes) {
      hote.classList.add(...message.classes.split(' '));
      hote.addEventListener('animationend', finir, { once: true });
    }
    fenetre.setTimeout(() => {
      const nom = hotes[0] ? fenetre.getComputedStyle(hotes[0]).animationName : 'none';
      if (!nom || nom === 'none') finir();
    }, DELAI_DETECTION_SORTIE_MS);
    fenetre.setTimeout(finir, DELAI_MAX_SORTIE_MS);
  }

  #suivreHauteur(fenetre: Window): void {
    // On mesure le contenu (la scène), pas le corps : celui-ci a min-height 100vh et ne rétrécirait jamais.
    const corps = this.#document.body;
    const scene = this.#document.querySelector('main') ?? corps;
    let derniere = -1;
    const annoncer = (): void => {
      const hauteur = Math.ceil(scene.getBoundingClientRect().height + 2 * MARGE_VERTICALE_PX);
      if (hauteur === derniere) return;
      derniere = hauteur;
      this.#envoyer(fenetre, messageHauteur(hauteur));
    };
    const observateur = new ResizeObserver(annoncer);
    observateur.observe(scene);
    this.#destroyRef.onDestroy(() => observateur.disconnect());
  }
}
