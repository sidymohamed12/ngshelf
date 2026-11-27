import { Component, input, output } from '@angular/core';
import { TEXTES_CATALOGUE } from '@core/i18n/textes.fr';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { Categorie, Secteur, TypeRessource } from '@shared/models/taxonomie.model';
import { ICONE_SECTEUR } from '@shared/utils/taxonomie-affichage';

/** Une valeur d'une facette : son libellé, le nombre de ressources et si elle est cochée. */
export interface OptionFacette<T> {
  readonly valeur: T;
  readonly libelle: string;
  readonly compte: number;
  readonly coche: boolean;
  /** Classe de famille (.ngs-cat-*) qui colore la case à cocher. */
  readonly classe: string;
}

export interface OptionBascule {
  readonly coche: boolean;
  readonly compte: number;
}

/** Ce que les facettes affichent ; une facette `null` est masquée (axe imposé par la page). */
export interface VueFacettes {
  readonly familles: readonly OptionFacette<Categorie | null>[] | null;
  readonly types: {
    readonly options: readonly OptionFacette<TypeRessource>[];
    readonly ouverts: boolean;
    readonly repliables: boolean;
    readonly caches: number;
  } | null;
  readonly secteurs: readonly OptionFacette<Secteur>[] | null;
  readonly reglables: OptionBascule;
  readonly animees: OptionBascule;
}

/**
 * Facettes du catalogue (maquette : `.ngs-facettes`) : famille (radio), type et secteur (cases), options
 * (interrupteurs). Composant d'affichage : il ne connaît ni l'URL ni l'index, il émet les changements.
 * Une valeur sans ressource reste visible en grisé.
 */
@Component({
  selector: 'app-facettes',
  imports: [IconeComponent],
  templateUrl: './facettes.component.html',
})
export class FacettesComponent {
  readonly vue = input.required<VueFacettes>();

  readonly categorieChoisie = output<Categorie | null>();
  readonly typeBascule = output<{ type: TypeRessource; coche: boolean }>();
  readonly secteurBascule = output<{ secteur: Secteur; coche: boolean }>();
  readonly reglablesBascule = output<boolean>();
  readonly animeesBascule = output<boolean>();
  readonly typesBascules = output();

  protected readonly textes = TEXTES_CATALOGUE;
  protected readonly iconeSecteur = ICONE_SECTEUR;
}
