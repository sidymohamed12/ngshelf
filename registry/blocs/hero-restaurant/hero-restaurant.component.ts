import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { RouterLink } from '@angular/router';

let compteur = 0;

@Component({
  selector: 'ngs-hero-restaurant',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './hero-restaurant.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroRestaurantComponent {
  readonly titre = input.required<string>();
  readonly texte = input.required<string>();
  readonly niveauTitre = input<1 | 2>(2);
  readonly image = input.required<string>();
  readonly alt = input.required<string>();
  readonly action = input('');
  readonly routeAction = input('');
  readonly lien = input('');
  readonly routeLien = input('');
  /** false : ni entrée ni sortie animées. */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly id = 'ngs-hero-' + compteur++;
}
