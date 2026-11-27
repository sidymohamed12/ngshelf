import { Component, computed, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RegistreService } from '@core/registre/registre.service';
import { LIBELLES_CATEGORIE, LIBELLES_TYPE, TEXTES } from '@core/i18n/textes.fr';

/**
 * Fiche d'une ressource, URL /<categorie>/<type>/<slug> (ADR 0004). Page squelette : l'aperçu,
 * le code et les téléchargements viennent dans une phase ultérieure.
 * Les trois paramètres de route arrivent en inputs (withComponentInputBinding).
 */
@Component({
  selector: 'app-ressource',
  imports: [RouterLink],
  templateUrl: './ressource.component.html',
})
export class RessourceComponent {
  readonly categorie = input<string>();
  readonly type = input<string>();
  readonly slug = input<string>();

  protected readonly textes = TEXTES.pages.ressource;
  protected readonly etats = TEXTES.etats;
  readonly #registre = inject(RegistreService);

  protected readonly chargement = resource({
    params: () => ({ categorie: this.categorie(), type: this.type(), slug: this.slug() }),
    loader: ({ params }) => this.#registre.trouver(params),
  });

  protected readonly ressource = computed(() =>
    this.chargement.hasValue() ? this.chargement.value() : undefined,
  );

  protected readonly etiquette = computed(() => {
    const r = this.ressource();
    return r?.type ? `${LIBELLES_CATEGORIE[r.categorie].singulier} · ${LIBELLES_TYPE[r.type]}` : '';
  });
}
