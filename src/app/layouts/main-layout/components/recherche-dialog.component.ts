import {
  Component,
  DOCUMENT,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  linkedSignal,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LIBELLES_CATEGORIE, LIBELLES_SECTEUR, LIBELLES_TYPE, TEXTES } from '@core/i18n/textes.fr';
import { Resultats, Segment, chercher, segmenter } from '@core/recherche/recherche';
import { RechercheService } from '@core/recherche/recherche.service';
import { cheminCategorie, cheminFiche } from '@core/registre/chemins';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { SqueletteComponent } from '@shared/components/squelette/squelette.component';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { Categorie } from '@shared/models/taxonomie.model';
import { classeCategorie } from '@shared/utils/taxonomie-affichage';

interface LigneResultat {
  readonly id: string;
  readonly chemin: string;
  readonly classe: string;
  readonly titre: readonly Segment[];
  readonly detail: string;
}

interface GroupeAffiche {
  readonly id: string;
  readonly categorie: Categorie;
  readonly titre: string;
  readonly lignes: readonly LigneResultat[];
  /** Présent quand le groupe a plus de correspondances que de lignes montrées. */
  readonly voirTout: { readonly chemin: string; readonly libelle: string } | null;
}

/** Les designs n'ont pas encore de fiche : leur résultat mène à la page de leur catégorie. */
function cheminResultat(entree: EntreeIndex): string {
  return cheminFiche(entree) ?? cheminCategorie(entree.categorie);
}

function detailResultat(entree: EntreeIndex): string {
  const base = entree.type
    ? LIBELLES_TYPE[entree.type]
    : LIBELLES_CATEGORIE[entree.categorie].singulier;
  return [base, ...entree.secteurs.map((s) => LIBELLES_SECTEUR[s])].join(', ');
}

function versGroupes(resultats: Resultats, requete: string): GroupeAffiche[] {
  return resultats.groupes.map((groupe) => {
    const famille = LIBELLES_CATEGORIE[groupe.categorie].pluriel;
    return {
      id: `recherche-groupe-${groupe.categorie}`,
      categorie: groupe.categorie,
      titre: famille,
      lignes: groupe.entrees.map((entree) => ({
        id: `recherche-${entree.categorie}-${entree.slug}`,
        chemin: cheminResultat(entree),
        classe: classeCategorie(entree.categorie),
        titre: segmenter(entree.titre.fr, requete),
        detail: detailResultat(entree),
      })),
      voirTout:
        groupe.total > groupe.entrees.length
          ? {
              chemin: cheminCategorie(groupe.categorie),
              libelle: TEXTES.recherche.voirTous(famille, groupe.total),
            }
          : null,
    };
  });
}

function estChampDeSaisie(cible: EventTarget | null): boolean {
  return (
    cible instanceof HTMLElement &&
    (cible.isContentEditable || cible.matches('input, textarea, select'))
  );
}

/** Nombre de lignes fantômes pendant le chargement de l'index. */
const LIGNES_CHARGEMENT = [1, 2, 3, 4] as const;

/**
 * Dialogue de recherche (⌘K, Ctrl+K ou « / »). C'est un <dialog> natif ouvert avec showModal() :
 * le navigateur piège le focus, rend le reste de la page inerte, ferme sur Échap et rend le focus
 * au bouton qui l'a ouvert. Combobox : le focus reste dans le champ, la flèche déplace l'option active
 * (aria-activedescendant), Entrée l'ouvre.
 */
@Component({
  selector: 'app-recherche-dialog',
  imports: [RouterLink, IconeComponent, SqueletteComponent],
  templateUrl: './recherche-dialog.component.html',
  host: {
    '(document:keydown)': 'surToucheDocument($event)',
    '(keydown.tab)': 'piegerFocus($event, false)',
    '(keydown.shift.tab)': 'piegerFocus($event, true)',
    // Un clic sur le fond (::backdrop) a pour cible le <dialog> lui-même et remonte jusqu'ici.
    '(click)': 'surClicFond($event)',
  },
})
export class RechercheDialogComponent {
  protected readonly recherche = inject(RechercheService);
  readonly #router = inject(Router);
  readonly #document = inject(DOCUMENT);
  readonly #injector = inject(Injector);

  protected readonly textes = TEXTES.recherche;
  protected readonly etats = TEXTES.etats;
  protected readonly lignesChargement = LIGNES_CHARGEMENT;
  protected readonly requete = signal('');

  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');
  private readonly champ = viewChild.required<ElementRef<HTMLInputElement>>('champ');

  /** L'index n'est chargé qu'à la première ouverture ; ensuite il est déjà là. */
  protected readonly index = resource({
    params: () => (this.recherche.dejaOuverte() ? true : undefined),
    loader: () => this.recherche.indexRecherche(),
  });

  private readonly resultats = computed(() =>
    this.index.hasValue() ? chercher(this.index.value(), this.requete()) : undefined,
  );

  protected readonly groupes = computed(() => {
    const resultats = this.resultats();
    return resultats ? versGroupes(resultats, this.requete()) : [];
  });

  private readonly lignes = computed(() => this.groupes().flatMap((g) => g.lignes));

  /** Position de l'option active, remise à la première à chaque nouveau résultat. */
  protected readonly actif = linkedSignal<readonly LigneResultat[], number>({
    source: this.lignes,
    computation: () => 0,
  });

  protected readonly idActif = computed(() => this.lignes()[this.actif()]?.id ?? null);
  protected readonly aucunResultat = computed(() => this.resultats()?.total === 0);
  protected readonly annonce = computed(() => {
    const resultats = this.resultats();
    return resultats ? TEXTES.recherche.annonce(resultats.total) : '';
  });

  constructor() {
    effect(() => {
      const ouverte = this.recherche.ouverte();
      const dialogue = this.dialogue().nativeElement;
      if (ouverte && !dialogue.open) {
        dialogue.showModal();
        this.champ().nativeElement.focus();
      } else if (!ouverte && dialogue.open) {
        dialogue.close();
      }
    });
  }

  /** Le dialogue se ferme par Échap, le bouton ou le fond : l'état du service suit dans tous les cas. */
  protected surFermeture(): void {
    // L'événement `close` arrive après coup : si le dialogue a déjà été rouvert, il ne vise plus l'ouverture en cours.
    if (this.dialogue().nativeElement.open) return;
    this.recherche.fermer();
    this.requete.set('');
  }

  protected surClicFond(evenement: MouseEvent): void {
    if (evenement.target === this.dialogue().nativeElement) this.recherche.fermer();
  }

  protected surSaisie(evenement: Event): void {
    this.requete.set((evenement.target as HTMLInputElement).value);
  }

  protected surTouche(evenement: KeyboardEvent): void {
    if (evenement.key === 'Escape') {
      // Dans un champ de recherche, Échap commence par vider le texte : ici il doit fermer le dialogue.
      evenement.preventDefault();
      this.recherche.fermer();
      return;
    }
    const total = this.lignes().length;
    if (total === 0) return;
    if (evenement.key === 'ArrowDown' || evenement.key === 'ArrowUp') {
      evenement.preventDefault();
      const pas = evenement.key === 'ArrowDown' ? 1 : -1;
      this.actif.set((this.actif() + pas + total) % total);
      afterNextRender(() => this.#montrerActif(), { injector: this.#injector });
    } else if (evenement.key === 'Enter') {
      const ligne = this.lignes()[this.actif()];
      evenement.preventDefault();
      this.recherche.fermer();
      void this.#router.navigateByUrl(ligne.chemin);
    }
  }

  /**
   * Garde Tab dans le dialogue : du dernier élément on revient au premier et inversement (sans cela,
   * certains navigateurs envoient le focus dans leur propre interface). Les options sont au clavier
   * par les flèches, pas par Tab : elles ne sont pas dans cette boucle.
   */
  protected piegerFocus(evenement: Event, arriere: boolean): void {
    const dialogue = this.dialogue().nativeElement;
    if (!dialogue.open) return;
    const cibles = [...dialogue.querySelectorAll<HTMLElement>('input, button, a[href]')].filter(
      (element) => element.tabIndex >= 0 && !element.hasAttribute('disabled'),
    );
    const premier = cibles[0];
    const dernier = cibles.at(-1);
    const actif = this.#document.activeElement;
    if (arriere && actif === premier) {
      evenement.preventDefault();
      dernier?.focus();
    } else if (!arriere && actif === dernier) {
      evenement.preventDefault();
      premier.focus();
    }
  }

  protected surToucheDocument(evenement: KeyboardEvent): void {
    if (evenement.key.toLowerCase() === 'k' && (evenement.metaKey || evenement.ctrlKey)) {
      evenement.preventDefault();
      this.recherche.basculer();
    } else if (
      evenement.key === '/' &&
      !this.recherche.ouverte() &&
      !estChampDeSaisie(evenement.target)
    ) {
      evenement.preventDefault();
      this.recherche.ouvrir();
    }
  }

  #montrerActif(): void {
    const id = this.idActif();
    if (id)
      this.dialogue().nativeElement.querySelector(`#${id}`)?.scrollIntoView?.({ block: 'nearest' });
  }
}
