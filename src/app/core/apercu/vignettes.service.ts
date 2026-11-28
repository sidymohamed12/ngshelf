import { Service, signal } from '@angular/core';

/**
 * Nombre maximal de vignettes vivantes en même temps (ADR 0015, relevé de 8 à 12 par l'ADR 0017). Chacune est
 * une iframe qui démarre l'application d'aperçus (environ 12 Mo mesurés chacune) : au-delà, les cases restent
 * sur leur icône jusqu'à ce qu'une place se libère. Douze couvrent une fenêtre de 2560 px de large et de
 * 1500 px de haut ; avec huit, les cases en trop restaient sur l'icône sur un grand écran.
 */
export const VIGNETTES_SIMULTANEES_MAX = 12;

/**
 * Répartit les places de vignettes vivantes entre les cases visibles. Une vignette réserve une place
 * quand elle entre dans le viewport et la rend quand elle en sort ou échoue ; `liberations` change à
 * chaque place rendue, pour que les vignettes en attente réessayent.
 */
@Service()
export class VignettesService {
  readonly #occupees = new Set<string>();
  readonly #liberations = signal(0);

  readonly liberations = this.#liberations.asReadonly();

  get actives(): number {
    return this.#occupees.size;
  }

  reserver(id: string): boolean {
    if (this.#occupees.has(id)) return true;
    if (this.#occupees.size >= VIGNETTES_SIMULTANEES_MAX) return false;
    this.#occupees.add(id);
    return true;
  }

  liberer(id: string): void {
    if (this.#occupees.delete(id)) this.#liberations.update((n) => n + 1);
  }
}
