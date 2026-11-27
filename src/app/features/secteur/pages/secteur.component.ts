import { Component, computed, inject, input, resource } from '@angular/core';
import { LIBELLES_SECTEUR, TEXTES, libelleCompte } from '@core/i18n/textes.fr';
import { RegistreService } from '@core/registre/registre.service';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { ListeRessourcesComponent } from '@shared/components/liste-ressources/liste-ressources.component';
import { PageIntrouvableComponent } from '@shared/components/page-introuvable/page-introuvable.component';
import { SECTEURS, Secteur } from '@shared/models/taxonomie.model';
import { ICONE_SECTEUR } from '@shared/utils/taxonomie-affichage';

function secteurValide(secteur: string | undefined): secteur is Secteur {
  return SECTEURS.some((s) => s === secteur);
}

/** Page d'un secteur (/secteurs/restaurant), prérendue s'il a au moins une ressource (ADR 0004). */
@Component({
  selector: 'app-secteur',
  imports: [IconeComponent, ListeRessourcesComponent, PageIntrouvableComponent],
  templateUrl: './secteur.component.html',
})
export class SecteurComponent {
  readonly secteur = input<string>();

  readonly #registre = inject(RegistreService);
  protected readonly textes = TEXTES.pages.listes;

  protected readonly secteurConnu = computed(() => {
    const secteur = this.secteur();
    return secteurValide(secteur) ? secteur : undefined;
  });

  protected readonly chargement = resource({
    params: () => this.secteurConnu(),
    loader: ({ params }) => this.#registre.duSecteur(params),
  });

  protected readonly entrees = computed(() =>
    this.chargement.hasValue() ? this.chargement.value() : undefined,
  );

  protected readonly titre = computed(() => {
    const secteur = this.secteurConnu();
    return secteur ? LIBELLES_SECTEUR[secteur] : '';
  });
  protected readonly icone = computed(() => {
    const secteur = this.secteurConnu();
    return secteur ? ICONE_SECTEUR[secteur] : 'squares-four';
  });
  protected readonly compte = computed(() => {
    const secteur = this.secteurConnu();
    return libelleCompte(secteur ? (this.#registre.compteurs.secteurs[secteur] ?? 0) : 0);
  });
}
