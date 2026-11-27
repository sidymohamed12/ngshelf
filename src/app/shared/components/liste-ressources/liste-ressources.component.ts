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
import { ICONE_SECTEUR, classeCategorie } from '@shared/utils/taxonomie-affichage';

/** Nombre de lignes fantômes pendant le chargement de l'index. */
const LIGNES_CHARGEMENT = [1, 2, 3, 4, 5, 6] as const;

interface LigneRessource {
  readonly entree: EntreeIndex;
  readonly classe: string;
  readonly categorie: string;
  readonly type: string | null;
  readonly chemin: string | null;
  readonly secteurs: readonly { readonly libelle: string; readonly icone: NomIcone }[];
  readonly provisoire: boolean;
}

/**
 * Liste simple de ressources (pages de catégorie, de type et de secteur). Gère tous ses états :
 * chargement, erreur avec « Réessayer », vide, liste. La planche et ses filtres sont une phase ultérieure.
 */
@Component({
  selector: 'app-liste-ressources',
  imports: [RouterLink, IconeComponent],
  templateUrl: './liste-ressources.component.html',
})
export class ListeRessourcesComponent {
  /** Ressources à afficher ; `undefined` tant qu'elles ne sont pas chargées. */
  readonly entrees = input<readonly EntreeIndex[] | undefined>();
  readonly chargement = input(false);
  readonly erreur = input(false);
  /** Texte de l'état vide propre à la page ; sinon le texte générique. */
  readonly titreVide = input<string>();
  readonly texteVide = input<string>();

  readonly reessayer = output();

  protected readonly etats = TEXTES.etats;
  protected readonly textes = TEXTES_LISTE;
  protected readonly lignesChargement = LIGNES_CHARGEMENT;

  protected readonly lignes = computed<readonly LigneRessource[]>(() =>
    (this.entrees() ?? []).map((entree) => ({
      entree,
      classe: classeCategorie(entree.categorie),
      categorie: LIBELLES_CATEGORIE[entree.categorie].singulier,
      type: entree.type ? LIBELLES_TYPE[entree.type] : null,
      chemin: cheminFiche(entree),
      secteurs: entree.secteurs.map((s) => ({
        libelle: LIBELLES_SECTEUR[s],
        icone: ICONE_SECTEUR[s],
      })),
      provisoire: entree.statut === 'provisoire',
    })),
  );

  protected readonly vide = computed(() => this.entrees()?.length === 0);
}
