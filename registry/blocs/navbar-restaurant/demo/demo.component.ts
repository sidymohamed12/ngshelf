import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { LienNav, NavbarRestaurantComponent } from '../navbar-restaurant.component';

const LIENS: readonly LienNav[] = [
  { libelle: 'Accueil', route: '/' },
  { libelle: 'La carte', route: '/la-carte' },
  { libelle: 'Événements', route: '/evenements' },
  { libelle: 'Contact', route: '/contact' },
];

/** Scène de l'aperçu : la barre d'un restaurant, avec son menu replié sous 600 px (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [NavbarRestaurantComponent],
  template: `
    <div class="piece" style="--largeur-scene: 64rem">
      <ngs-navbar-restaurant
        marque="Chez Awa"
        [liens]="liens"
        action="Réserver une table"
        routeAction="/reserver"
        [animations]="contexte.animations()"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly liens = LIENS;
  protected readonly contexte = inject(ApercuService);
}
