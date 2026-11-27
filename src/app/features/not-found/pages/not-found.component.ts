import { Component } from '@angular/core';
import { PageIntrouvableComponent } from '@shared/components/page-introuvable/page-introuvable.component';

@Component({
  selector: 'app-not-found',
  imports: [PageIntrouvableComponent],
  template: '<app-page-introuvable />',
})
export class NotFoundComponent {}
