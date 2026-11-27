import { Component, computed, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_CATEGORIE, LIBELLES_TYPE, libelleCompte } from '@core/i18n/textes.fr';
import { cheminCategorie } from '@core/registre/chemins';
import { RegistreService } from '@core/registre/registre.service';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { ListeRessourcesComponent } from '@shared/components/liste-ressources/liste-ressources.component';
import { PageIntrouvableComponent } from '@shared/components/page-introuvable/page-introuvable.component';
import { CategorieTypee, TYPES_PAR_CATEGORIE, TypeRessource } from '@shared/models/taxonomie.model';
import { classeCategorie } from '@shared/utils/taxonomie-affichage';

function typeValide(categorie: CategorieTypee, type: string | undefined): type is TypeRessource {
  return TYPES_PAR_CATEGORIE[categorie].some((t) => t === type);
}

/**
 * Page d'un type (/blocs/navbar), prérendue s'il a au moins une ressource (ADR 0004).
 * `categorie` vient de `data` de la route, `type` du paramètre d'URL.
 */
@Component({
  selector: 'app-type',
  imports: [RouterLink, IconeComponent, ListeRessourcesComponent, PageIntrouvableComponent],
  templateUrl: './type.component.html',
})
export class TypeComponent {
  readonly categorie = input.required<CategorieTypee>();
  readonly type = input<string>();

  readonly #registre = inject(RegistreService);

  /** Le type reconnu dans la taxonomie de cette catégorie, sinon undefined (page « introuvable »). */
  protected readonly typeConnu = computed(() => {
    const type = this.type();
    return typeValide(this.categorie(), type) ? type : undefined;
  });

  protected readonly chargement = resource({
    params: () => {
      const type = this.typeConnu();
      return type ? { categorie: this.categorie(), type } : undefined;
    },
    loader: ({ params }) => this.#registre.duType(params.categorie, params.type),
  });

  protected readonly entrees = computed(() =>
    this.chargement.hasValue() ? this.chargement.value() : undefined,
  );

  protected readonly titre = computed(() => {
    const type = this.typeConnu();
    return type ? LIBELLES_TYPE[type] : '';
  });
  protected readonly retour = computed(() => LIBELLES_CATEGORIE[this.categorie()].pluriel);
  protected readonly cheminRetour = computed(() => cheminCategorie(this.categorie()));
  protected readonly classe = computed(() => classeCategorie(this.categorie()));
  protected readonly compte = computed(() => {
    const type = this.typeConnu();
    return libelleCompte(type ? (this.#registre.compteurs.types[type] ?? 0) : 0);
  });
}
