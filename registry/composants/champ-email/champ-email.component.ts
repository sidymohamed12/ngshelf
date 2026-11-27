import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

const MOTIF_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
let compteur = 0;

@Component({
  selector: 'ngs-champ-email',
  templateUrl: './champ-email.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChampEmailComponent {
  readonly label = input.required<string>();
  readonly aide = input('');
  readonly valeur = model('');

  protected readonly id = 'ngs-champ-' + compteur++;
  /** L’erreur ne s’affiche qu’après la première sortie du champ. */
  protected readonly touche = signal(false);
  readonly valide = computed(() => MOTIF_EMAIL.test(this.valeur().trim()));
  protected readonly enErreur = computed(() => this.touche() && !this.valide());
  protected readonly message = computed(() =>
    this.valeur().trim() === ''
      ? 'Saisissez votre adresse e-mail.'
      : 'Ajoutez la fin de l’adresse, par exemple awa@exemple.sn.',
  );

  protected saisir(evenement: Event): void {
    this.valeur.set((evenement.target as HTMLInputElement).value);
  }
}
