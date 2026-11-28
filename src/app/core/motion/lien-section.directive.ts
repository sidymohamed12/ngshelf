import { Directive, inject } from '@angular/core';
import { DefilementService } from './defilement.service';
import { RouterLink } from '@angular/router';

/**
 * Lien vers une section de la page (`routerLink` + `fragment`) : si l'adresse porte déjà ce fragment, le
 * routeur ignore la navigation et rien ne bougerait ; la section est alors rejointe directement. Sinon, la
 * navigation du routeur déclenche le défilement doux (voir `DefilementService`). Le lien doit porter `scroll="manual"` : le routeur ne remet pas la page en haut
 * (sinon elle sauterait en haut avant de glisser vers la section).
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- s'applique aux liens existants (routerLink + fragment), sans attribut à ajouter
  selector: 'a[routerLink][fragment]',
  host: { '(click)': 'surClic()' },
})
export class LienSectionDirective {
  readonly #defilement = inject(DefilementService);
  readonly #lien = inject(RouterLink);

  protected surClic(): void {
    const fragment = this.#lien.fragment;
    if (fragment && this.#defilement.fragmentCourant() === fragment) {
      this.#defilement.versSection(fragment);
    }
  }
}
