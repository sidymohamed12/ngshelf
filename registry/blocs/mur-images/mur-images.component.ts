import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import { RouterLink } from '@angular/router';

let compteur = 0;

/** Décalage de trois images d'une ligne à l'autre : deux lignes voisines ne répètent pas les mêmes images. */
const DECALAGE_LIGNE = 3;

/**
 * Hero à mur d'images : des rangées d'images en perspective dérivent lentement vers la droite et s'estompent
 * avant le texte, avec un titre, une phrase et deux actions. Mouvement 100 % CSS (une animation par rangée,
 * contenu dupliqué pour une boucle sans couture) ; aucune image n'est chargée tant qu'elle est hors de l'écran.
 */
@Component({
  selector: 'ngs-mur-images',
  imports: [RouterLink],
  templateUrl: './mur-images.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MurImagesComponent {
  /** Adresses des images du mur : elles décorent, le texte porte le sens (alt vide). */
  readonly images = input.required<readonly string[]>();
  readonly titre = input.required<string>();
  readonly texte = input.required<string>();
  readonly niveauTitre = input<1 | 2>(2);
  readonly action = input('');
  readonly routeAction = input('');
  readonly lien = input('');
  readonly routeLien = input('');
  /** Hauteur minimale de la section, en pixels. */
  readonly hauteur = input(640, { transform: numberAttribute });
  /** Nombre de rangées d'images. */
  readonly nombreLignes = input(5, { transform: numberAttribute });
  /** Images par rangée avant répétition : elles doivent couvrir la largeur du mur. */
  readonly parLigne = input(8, { transform: numberAttribute });
  /** Durée d'une boucle complète en secondes : plus c'est grand, plus la dérive est lente. */
  readonly duree = input(150, { transform: numberAttribute });
  /** Force de la perspective en pixels : plus c'est petit, plus le mur est déformé. */
  readonly perspective = input(1400, { transform: numberAttribute });
  /** Rotation du mur en degrés. */
  readonly rotation = input(28, { transform: numberAttribute });
  /** false : le mur reste immobile (aussi : classe .ngs-sans-animation sur un parent, ou mouvement réduit du système). */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly id = 'ngs-mur-' + compteur++;
  /** Le contenu de chaque rangée est dupliqué : l'animation avance d'une moitié, sans couture. */
  protected readonly copies = [0, 1];
  protected readonly lignes = computed(() => {
    const images = this.images();
    if (images.length === 0) return [];
    const parLigne = Math.max(1, Math.round(this.parLigne()));
    return Array.from({ length: Math.max(1, Math.round(this.nombreLignes())) }, (_, r) =>
      Array.from(
        { length: parLigne },
        (_, c) => images[(r * DECALAGE_LIGNE + c) % images.length] ?? '',
      ),
    );
  });
}
