import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { Question, QuestionsFrequentesComponent } from '../questions-frequentes.component';

const QUESTIONS: readonly Question[] = [
  {
    question: 'Faut-il installer un paquet ?',
    reponse:
      'Non. Vous copiez les fichiers du composant dans votre projet : il ne dépend que d’Angular.',
  },
  {
    question: 'Puis-je l’utiliser dans un projet commercial ?',
    reponse:
      'Oui. Chaque ressource est publiée sous licence MIT : gardez simplement la notice de licence.',
  },
  {
    question: 'Comment changer les couleurs ?',
    reponse:
      'Posez les variables du contrat (--ngs-color-action, --ngs-radius…) dans votre feuille de style : le composant les reprend.',
  },
];

/** Scène de l'aperçu : trois questions, la première ouverte (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [QuestionsFrequentesComponent],
  template: `
    <div class="piece" style="--largeur-scene: 44rem">
      <ngs-questions-frequentes [questions]="questions" [animations]="contexte.animations()" />
    </div>
  `,
})
export class DemoComponent {
  protected readonly questions = QUESTIONS;
  protected readonly contexte = inject(ApercuService);
}
