import { DOCUMENT, Service, inject } from '@angular/core';
import { FragmentCode, cheminFragment } from '@shared/models/fiche.model';

/**
 * Fragment de code de la variante CSS (ADR 0002, décision 4) : fichier statique chargé au premier
 * basculement, pas dans la page. Navigateur seulement ; un échec n'est pas mémorisé.
 */
@Service()
export class FragmentCodeService {
  readonly #document = inject(DOCUMENT);
  readonly #memoire = new Map<string, FragmentCode>();

  async charger(slug: string): Promise<FragmentCode> {
    const memorise = this.#memoire.get(slug);
    if (memorise) return memorise;
    const fenetre = this.#document.defaultView;
    if (!fenetre) throw new Error('fragment de code : navigateur requis');
    const reponse = await fenetre.fetch(cheminFragment(slug));
    if (!reponse.ok) throw new Error(`fragment de code injoignable (${reponse.status})`);
    const fragment = (await reponse.json()) as FragmentCode;
    this.#memoire.set(slug, fragment);
    return fragment;
  }
}
