import { Injector, Service, inject, runInInjectionContext } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { SITE } from '@core/config/site.config';
import { CLE_SEO, FabriquePageSeo } from './page-seo';
import { SeoService } from './seo.service';

/** Route la plus profonde de l'enfant principal : celle qui décrit la page affichée. */
export function routeActive(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  let courante = route;
  while (courante.firstChild) courante = courante.firstChild;
  return courante;
}

/**
 * Remplace la stratégie de titre du routeur : même titre (celui de `title` de la route), puis le SEO de la
 * page (`data.seo`, voir `app.seo.ts`) est transmis à `SeoService`. Une route sans `data.seo` garde le
 * titre et n'a ni description ni données structurées.
 */
@Service()
export class TitreSeoStrategy extends TitleStrategy {
  readonly #titre = inject(Title);
  readonly #seo = inject(SeoService);
  readonly #injector = inject(Injector);

  override updateTitle(instantane: RouterStateSnapshot): void {
    const titre = this.buildTitle(instantane) ?? SITE.nom;
    this.#titre.setTitle(titre);
    this.#seo.definirTitre(titre);
    const fabrique = routeActive(instantane.root).data[CLE_SEO] as FabriquePageSeo | undefined;
    if (fabrique)
      this.#seo.appliquer(
        runInInjectionContext(this.#injector, () => fabrique(routeActive(instantane.root))),
      );
  }
}
