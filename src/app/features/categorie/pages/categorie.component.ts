import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DESCRIPTIONS_CATEGORIE,
  LIBELLES_CATEGORIE,
  LIBELLES_TYPE,
  TEXTES,
  libelleCompte,
} from '@core/i18n/textes.fr';
import { cheminType } from '@core/registre/chemins';
import { RegistreService } from '@core/registre/registre.service';
import { ExplorateurComponent } from '@shared/components/explorateur/explorateur.component';
import { Categorie } from '@shared/models/taxonomie.model';
import { classeCategorie } from '@shared/utils/taxonomie-affichage';

/**
 * Page d'une catégorie (/composants, /blocs, /templates, /designs), prérendue (ADR 0004) : son titre,
 * les types qui ont une page, puis la planche filtrable. La catégorie arrive en input depuis `data`
 * de la route (withComponentInputBinding).
 */
@Component({
  selector: 'app-categorie',
  imports: [RouterLink, ExplorateurComponent],
  templateUrl: './categorie.component.html',
})
export class CategorieComponent {
  readonly categorie = input.required<Categorie>();

  readonly #registre = inject(RegistreService);
  protected readonly textes = TEXTES.pages.listes;

  protected readonly portee = computed(() => ({ categorie: this.categorie() }));

  protected readonly titre = computed(() => LIBELLES_CATEGORIE[this.categorie()].pluriel);
  protected readonly description = computed(() => DESCRIPTIONS_CATEGORIE[this.categorie()]);
  protected readonly classe = computed(() => classeCategorie(this.categorie()));
  /** Types qui ont au moins une page : ceux-là seulement sont des liens (les autres ne sont pas prérendus). */
  protected readonly types = computed(() => {
    const categorie = this.categorie();
    if (categorie === 'design') return [];
    return this.#registre.typesNonVides(categorie).map((type) => ({
      libelle: LIBELLES_TYPE[type],
      chemin: cheminType(categorie, type),
      compte: this.#registre.compteurs.types[type] ?? 0,
      nomAccessible: `${LIBELLES_TYPE[type]} (${libelleCompte(this.#registre.compteurs.types[type] ?? 0)})`,
    }));
  });
}
