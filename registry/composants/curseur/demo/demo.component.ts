import { Component, signal } from '@angular/core';
import { CurseurComponent } from '../curseur.component';

/** Scène de l'aperçu : le curseur réglé sur 12 km (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [CurseurComponent],
  template: `
    <div class="piece">
      <ngs-curseur
        label="Distance maximale"
        unite="km"
        [min]="1"
        [max]="50"
        [(valeur)]="distance"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly distance = signal(12);
}
