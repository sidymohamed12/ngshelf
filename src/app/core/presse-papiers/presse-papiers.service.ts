import { DOCUMENT, Service, inject } from '@angular/core';

/**
 * Copie dans le presse-papiers. Renvoie `false` quand le navigateur refuse (permission, contexte non
 * sécurisé) : l'appelant le dit au visiteur et sélectionne le code, jamais d'échec silencieux.
 */
@Service()
export class PressePapiersService {
  readonly #document = inject(DOCUMENT);

  async copier(texte: string): Promise<boolean> {
    const presse = this.#document.defaultView?.navigator.clipboard;
    if (!presse) return false;
    try {
      await presse.writeText(texte);
      return true;
    } catch {
      return false;
    }
  }
}
