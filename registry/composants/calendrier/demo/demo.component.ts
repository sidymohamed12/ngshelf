import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { CalendrierComponent } from '../calendrier.component';

/** Scène de l'aperçu : le calendrier du mois courant (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [CalendrierComponent],
  template: `
    <div class="piece">
      <ngs-calendrier [animations]="contexte.animations()" />
    </div>
  `,
})
export class DemoComponent {
  protected readonly contexte = inject(ApercuService);
}
