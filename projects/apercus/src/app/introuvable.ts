import { Component } from '@angular/core';
import { TEXTES_APERCU } from './textes';

/** Aperçu demandé pour une ressource qui n'existe pas. */
@Component({
  selector: 'app-introuvable',
  template: `
    <div class="ap-etat" role="status">
      <h2>{{ textes.introuvableTitre }}</h2>
      <p>{{ textes.introuvableTexte }}</p>
      <a class="ap-bouton" href="/catalogue" data-sortie>{{ textes.retourCatalogue }}</a>
    </div>
  `,
})
export class IntrouvableComponent {
  protected readonly textes = TEXTES_APERCU;
}
