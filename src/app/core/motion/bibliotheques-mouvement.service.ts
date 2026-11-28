import { Service } from '@angular/core';
import type { gsap } from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { SplitText } from 'gsap/SplitText';
import type Lenis from 'lenis';

/** GSAP et les deux greffons utilisés par les pages vitrines (jamais `gsap/all`, jamais Flip hors catalogue). */
export interface Bibliotheques {
  readonly gsap: typeof gsap;
  readonly ScrollTrigger: typeof ScrollTrigger;
  readonly SplitText: typeof SplitText;
}

export type ClasseLenis = typeof Lenis;

/**
 * Chargeur des bibliothèques d'animation (ADR 0009 et 0011) : paquets npm à version exacte, importés à la
 * demande (chunks à part, jamais dans le bundle initial), mémorisés, et jamais exécutés pendant le prérendu
 * (le seul appelant est `MouvementPageService`, après le premier rendu dans le navigateur). Un seul
 * `registerPlugin` pour tout le site. Un import qui échoue n'est pas mémorisé : la visite suivante réessaie.
 */
@Service()
export class BibliothequesMouvementService {
  #gsap: Promise<Bibliotheques> | undefined;
  #lenis: Promise<ClasseLenis> | undefined;

  charger(): Promise<Bibliotheques> {
    this.#gsap ??= importerGsap().catch((erreur: unknown) => {
      this.#gsap = undefined;
      throw erreur;
    });
    return this.#gsap;
  }

  chargerLenis(): Promise<ClasseLenis> {
    this.#lenis ??= import('lenis')
      .then((module) => module.default)
      .catch((erreur: unknown) => {
        this.#lenis = undefined;
        throw erreur;
      });
    return this.#lenis;
  }
}

async function importerGsap(): Promise<Bibliotheques> {
  const [coeur, defilement, texte] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('gsap/SplitText'),
  ]);
  coeur.gsap.registerPlugin(defilement.ScrollTrigger, texte.SplitText);
  return { gsap: coeur.gsap, ScrollTrigger: defilement.ScrollTrigger, SplitText: texte.SplitText };
}
