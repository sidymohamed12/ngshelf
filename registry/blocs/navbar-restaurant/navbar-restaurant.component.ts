import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface LienNav {
  readonly libelle: string;
  readonly route: string;
}

let compteur = 0;

@Component({
  selector: 'ngs-navbar-restaurant',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar-restaurant.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarRestaurantComponent {
  readonly marque = input.required<string>();
  readonly liens = input.required<readonly LienNav[]>();
  readonly action = input('');
  readonly routeAction = input('');
  readonly menuOuvert = model(false);
  /** false : la barre s'affiche sans entrer. */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly idMenu = 'ngs-navbar-menu-' + compteur++;
  protected readonly libelleMenu = computed(() =>
    this.menuOuvert() ? 'Fermer le menu' : 'Ouvrir le menu',
  );

  protected basculerMenu(): void {
    this.menuOuvert.update((o) => !o);
  }
}
