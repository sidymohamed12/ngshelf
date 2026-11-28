import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_TYPE } from '@core/i18n/textes.fr';
import { ApercuVignetteComponent } from '@shared/components/apercu-vignette/apercu-vignette.component';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { ValeursContrat } from '@shared/livraison/livraison';
import { CategorieTypee, SEGMENT_CATEGORIE, TypeRessource } from '@shared/models/taxonomie.model';
import { ICONE_CATEGORIE, classeCategorie } from '@shared/utils/taxonomie-affichage';

/** Une ressource posée dans une page vitrine : de quoi montrer son aperçu et ouvrir sa fiche. */
export interface PieceVitrine {
  readonly slug: string;
  readonly categorie: CategorieTypee;
  readonly type: TypeRessource;
  /** Texte de l'étiquette quand il diffère du type (ex. « Curseur » pour un champ) ; absent = le type. */
  readonly libelle?: string;
}

/**
 * Pièce du catalogue posée dans une page vitrine (hero de l'accueil, hero de « À propos », avant / après) :
 * l'aperçu vivant en vignette (ADR 0015, décoratif et sans interaction, comme dans la planche) et une
 * étiquette qui ouvre sa fiche. Le nom de l'étiquette est le type de la ressource (« Navbar », « Calendrier »).
 */
@Component({
  selector: 'app-piece-vitrine',
  imports: [RouterLink, ApercuVignetteComponent, IconeComponent],
  templateUrl: './piece-vitrine.component.html',
  host: { class: 'ngs-piece', '[class]': 'classe()' },
})
export class PieceVitrineComponent {
  readonly piece = input.required<PieceVitrine>();
  /** Design montré dans la vignette ; absent = Planche. */
  readonly design = input<string>();
  /** Valeurs de tokens poussées à l'aperçu prêt (habillage), sans recharger l'iframe. */
  readonly reglages = input<ValeursContrat>();
  /** Faux : animations de la ressource coupées dans la vignette. */
  readonly animations = input(true);
  /** Rapport largeur / hauteur de la scène (ex. « 16 / 9 »). */
  readonly ratio = input('16 / 9');
  readonly coin = input<'gauche' | 'droite'>('gauche');
  /** Faux pour une pièce témoin sans lien vers sa fiche. */
  readonly etiquette = input(true);

  protected readonly classe = computed(() => classeCategorie(this.piece().categorie));
  protected readonly libelle = computed(
    () => this.piece().libelle ?? LIBELLES_TYPE[this.piece().type],
  );
  protected readonly icone = computed(() => ICONE_CATEGORIE[this.piece().categorie]);
  protected readonly chemin = computed(() => {
    const { categorie, type, slug } = this.piece();
    return `/${SEGMENT_CATEGORIE[categorie]}/${type}/${slug}`;
  });
}
