import { Component, signal } from '@angular/core';
import { BoutonComponent } from '../bouton.component';

const DUREE_CHARGEMENT_MS = 1400;

/** Scène de l'aperçu : les trois variantes, la première simule un envoi (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [BoutonComponent],
  template: `
    <div class="piece flex flex-wrap items-center justify-center gap-3">
      <ngs-bouton [chargement]="envoi()" (click)="reserver()">Réserver une table</ngs-bouton>
      <ngs-bouton variante="secondaire">Voir la carte</ngs-bouton>
      <ngs-bouton variante="discrete">Annuler</ngs-bouton>
    </div>
  `,
})
export class DemoComponent {
  protected readonly envoi = signal(false);

  protected reserver(): void {
    this.envoi.set(true);
    setTimeout(() => this.envoi.set(false), DUREE_CHARGEMENT_MS);
  }
}
