import { Service, inject, signal } from '@angular/core';
import { RegistreService, estVisible } from '@core/registre/registre.service';
import { IndexRecherche, construireIndexRecherche } from './recherche';

/**
 * État de la recherche globale (dialogue ⌘K) et accès à son index. L'index est construit à la
 * première demande depuis les index du registre (chunks lazy) puis mémorisé ; un échec n'est pas
 * mémorisé, le bouton « Réessayer » relance donc vraiment le chargement.
 */
@Service()
export class RechercheService {
  readonly #registre = inject(RegistreService);
  readonly #ouverte = signal(false);
  #index: Promise<IndexRecherche> | undefined;

  readonly ouverte = this.#ouverte.asReadonly();

  ouvrir(): void {
    this.#ouverte.set(true);
  }

  fermer(): void {
    this.#ouverte.set(false);
  }

  basculer(): void {
    this.#ouverte.update((ouverte) => !ouverte);
  }

  indexRecherche(): Promise<IndexRecherche> {
    if (this.#index) return this.#index;
    const construction = this.#registre
      .toutes()
      .then((toutes) => construireIndexRecherche(toutes.filter(estVisible)));
    this.#index = construction;
    construction.catch(() => {
      this.#index = undefined;
    });
    return construction;
  }

  /** Charge l'index avant l'ouverture (survol, focus du bouton). Un échec est sans importance : l'ouverture réessaie. */
  precharger(): void {
    this.indexRecherche().catch(() => undefined);
  }
}
