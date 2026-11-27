import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { NotificationsComponent } from '../notifications.component';
import { NotificationsService } from '../notifications.service';

const MESSAGES = [
  'Brouillon enregistré',
  'Brouillon enregistré à nouveau',
  'Toujours enregistré, rien n’est perdu',
] as const;

/** Scène de l'aperçu : un bouton qui déclenche une notification (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [NotificationsComponent],
  template: `
    <div class="piece grid justify-items-center gap-4">
      <button
        class="min-h-11 cursor-pointer rounded-ngs border-[1.5px] border-ngs-action bg-ngs-action px-ngs-5 font-semibold text-ngs-on-action"
        type="button"
        (click)="enregistrer()"
      >
        Enregistrer le brouillon
      </button>
      <ngs-notifications [animations]="contexte.animations()" />
    </div>
  `,
})
export class DemoComponent {
  protected readonly contexte = inject(ApercuService);
  readonly #notifications = inject(NotificationsService);
  #suivant = 0;

  protected enregistrer(): void {
    this.#notifications.afficher(MESSAGES[this.#suivant % MESSAGES.length]);
    this.#suivant += 1;
  }
}
