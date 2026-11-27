import { NgTemplateOutlet } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { LienCompte } from './menu-catalogue';

/**
 * Une ligne « libellé + compteur » du méga-menu et de la liste des secteurs du menu mobile.
 * Lien quand la page existe ; texte discret quand la rubrique est vide (pas de page prérendue).
 */
@Component({
  selector: 'app-ligne-compte',
  imports: [NgTemplateOutlet, RouterLink, IconeComponent],
  templateUrl: './ligne-compte.component.html',
  host: { class: 'contents' },
})
export class LigneCompteComponent {
  readonly lien = input.required<LienCompte>();
  /** Émis au clic sur le lien : le parent referme son menu. */
  readonly navigue = output();
}
