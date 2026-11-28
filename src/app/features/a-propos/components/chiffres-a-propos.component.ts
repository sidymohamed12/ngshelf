import { Component, computed, input } from '@angular/core';
import { LIBELLES_CATEGORIE } from '@core/i18n/textes.fr';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
import { TEXTES_APROPOS } from '@core/i18n/textes-apropos';
import { COMPTEURS } from '@core/registre/registre.donnees';
import { TOKENS_CONTRAT, valeursDuDesign } from '@shared/livraison/livraison';
import { FicheRessource } from '@shared/models/fiche.model';
import { CATEGORIES } from '@shared/models/taxonomie.model';
import { classeCategorie } from '@shared/utils/taxonomie-affichage';
import { DESIGNS, NOMS_DESIGNS } from '../a-propos.donnees';

/** Versions du code : Tailwind et CSS (ADR 0002). */
const NOMBRE_VERSIONS = 2;
/** Aucun compte à créer : la valeur est une promesse du produit, pas une mesure. */
const NOMBRE_COMPTES = 0;

/**
 * « Le catalogue aujourd'hui » : mosaïque de tuiles dont toutes les valeurs viennent du registre et du
 * contrat (jamais de chiffre inventé) : nombre de ressources et leur répartition par famille (compteurs
 * générés), les 12 tokens du contrat, les designs (valeurs de la fiche : sans elles, les pastilles sont
 * omises). Les nombres sont écrits dans le HTML ; la page les fait monter depuis 0 quand elle anime.
 */
@Component({
  selector: 'app-chiffres-a-propos',
  templateUrl: './chiffres-a-propos.component.html',
})
export class ChiffresAProposComponent {
  readonly fiche = input.required<FicheRessource | null>();

  protected readonly t = TEXTES_APROPOS;
  protected readonly versions = TEXTES_FICHE.code;
  protected readonly compte = {
    ressources: COMPTEURS.total,
    tokens: TOKENS_CONTRAT.length,
    designs: COMPTEURS.categories.design,
    versions: NOMBRE_VERSIONS,
    comptes: NOMBRE_COMPTES,
  };
  protected readonly jetons = TOKENS_CONTRAT.map((nom) => nom.replace('--ngs-', ''));

  /** Un carré par ressource, dans la couleur de sa famille. */
  protected readonly carres = CATEGORIES.flatMap((categorie) =>
    Array.from({ length: COMPTEURS.categories[categorie] }, () => classeCategorie(categorie)),
  );
  protected readonly legende = CATEGORIES.filter((c) => COMPTEURS.categories[c] > 0).map((c) => ({
    classe: classeCategorie(c),
    texte: TEXTES_APROPOS.chiffresLegende(
      String(COMPTEURS.categories[c]),
      LIBELLES_CATEGORIE[c].pluriel.toLowerCase(),
    ),
  }));

  protected readonly pastilles = computed(() =>
    (this.fiche()?.designs ?? []).flatMap((design) => {
      const slug = DESIGNS.find((d) => d === design.slug);
      if (!slug) return [];
      const clair = valeursDuDesign(design, 'clair');
      return [
        {
          nom: NOMS_DESIGNS[slug],
          action: clair['--ngs-color-action'],
          surAction: clair['--ngs-color-on-action'],
          rayon: clair['--ngs-radius'],
        },
      ];
    }),
  );
}
