import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LIBELLES_CATEGORIE,
  LIBELLES_SECTEUR,
  LIBELLES_TYPE,
  TEXTES,
  TEXTES_LISTE,
} from '@core/i18n/textes.fr';
import { cheminFiche } from '@core/registre/chemins';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { NomIcone } from '@shared/components/icone/icones';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { CLASSES_TAILLE_CASE } from '@shared/utils/taille-case';
import { ICONE_CATEGORIE, ICONE_SECTEUR, classeCategorie } from '@shared/utils/taxonomie-affichage';

/** Nombre de cases fantômes pendant le chargement de l'index (maquette : 6). */
const CASES_CHARGEMENT = [1, 2, 3, 4, 5, 6] as const;

interface CaseRessource {
  readonly entree: EntreeIndex;
  /** Classes de la case : couleur de famille et taille (registre). */
  readonly classes: string;
  readonly icone: NomIcone;
  /** Le type de la ressource, ou sa catégorie pour un design (qui n'a pas de type). */
  readonly libelle: string;
  readonly chemin: string | null;
  readonly secteurs: readonly { readonly libelle: string; readonly icone: NomIcone }[];
  readonly idDescription: string;
}

/**
 * Planche du catalogue (DESIGN.md « Case de planche ») : la grille de cases `ngs-case` de toutes les
 * pages de liste (catalogue, catégorie, type, secteur). Gère tous ses états : chargement, erreur avec
 * « Réessayer », vide, planche. La vignette d'une case est statique (ADR 0003 : les aperçus live
 * viennent avec la fiche) ; la case entière ouvre la fiche.
 */
@Component({
  selector: 'app-planche',
  imports: [RouterLink, IconeComponent],
  templateUrl: './planche.component.html',
})
export class PlancheComponent {
  /** Ressources à afficher ; `undefined` tant qu'elles ne sont pas chargées. */
  readonly entrees = input<readonly EntreeIndex[] | undefined>();
  readonly chargement = input(false);
  readonly erreur = input(false);
  /** Grille des pages à colonne de filtres : une colonne de moins aux mêmes largeurs d'écran. */
  readonly avecFacettes = input(false);
  /** Texte de l'état vide propre à la page ; sinon le texte générique. */
  readonly titreVide = input<string>();
  readonly texteVide = input<string>();
  /** Libellé d'une action propre à l'état vide (ex. « Tout effacer ») ; sans elle, un lien vers le catalogue. */
  readonly libelleActionVide = input<string>();

  readonly reessayer = output();
  readonly actionVide = output();

  protected readonly etats = TEXTES.etats;
  protected readonly textes = TEXTES_LISTE;
  protected readonly secteurLibelle = TEXTES.pages.listes.secteur;
  protected readonly casesChargement = CASES_CHARGEMENT;

  protected readonly cases = computed<readonly CaseRessource[]>(() =>
    (this.entrees() ?? []).map((entree) => ({
      entree,
      classes: `${classeCategorie(entree.categorie)} ${CLASSES_TAILLE_CASE[entree.tailleCase]}`,
      icone: ICONE_CATEGORIE[entree.categorie],
      libelle: entree.type
        ? LIBELLES_TYPE[entree.type]
        : LIBELLES_CATEGORIE[entree.categorie].singulier,
      chemin: cheminFiche(entree),
      secteurs: entree.secteurs.map((s) => ({
        libelle: LIBELLES_SECTEUR[s],
        icone: ICONE_SECTEUR[s],
      })),
      idDescription: `case-${entree.slug}-description`,
    })),
  );

  protected readonly vide = computed(() => this.entrees()?.length === 0);
}
