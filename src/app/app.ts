import { Component, afterNextRender, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DefilementService } from '@core/motion/defilement.service';
import { MotionService } from '@core/motion/motion.service';
import { ThemeService } from '@core/theme/theme.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: '<router-outlet />',
})
export class App {
  constructor() {
    // Instancié dès le démarrage : la préférence de mouvement doit être lue avant la première navigation.
    inject(MotionService);
    // Instancié dès le démarrage : il écoute les navigations vers une ancre (#section).
    inject(DefilementService);
    const theme = inject(ThemeService);
    // Navigateur seulement : le prérendu ne connaît ni le cookie ni la préférence du système.
    afterNextRender(() => theme.initialiser());
  }
}
