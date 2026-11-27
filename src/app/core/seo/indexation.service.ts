import { DOCUMENT } from '@angular/common';
import { Service, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { SITE } from '@core/config/site.config';

const ROBOTS = 'robots';
const NOINDEX = 'noindex, follow';
const SELECTEUR_CANONIQUE = 'link[rel="canonical"]';

/**
 * Indexation d'une page de liste (ADR 0004, décision 3) : la page prérendue du chemin est la seule à
 * indexer. Une URL à paramètres (filtres, recherche, tri) montre la même page filtrée côté client :
 * elle est `noindex` et son canonique est le chemin sans paramètres. Fonctionne au prérendu comme dans
 * le navigateur (le prérendu n'a jamais de paramètres). Une page qui s'en sert doit appeler `retirer`
 * à sa destruction : sinon le canonique resterait sur les pages suivantes de la navigation du routeur.
 */
@Service()
export class IndexationService {
  readonly #meta = inject(Meta);
  readonly #document = inject(DOCUMENT);

  /** Canonique : le chemin seul, absolu quand l'adresse du site est connue (`SITE.url`). */
  definir(chemin: string, filtree: boolean): void {
    this.#poserCanonique(`${SITE.url ?? ''}${chemin}`);
    if (filtree) this.#meta.updateTag({ name: ROBOTS, content: NOINDEX });
    else this.#meta.removeTag(`name="${ROBOTS}"`);
  }

  retirer(): void {
    this.#document.head.querySelector(SELECTEUR_CANONIQUE)?.remove();
    this.#meta.removeTag(`name="${ROBOTS}"`);
  }

  #poserCanonique(href: string): void {
    let lien = this.#document.head.querySelector(SELECTEUR_CANONIQUE);
    if (!lien) {
      lien = this.#document.createElement('link');
      lien.setAttribute('rel', 'canonical');
      this.#document.head.appendChild(lien);
    }
    lien.setAttribute('href', href);
  }
}
