import { RenderMode, ServerRoute } from '@angular/ssr';
import { SLUGS_APERCUS } from '@generated-apercus/scenes';

/** Une page prérendue par ressource : /apercu/<slug>, avec le design par défaut (ADR 0003). */
export const serverRoutes: ServerRoute[] = [
  {
    path: ':slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => SLUGS_APERCUS.map((slug) => ({ slug })),
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
