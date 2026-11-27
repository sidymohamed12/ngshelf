import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { CarteSejourComponent } from '../carte-sejour.component';

/** Scène de l'aperçu : une carte de séjour avec sa photo (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [CarteSejourComponent],
  template: `
    <div class="piece">
      <ngs-carte-sejour
        data-hote
        lieu="Saint-Louis, Sénégal"
        titre="Trois nuits au bord du fleuve"
        texte="Maison d’hôtes sur l’île, petit-déjeuner compris."
        prix="À partir de 85 000 F CFA"
        image="images/stlouis-640.webp"
        alt="Pirogues colorées amarrées sur le fleuve à Saint-Louis du Sénégal, au lever du jour."
        lien="/"
        [animations]="contexte.animations()"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly contexte = inject(ApercuService);
}
