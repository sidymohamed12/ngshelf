import { Service } from '@angular/core';
import { MetaRessource, ParametresFiche } from '@shared/models/ressource.model';
import { SEGMENT_CATEGORIE } from '@shared/models/taxonomie.model';
import { REGISTRE_PROVISOIRE } from './registre.provisoire';

/** Chemin de la fiche d'une ressource : /<categorie>/<type>/<slug> (ADR 0004). */
export function cheminFiche(ressource: MetaRessource): string {
  return `/${SEGMENT_CATEGORIE[ressource.categorie]}/${ressource.type}/${ressource.slug}`;
}

@Service()
export class RegistreService {
  readonly #ressources: readonly MetaRessource[] = REGISTRE_PROVISOIRE;

  toutes(): readonly MetaRessource[] {
    return this.#ressources;
  }

  trouver(parametres: Partial<ParametresFiche>): MetaRessource | undefined {
    return this.#ressources.find(
      (r) =>
        SEGMENT_CATEGORIE[r.categorie] === parametres.categorie &&
        r.type === parametres.type &&
        r.slug === parametres.slug,
    );
  }

  /** Paramètres de toutes les fiches à prérendre (getPrerenderParams de app.routes.server.ts). */
  parametresPrerendu(): ParametresFiche[] {
    return this.#ressources.map((r) => ({
      categorie: SEGMENT_CATEGORIE[r.categorie],
      type: r.type,
      slug: r.slug,
    }));
  }
}
