import { Component, computed, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DESCRIPTIONS_CATEGORIE,
  LIBELLES_CATEGORIE,
  LIBELLES_TYPE,
  TEXTES,
  libelleCompte,
} from '@core/i18n/textes.fr';
import { cheminType } from '@core/registre/chemins';
import { RegistreService, estVisible } from '@core/registre/registre.service';
import { PlancheComponent } from '@shared/components/planche/planche.component';
import { Categorie } from '@shared/models/taxonomie.model';
import { classeCategorie } from '@shared/utils/taxonomie-affichage';

/**
 * Page d'une catégorie (/composants, /blocs, /templates, /designs), prérendue (ADR 0004).
 * La catégorie arrive en input depuis `data` de la route (withComponentInputBinding).
 */
@Component({
  selector: 'app-categorie',
  imports: [RouterLink, PlancheComponent],
  templateUrl: './categorie.component.html',
})
export class CategorieComponent {
  readonly categorie = input.required<Categorie>();

  readonly #registre = inject(RegistreService);
  protected readonly textes = TEXTES.pages.listes;

  protected readonly chargement = resource({
    params: () => this.categorie(),
    loader: async ({ params }) => (await this.#registre.indexDe(params)).filter(estVisible),
  });

  protected readonly entrees = computed(() =>
    this.chargement.hasValue() ? this.chargement.value() : undefined,
  );

  protected readonly titre = computed(() => LIBELLES_CATEGORIE[this.categorie()].pluriel);
  protected readonly description = computed(() => DESCRIPTIONS_CATEGORIE[this.categorie()]);
  protected readonly classe = computed(() => classeCategorie(this.categorie()));
  protected readonly compte = computed(() =>
    libelleCompte(this.#registre.compteurs.categories[this.categorie()]),
  );

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
