import { Component, signal } from '@angular/core';
import { ChampEmailComponent } from '../champ-email.component';

/** Scène de l'aperçu : un champ e-mail pré-rempli d'une adresse incomplète (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [ChampEmailComponent],
  template: `
    <div class="piece">
      <ngs-champ-email
        label="Adresse e-mail"
        aide="Pour recevoir le reçu de commande."
        [(valeur)]="adresse"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly adresse = signal('awa@exemple');
}
