import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export interface Question {
  readonly question: string;
  readonly reponse: string;
}

let compteur = 0;

@Component({
  selector: 'ngs-questions-frequentes',
  templateUrl: './questions-frequentes.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionsFrequentesComponent {
  readonly titre = input('Questions fréquentes');
  readonly questions = input.required<readonly Question[]>();
  readonly ouverte = input<number | null>(0);
  /** false : la réponse s'affiche sans animation. */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly id = 'ngs-faq-' + compteur++;
}
