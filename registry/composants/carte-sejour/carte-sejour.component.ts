import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ngs-carte-sejour',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './carte-sejour.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarteSejourComponent {
  readonly lieu = input.required<string>();
  readonly titre = input.required<string>();
  readonly texte = input.required<string>();
  readonly prix = input('');
  readonly image = input.required<string>();
  readonly alt = input.required<string>();
  readonly lien = input.required<string>();
  /** false : ni photo qui se pose, ni montée au survol. */
  readonly animations = input(true, { transform: booleanAttribute });
}
