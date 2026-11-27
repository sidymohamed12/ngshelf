import { ChangeDetectionStrategy, Component, booleanAttribute, input, model } from '@angular/core';

@Component({
  selector: 'ngs-interrupteur',
  templateUrl: './interrupteur.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterrupteurComponent {
  readonly label = input.required<string>();
  readonly aide = input('');
  readonly desactive = input(false, { transform: booleanAttribute });
  readonly coche = model(false);

  protected basculer(): void {
    this.coche.update((valeur) => !valeur);
  }
}
