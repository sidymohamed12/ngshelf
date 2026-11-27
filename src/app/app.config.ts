import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    // Sans hydratation incrémentale : elle injecte des scripts en ligne (contrat d'événements) que la CSP
    // `script-src 'self'` bloquerait, et un site statique sans @defer hydraté n'en a pas besoin.
    provideClientHydration(withNoIncrementalHydration()),
  ],
};
