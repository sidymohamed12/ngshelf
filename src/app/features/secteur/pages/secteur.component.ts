import { Component, computed, input } from '@angular/core';
import { LIBELLES_SECTEUR, TEXTES } from '@core/i18n/textes.fr';
import { ExplorateurComponent } from '@shared/components/explorateur/explorateur.component';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { PageIntrouvableComponent } from '@shared/components/page-introuvable/page-introuvable.component';
import { SECTEURS, Secteur } from '@shared/models/taxonomie.model';
import { ICONE_SECTEUR } from '@shared/utils/taxonomie-affichage';

function secteurValide(secteur: string | undefined): secteur is Secteur {
  return SECTEURS.some((s) => s === secteur);
}

/** Page d'un secteur (/secteurs/restaurant), prérendue s'il a au moins une ressource (ADR 0004). */
@Component({
  selector: 'app-secteur',
  imports: [IconeComponent, ExplorateurComponent, PageIntrouvableComponent],
  templateUrl: './secteur.component.html',
})
export class SecteurComponent {
  readonly secteur = input<string>();

  protected readonly textes = TEXTES.pages.listes;

  protected readonly secteurConnu = computed(() => {
    const secteur = this.secteur();
    return secteurValide(secteur) ? secteur : undefined;
  });

  protected readonly portee = computed(() => {
    const secteur = this.secteurConnu();
    return secteur ? { secteur } : {};
  });

  protected readonly titre = computed(() => {
    const secteur = this.secteurConnu();
    return secteur ? LIBELLES_SECTEUR[secteur] : '';
  });
  protected readonly icone = computed(() => {
    const secteur = this.secteurConnu();
    return secteur ? ICONE_SECTEUR[secteur] : 'squares-four';
  });
}
