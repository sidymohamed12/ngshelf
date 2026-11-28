import { Service, inject } from '@angular/core';
import { SeoService } from './seo.service';

/**
 * Indexation d'une page de liste (ADR 0004, décision 3) : la page prérendue du chemin est la seule à
 * indexer. Une URL à paramètres (filtres, recherche, tri) montre la même page filtrée côté client :
 * elle est `noindex` et son canonique est le chemin sans paramètres (voir `cheminCanonique`). Le
 * canonique et le `robots` appartiennent à `SeoService` : ce service ne fait que lui dire ce que la liste
 * filtrée impose. Une page qui s'en sert doit appeler `retirer` à sa destruction, pour que la page
 * suivante retrouve le canonique de sa route.
 */
@Service()
export class IndexationService {
  readonly #seo = inject(SeoService);

  /** Canonique : le chemin seul, absolu quand l'adresse du site est connue (`SITE.url`). */
  definir(chemin: string, filtree: boolean): void {
    this.#seo.definirIndexation(chemin, filtree);
  }

  retirer(): void {
    this.#seo.retirerIndexation();
  }
}
