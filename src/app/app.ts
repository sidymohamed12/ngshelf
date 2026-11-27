import { Component, afterNextRender, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@core/theme/theme.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: '<router-outlet />',
})
export class App {
  constructor() {
    const theme = inject(ThemeService);
    // Navigateur seulement : le prérendu ne connaît ni le cookie ni la préférence du système.
    afterNextRender(() => theme.initialiser());
  }
}
