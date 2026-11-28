import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { ApercuService } from './apercu.service';
import { TEXTES_APERCU } from './textes';

/**
 * Coquille de l'aperçu : une scène centrée, rien d'autre (pas d'en-tête, pas de style du site), servie dans
 * l'iframe de la fiche, de la fenêtre d'aperçu agrandi ou d'une case (ADR 0022), avec un état d'erreur. Les liens des ressources sont neutralisés dans la scène : un clic
 * dans l'aperçu ne doit jamais faire naviguer la page. Seuls les liens marqués `data-sortie` naviguent.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <main class="compo" [attr.aria-busy]="chargement()">
      @if (erreur()) {
        <div class="ap-etat" role="alert">
          <h2>{{ textes.erreurTitre }}</h2>
          <p>{{ textes.erreurTexte }}</p>
          <button class="ap-bouton" type="button" (click)="recharger()">
            {{ textes.recharger }}
          </button>
        </div>
      }
      <router-outlet />
    </main>
  `,
  host: { '(click)': 'neutraliserLiens($event)' },
})
export class App {
  protected readonly contexte = inject(ApercuService);
  protected readonly textes = TEXTES_APERCU;
  protected readonly chargement = signal(false);
  protected readonly erreur = signal(false);
  readonly #router = inject(Router);

  constructor() {
    const abonnement = this.#router.events.subscribe((evenement) => {
      if (evenement instanceof NavigationStart) {
        this.chargement.set(true);
        this.erreur.set(false);
      } else if (evenement instanceof NavigationError) {
        this.chargement.set(false);
        this.erreur.set(true);
      } else if (evenement instanceof NavigationEnd || evenement instanceof NavigationCancel) {
        this.chargement.set(false);
      }
    });
    inject(DestroyRef).onDestroy(() => abonnement.unsubscribe());
  }

  protected neutraliserLiens(evenement: Event): void {
    const cible = evenement.target;
    const lien = cible instanceof Element ? cible.closest('a') : null;
    // Hors de la scène (barre, états), les liens naviguent : seule la scène est neutralisée.
    const scene = lien?.closest('main') ?? null;
    if (lien && scene && !lien.hasAttribute('data-sortie')) evenement.preventDefault();
  }

  protected recharger(): void {
    this.contexte.recharger();
  }
}
