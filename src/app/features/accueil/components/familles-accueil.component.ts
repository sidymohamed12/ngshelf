import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DESCRIPTIONS_CATEGORIE, LIBELLES_CATEGORIE, libelleCompte } from '@core/i18n/textes.fr';
import { TEXTES_ACCUEIL } from '@core/i18n/textes-accueil';
import { cheminCategorie } from '@core/registre/chemins';
import { COMPTEURS } from '@core/registre/registre.donnees';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { PlancheComponent } from '@shared/components/planche/planche.component';
import { DesignContrat, ValeursContrat, valeursDuDesign } from '@shared/livraison/livraison';
import { FicheRessource } from '@shared/models/fiche.model';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { CATEGORIES, Categorie } from '@shared/models/taxonomie.model';
import { classeCategorie } from '@shared/utils/taxonomie-affichage';
import { DESIGNS_ACCUEIL, DesignAccueil, NOMS_DESIGNS, SLUGS_FAMILLES } from '../accueil.donnees';

interface Famille {
  readonly categorie: Categorie;
  readonly classe: string;
  readonly nom: string;
  readonly compte: string;
  readonly texte: string;
  /** Texte et chemin du lien vers la page de la famille ; absents quand la famille est vide. */
  readonly lien: { readonly libelle: string; readonly chemin: string } | null;
  readonly cases: readonly EntreeIndex[];
}

interface PastilleDesign {
  readonly slug: DesignAccueil;
  readonly nom: string;
  readonly rayon: string;
  /** Action et surface alternée en clair, surface et action en sombre. */
  readonly couleurs: readonly string[];
}

const LIBELLE_LIEN: Partial<Record<Categorie, string>> = {
  composant: TEXTES_ACCUEIL.famillesComposantsCta,
  bloc: TEXTES_ACCUEIL.famillesBlocsCta,
  design: TEXTES_ACCUEIL.famillesDesignsCta,
};

function pastille(design: DesignContrat & { readonly slug: string }): PastilleDesign | null {
  const slug = DESIGNS_ACCUEIL.find((d) => d === design.slug);
  if (!slug) return null;
  const clair: ValeursContrat = valeursDuDesign(design, 'clair');
  const sombre: ValeursContrat = valeursDuDesign(design, 'sombre');
  return {
    slug,
    nom: NOMS_DESIGNS[slug],
    rayon: clair['--ngs-radius'],
    couleurs: [
      clair['--ngs-color-action'],
      clair['--ngs-color-surface-alt'],
      sombre['--ngs-color-surface'],
      sombre['--ngs-color-action'],
    ],
  };
}

/**
 * « Quatre familles de pièces » : un panneau par catégorie, couleur de la famille, nom qui prend du poids au
 * défilement (la page épingle la section et la fait défiler à l'horizontale à partir de 1024 px). Les
 * compteurs viennent du registre. Les cases de la vitrine d'un panneau ne s'affichent que si l'index est chargé
 * (sinon la planche, juste au-dessus, porte déjà l'état d'erreur).
 */
@Component({
  selector: 'app-familles-accueil',
  imports: [RouterLink, IconeComponent, PlancheComponent],
  templateUrl: './familles-accueil.component.html',
})
export class FamillesAccueilComponent {
  readonly entrees = input.required<readonly EntreeIndex[] | null>();
  readonly fiche = input.required<FicheRessource | null>();

  protected readonly t = TEXTES_ACCUEIL;

  protected readonly familles = computed<readonly Famille[]>(() => {
    const entrees = this.entrees() ?? [];
    return CATEGORIES.map((categorie) => {
      const compte = COMPTEURS.categories[categorie];
      const libelle = LIBELLE_LIEN[categorie];
      const slugs: readonly string[] =
        categorie === 'composant' || categorie === 'bloc' ? SLUGS_FAMILLES[categorie] : [];
      return {
        categorie,
        classe: classeCategorie(categorie),
        nom: LIBELLES_CATEGORIE[categorie].pluriel,
        compte: libelleCompte(compte),
        texte: DESCRIPTIONS_CATEGORIE[categorie],
        lien: compte > 0 && libelle ? { libelle, chemin: cheminCategorie(categorie) } : null,
        cases: slugs.flatMap((slug) => entrees.filter((e) => e.slug === slug)),
      };
    });
  });

  protected readonly pastilles = computed<readonly PastilleDesign[]>(() =>
    (this.fiche()?.designs ?? []).flatMap((design) => pastille(design) ?? []),
  );
}
