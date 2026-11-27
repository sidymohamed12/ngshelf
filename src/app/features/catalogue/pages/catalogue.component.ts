import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { LIBELLES_SECTEUR, LIBELLES_TYPE, TEXTES, TEXTES_CATALOGUE } from '@core/i18n/textes.fr';
import { lireFiltres } from '@core/registre/filtres';
import { ExplorateurComponent } from '@shared/components/explorateur/explorateur.component';

/**
 * Page /catalogue : toutes les ressources, filtrables par catégorie, type, secteur et options. Le titre
 * suit le filtre quand il désigne une seule chose (un type, un secteur, une catégorie), comme la maquette.
 */
@Component({
  selector: 'app-catalogue',
  imports: [ExplorateurComponent],
  templateUrl: './catalogue.component.html',
})
export class CatalogueComponent {
  protected readonly textes = TEXTES.pages.catalogue;

  readonly #parametres = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });

  protected readonly titre = computed(() => {
    const { categorie, types, secteurs } = lireFiltres(this.#parametres());
    if (types.length === 1 && secteurs.length === 0) {
      return TEXTES_CATALOGUE.titreType(LIBELLES_TYPE[types[0]]);
    }
    if (secteurs.length === 1 && categorie === null && types.length === 0) {
      return TEXTES_CATALOGUE.titreSecteur(LIBELLES_SECTEUR[secteurs[0]]);
    }
    return categorie ? TEXTES_CATALOGUE.titreCategorie[categorie] : this.textes.h1;
  });
}
