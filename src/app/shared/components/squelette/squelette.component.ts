import { Component, input } from '@angular/core';

/**
 * Squelette de chargement, le seul du site : un bloc de la couleur des surfaces (tokens) traversé d'un reflet.
 * Le reflet est coupé quand le système demande moins de mouvement (components.css, `prefers-reduced-motion`,
 * qui est la lecture de `MotionService`). L'icône d'une ressource ne s'affiche plus pendant un chargement :
 * seulement comme repli d'erreur.
 *
 * - `forme="plein"` : remplit son parent positionné (aperçu d'une case, cadre de l'aperçu de la fiche) ;
 * - `forme="bloc"` (défaut) : prend la largeur de son parent, la hauteur vient de la classe de l'appelant ;
 * - `forme="ligne"` : une ligne de texte.
 *
 * Avec `libelle`, le squelette est une région `status` annoncée aux lecteurs d'écran ; sans, il est décoratif
 * (l'appelant porte déjà l'annonce).
 */
@Component({
  selector: 'app-squelette',
  template: '@if (libelle()) {<span class="sr-only">{{ libelle() }}</span>}',
  host: {
    class: 'ngs-skeleton',
    '[class.ngs-skeleton--plein]': "forme() === 'plein'",
    '[class.ngs-skeleton--ligne]': "forme() === 'ligne'",
    '[attr.role]': "libelle() ? 'status' : null",
    '[attr.aria-hidden]': "libelle() ? null : 'true'",
  },
})
export class SqueletteComponent {
  readonly forme = input<'plein' | 'bloc' | 'ligne'>('bloc');
  readonly libelle = input<string>();
}
