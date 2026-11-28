import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE } from '@core/config/site.config';
import { TEXTES_ACCUEIL } from '@core/i18n/textes-accueil';
import { TEXTES } from '@core/i18n/textes.fr';
import { TEXTES_APROPOS } from '@core/i18n/textes-apropos';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { DOSSIER_RESSOURCE } from '../a-propos.donnees';

/**
 * « Contribuer » : le texte, l'arborescence du dossier d'une ressource et le parcours en quatre étapes. Le
 * bouton du dépôt n'existe que si `SITE.depot` est renseigné (pas de lien mort). « Lire le guide » renvoie à la section Contribuer de l'accueil,
 * seule page qui existe pour cela.
 */
@Component({
  selector: 'app-contribuer-a-propos',
  imports: [RouterLink, IconeComponent],
  templateUrl: './contribuer-a-propos.component.html',
})
export class ContribuerAProposComponent {
  protected readonly t = TEXTES_APROPOS;
  protected readonly depot = SITE.depot;
  protected readonly nouvelOnglet = TEXTES.nav.nouvelOnglet;
  protected readonly dossier = DOSSIER_RESSOURCE;
  protected readonly etapes = [
    TEXTES_ACCUEIL.contribuerEtape1,
    TEXTES_ACCUEIL.contribuerEtape2,
    TEXTES_ACCUEIL.contribuerEtape3,
    TEXTES_ACCUEIL.contribuerEtape4,
  ];
}
