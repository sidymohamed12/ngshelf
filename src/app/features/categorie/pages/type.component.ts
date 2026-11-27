import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_CATEGORIE, LIBELLES_TYPE } from '@core/i18n/textes.fr';
import { cheminCategorie } from '@core/registre/chemins';
import { ExplorateurComponent } from '@shared/components/explorateur/explorateur.component';
import { IconeComponent } from '@shared/components/icone/icone.component';
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
  imports: [RouterLink, IconeComponent, ExplorateurComponent, PageIntrouvableComponent],
  templateUrl: './type.component.html',
})
export class TypeComponent {
  readonly categorie = input.required<CategorieTypee>();
  readonly type = input<string>();

  /** Le type reconnu dans la taxonomie de cette catégorie, sinon undefined (page « introuvable »). */
  protected readonly typeConnu = computed(() => {
    const type = this.type();
    return typeValide(this.categorie(), type) ? type : undefined;
  });

  protected readonly portee = computed(() => {
    const type = this.typeConnu();
    return type ? { type } : {};
  });

  protected readonly titre = computed(() => {
    const type = this.typeConnu();
    return type ? LIBELLES_TYPE[type] : '';
  });
  protected readonly retour = computed(() => LIBELLES_CATEGORIE[this.categorie()].pluriel);
  protected readonly cheminRetour = computed(() => cheminCategorie(this.categorie()));
  protected readonly classe = computed(() => classeCategorie(this.categorie()));
}
