import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input } from '@angular/core';
import { NotificationsService } from './notifications.service';

@Component({
  selector: 'ngs-notifications',
  templateUrl: './notifications.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  /** false : pas d'animation d'entrée ni de sortie. */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly service = inject(NotificationsService);
}
