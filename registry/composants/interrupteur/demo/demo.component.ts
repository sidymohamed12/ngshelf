import { Component, signal } from '@angular/core';
import { InterrupteurComponent } from '../interrupteur.component';

/** Scène de l'aperçu : l'interrupteur dans son état courant d'usage (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [InterrupteurComponent],
  template: `
    <div class="piece">
      <ngs-interrupteur
        label="Notifications par e-mail"
        aide="Un message quand une commande part."
        [(coche)]="actif"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly actif = signal(true);
}
