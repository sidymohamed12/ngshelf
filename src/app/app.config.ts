import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { surTransitionCreee } from '@core/motion/transitions';
import { TitreSeoStrategy } from '@core/seo/titre-seo.strategy';
import { routes } from './app.routes';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Même titre que le routeur, puis le SEO de la page (description, Open Graph, JSON-LD).
    { provide: TitleStrategy, useExisting: TitreSeoStrategy },
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      // View Transitions du router seulement (ADR 0011) : pas de repli GSAP, saut en mouvement réduit.
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: surTransitionCreee,
      }),
    ),
    // Sans hydratation incrémentale : elle injecte des scripts en ligne (contrat d'événements) que la CSP
    // `script-src 'self'` bloquerait, et un site statique sans @defer hydraté n'en a pas besoin.
    provideClientHydration(withNoIncrementalHydration()),
  ],
};
