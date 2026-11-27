import { Service, inject } from '@angular/core';
import { RegistreService } from '@core/registre/registre.service';
import { FicheRessource } from '@shared/models/fiche.model';
import { ParametresFiche } from '@shared/models/ressource.model';

export type ResultatFiche =
  | { readonly etat: 'ok'; readonly fiche: FicheRessource }
  | { readonly etat: 'introuvable' }
  | { readonly etat: 'erreur' };

/**
 * Charge la fiche d'une ressource : l'index dit si elle existe (sinon « introuvable »), puis le JSON de
 * la fiche, un chunk par ressource. Un échec n'est pas mémorisé : « Réessayer » relance vraiment.
 */
@Service()
export class FicheService {
  readonly #registre = inject(RegistreService);
  readonly #memoire = new Map<string, FicheRessource>();

  async charger(parametres: Partial<ParametresFiche>): Promise<ResultatFiche> {
    try {
      const entree = await this.#registre.trouver(parametres);
      if (!entree) return { etat: 'introuvable' };
      const memorisee = this.#memoire.get(entree.slug);
      if (memorisee) return { etat: 'ok', fiche: memorisee };
      const module = await import(`../../../../generated/registre/fiche/${entree.slug}.json`);
      const fiche = module.default as FicheRessource;
      this.#memoire.set(entree.slug, fiche);
      return { etat: 'ok', fiche };
    } catch {
      return { etat: 'erreur' };
    }
  }
}
