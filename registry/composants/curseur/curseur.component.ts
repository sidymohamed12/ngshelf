import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  numberAttribute,
} from '@angular/core';

let compteur = 0;

@Component({
  selector: 'ngs-curseur',
  templateUrl: './curseur.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurseurComponent {
  readonly label = input.required<string>();
  readonly unite = input('');
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly pas = input(1, { transform: numberAttribute });
  readonly valeur = model(50);

  protected readonly id = 'ngs-curseur-' + compteur++;
  protected readonly texte = computed(() => (this.valeur() + ' ' + this.unite()).trim());

  protected changer(evenement: Event): void {
    this.valeur.set((evenement.target as HTMLInputElement).valueAsNumber);
  }
}
