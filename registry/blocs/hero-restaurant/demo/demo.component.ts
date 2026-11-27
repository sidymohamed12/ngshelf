import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { HeroRestaurantComponent } from '../hero-restaurant.component';

/** Scène de l'aperçu : le hero d'un restaurant avec sa photo (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [HeroRestaurantComponent],
  template: `
    <div class="piece" style="--largeur-scene: 64rem">
      <ngs-hero-restaurant
        data-hote
        titre="Le yassa du vendredi, comme à la maison"
        texte="Cuisine sénégalaise de saison, servie midi et soir à Dakar."
        image="images/yassa-1024.webp"
        alt="Poulet yassa aux oignons, riz blanc, alloco et piments, servis en poêlons sur une table."
        action="Réserver une table"
        routeAction="/reserver"
        lien="Voir la carte"
        routeLien="/la-carte"
        [animations]="contexte.animations()"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly contexte = inject(ApercuService);
}
