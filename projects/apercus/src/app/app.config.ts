import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Les scènes contiennent des liens (navbar, hero) : le routeur leur est nécessaire, jamais pour naviguer.
    provideRouter(routes, withComponentInputBinding()),
    // Comme le site : l'hydratation incrémentale injecterait des scripts en ligne (CSP script-src 'self').
    provideClientHydration(withNoIncrementalHydration()),
  ],
};
