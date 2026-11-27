import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LIBELLES_CATEGORIE,
  LIBELLES_SECTEUR,
  LIBELLES_TYPE,
  TEXTES,
  TEXTES_CATALOGUE,
  libelleCompte,
} from '@core/i18n/textes.fr';
import { filtrerParRequete, construireIndexRecherche } from '@core/recherche/recherche';
import { COMPTEURS } from '@core/registre/registre.donnees';
import {
  FiltreActif,
  FiltresCatalogue,
  Portee,
  aDesParametres,
  appliquerPortee,
  avecCategorie,
  avecSecteur,
  avecType,
  categorieDuType,
  compterFacettes,
  facettesDepuisCompteurs,
  filtrer,
  filtresActifs,
  FILTRES_VIDES,
  lireFiltres,
  sansFiltre,
  sansFiltres,
  typesProposes,
  versParametres,
} from '@core/registre/filtres';
import { RegistreService, estVisible } from '@core/registre/registre.service';
import { IndexationService } from '@core/seo/indexation.service';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { FacettesComponent, OptionFacette, VueFacettes } from './facettes.component';
import { PlancheComponent } from '@shared/components/planche/planche.component';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import {
  CATEGORIES,
  Categorie,
  SECTEURS,
  Secteur,
  TypeRessource,
} from '@shared/models/taxonomie.model';
import { classeCategorie } from '@shared/utils/taxonomie-affichage';

/** Nombre de cases montrées d'abord, puis ajoutées à chaque « Afficher plus » (maquette : 24). */
const TAILLE_PAGE = 24;
/** Délai entre la dernière frappe et l'application de la recherche (maquette : 140 ms). */
const DELAI_SAISIE_MS = 140;
/** Types visibles avant « Afficher les n autres types » ; les types cochés restent toujours visibles. */
const TYPES_VISIBLES = 8;
/** Sous 1024 px (64rem), les filtres sont un tiroir ; au-delà, une colonne collante. */
const MEDIA_TIROIR = '(max-width: 63.99rem)';
const FOCUSABLES = 'a[href], button:not([disabled]), input:not([disabled]), select, summary';

/**
 * Colonne de filtres, recherche, tri, puces des filtres actifs, planche et « Afficher plus » (maquette
 * catalogue.html : un seul gabarit pour /catalogue, /<categorie>, /<categorie>/<type>, /secteurs/<secteur>).
 *
 * L'état est dans les paramètres d'URL (partageable) ; un changement de filtre ne remplace que les
 * paramètres de l'URL courante, sans entrée d'historique : ce n'est pas un changement de page. Ces URL
 * ne sont ni prérendues ni indexées (canonique = chemin sans paramètres, voir IndexationService).
 * `portee` décrit ce que le chemin de la page impose déjà.
 */
@Component({
  selector: 'app-explorateur',
  imports: [PlancheComponent, FacettesComponent, IconeComponent],
  host: { '(keydown)': 'gererClavier($event)' },
  templateUrl: './explorateur.component.html',
})
export class ExplorateurComponent {
  readonly portee = input<Portee>({});

  readonly #registre = inject(RegistreService);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #indexation = inject(IndexationService);
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  readonly #hote = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly boutonFermer = viewChild<ElementRef<HTMLButtonElement>>('boutonFermer');
  private readonly boutonOuvrir = viewChild<ElementRef<HTMLButtonElement>>('boutonOuvrir');
  private readonly tiroir = viewChild<ElementRef<HTMLElement>>('tiroir');

  readonly #parametres = toSignal(this.#route.queryParamMap, { requireSync: true });
  #minuteurSaisie: ReturnType<typeof setTimeout> | undefined;

  protected readonly textes = TEXTES_CATALOGUE;
  protected readonly etats = TEXTES.etats;

  /** Filtres décrits par l'URL, axes imposés par la page compris. */
  protected readonly filtres = computed(() => lireFiltres(this.#parametres(), this.portee()));

  protected readonly chargement = resource({
    params: () => {
      const { categorie, type } = this.portee();
      return (type ? categorieDuType(type) : categorie) ?? 'toutes';
    },
    loader: async ({ params }) => {
      const index =
        params === 'toutes' ? await this.#registre.toutes() : await this.#registre.indexDe(params);
      return index.filter(estVisible);
    },
  });

  /** Ressources de la page avant filtrage ; `undefined` tant que l'index n'est pas chargé. */
  protected readonly entrees = computed(() =>
    this.chargement.hasValue() ? this.chargement.value() : undefined,
  );

  readonly #indexRecherche = computed(() => {
    const entrees = this.entrees();
    return entrees ? construireIndexRecherche(entrees) : undefined;
  });
  /** Résultat de la recherche seule : la base des compteurs de facettes. */
  readonly #base = computed(() => {
    const index = this.#indexRecherche();
    return index ? filtrerParRequete(index, this.filtres().q) : [];
  });
  protected readonly resultats = computed(() => filtrer(this.#base(), this.filtres()));

  /** Nombre de cases montrées : revient à une page quand les filtres changent. */
  protected readonly visibles = linkedSignal<FiltresCatalogue, number>({
    source: this.filtres,
    computation: () => TAILLE_PAGE,
  });
  protected readonly affichees = computed<readonly EntreeIndex[] | undefined>(() =>
    this.entrees() ? this.resultats().slice(0, this.visibles()) : undefined,
  );
  protected readonly resteAMontrer = computed(
    () => this.resultats().length > (this.affichees()?.length ?? 0),
  );

  protected readonly facettes = computed(() =>
    this.entrees()
      ? compterFacettes(this.#base(), this.filtres())
      : facettesDepuisCompteurs(COMPTEURS),
  );

  /** Annonce vocale et ligne de compte : « 7 ressources » ou « 24 sur 31 ressources ». */
  protected readonly compte = computed(() => {
    if (this.chargement.isLoading() && !this.entrees()) return this.etats.chargement;
    const affichees = this.affichees();
    if (!affichees) return '';
    const total = this.resultats().length;
    return total > affichees.length
      ? this.textes.page(affichees.length, libelleCompte(total))
      : libelleCompte(total);
  });

  protected readonly actifs = computed(() =>
    filtresActifs(this.filtres(), this.portee()).map((actif) => ({
      actif,
      cle: 'valeur' in actif ? `${actif.axe}-${actif.valeur}` : actif.axe,
      libelle: this.#libelle(actif),
      aria: this.textes.filtreRetirer(this.#libelle(actif)),
    })),
  );

  readonly #optionsFamille = computed<readonly OptionFacette<Categorie | null>[]>(() => {
    const { categorie } = this.filtres();
    const { total, categories } = this.facettes();
    return [
      {
        valeur: null,
        libelle: this.textes.tout,
        compte: total,
        coche: categorie === null,
        classe: '',
      },
      ...CATEGORIES.map((valeur) => ({
        valeur,
        libelle: LIBELLES_CATEGORIE[valeur].pluriel,
        compte: categories[valeur] ?? 0,
        coche: categorie === valeur,
        classe: classeCategorie(valeur),
      })),
    ];
  });

  protected readonly typesOuverts = signal(false);
  readonly #optionsTypes = computed<readonly OptionFacette<TypeRessource>[]>(() => {
    const { categorie, types } = this.filtres();
    const comptes = this.facettes().types;
    return [...typesProposes(categorie)]
      .map((valeur) => ({
        valeur,
        libelle: LIBELLES_TYPE[valeur],
        compte: comptes[valeur] ?? 0,
        coche: types.includes(valeur),
        classe: classeCategorie(categorieDuType(valeur) ?? 'composant'),
      }))
      .sort((a, b) => b.compte - a.compte || a.libelle.localeCompare(b.libelle, 'fr'));
  });
  readonly #optionsTypesVisibles = computed(() =>
    this.#optionsTypes().filter(
      (option, rang) => this.typesOuverts() || rang < TYPES_VISIBLES || option.coche,
    ),
  );

  readonly #optionsSecteurs = computed<readonly OptionFacette<Secteur>[]>(() => {
    const { secteurs } = this.filtres();
    const comptes = this.facettes().secteurs;
    return SECTEURS.map((valeur) => ({
      valeur,
      libelle: LIBELLES_SECTEUR[valeur],
      compte: comptes[valeur] ?? 0,
      coche: secteurs.includes(valeur),
      classe: '',
    }));
  });

  /** Ce que la colonne de filtres montre : les facettes dont l'axe n'est pas imposé par la page. */
  protected readonly vueFacettes = computed<VueFacettes>(() => {
    const { categorie, type, secteur } = this.portee();
    const { reglables, animees } = this.facettes().options;
    const filtres = this.filtres();
    const tousTypes = this.#optionsTypes();
    const visibles = this.#optionsTypesVisibles();
    return {
      familles: categorie || type ? null : this.#optionsFamille(),
      types:
        type || filtres.categorie === 'design'
          ? null
          : {
              options: visibles,
              ouverts: this.typesOuverts(),
              repliables: tousTypes.length > TYPES_VISIBLES,
              caches: tousTypes.length - visibles.length,
            },
      secteurs: secteur ? null : this.#optionsSecteurs(),
      reglables: { coche: filtres.reglables, compte: reglables },
      animees: { coche: filtres.animees, compte: animees },
    };
  });

  /** Texte et action de l'état vide : aucune ressource dans la page, ou aucune qui passe les filtres. */
  protected readonly etatVide = computed(() => {
    const entrees = this.entrees();
    if (!entrees || this.resultats().length > 0) return undefined;
    const dansLaPage = filtrer(entrees, appliquerPortee(FILTRES_VIDES, this.portee()));
    if (dansLaPage.length > 0) {
      const decrit =
        this.filtres().q ||
        this.actifs()
          .map((a) => a.libelle)
          .join(', ');
      return {
        titre: this.textes.videTitre(decrit),
        texte: this.textes.videTexte,
        action: this.textes.filtresEffacer,
      };
    }
    return this.filtres().categorie === 'template'
      ? { titre: this.textes.templatesTitre, texte: this.textes.templatesTexte, action: undefined }
      : undefined;
  });

  /** Tiroir de filtres (sous 1024 px) : ouvert par le bouton « Filtres », modal tant qu'il est ouvert. */
  protected readonly tiroirOuvert = signal(false);
  protected readonly petitEcran = signal(false);
  protected readonly modal = computed(() => this.petitEcran() && this.tiroirOuvert());

  constructor() {
    afterNextRender(() => this.#surveillerPetitEcran());
    afterRenderEffect((nettoyer) => {
      if (!this.modal()) return;
      const racine = this.#document.documentElement;
      racine.style.overflow = 'hidden';
      nettoyer(() => racine.style.removeProperty('overflow'));
    });
    effect(() => {
      const chemin = this.#router.url.split(/[?#]/)[0];
      this.#indexation.definir(chemin, aDesParametres(this.filtres(), this.portee()));
    });
    this.#destroyRef.onDestroy(() => {
      clearTimeout(this.#minuteurSaisie);
      this.#indexation.retirer();
    });
  }

  #surveillerPetitEcran(): void {
    const media = this.#document.defaultView?.matchMedia?.(MEDIA_TIROIR);
    if (!media) return;
    this.petitEcran.set(media.matches);
    const surChangement = (evenement: MediaQueryListEvent): void => {
      this.petitEcran.set(evenement.matches);
      if (!evenement.matches) this.tiroirOuvert.set(false);
    };
    media.addEventListener('change', surChangement);
    this.#destroyRef.onDestroy(() => media.removeEventListener('change', surChangement));
  }

  #libelle(actif: FiltreActif): string {
    switch (actif.axe) {
      case 'categorie':
        return LIBELLES_CATEGORIE[actif.valeur].pluriel;
      case 'type':
        return LIBELLES_TYPE[actif.valeur];
      case 'secteur':
        return LIBELLES_SECTEUR[actif.valeur];
      case 'reglables':
        return this.textes.reglables;
      case 'animees':
        return this.textes.animees;
      case 'q':
        return `« ${this.filtres().q} »`;
    }
  }

  /** Remplace les paramètres de l'URL : sans nouvelle entrée d'historique, sans quitter la page. */
  protected async appliquer(filtres: FiltresCatalogue): Promise<void> {
    await this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: versParametres(filtres, this.portee()),
      replaceUrl: true,
      // Changer un filtre n'est pas changer de page : la page ne remonte pas (ADR 0005).
      scroll: 'manual',
    });
  }

  protected choisirCategorie(categorie: Categorie | null): Promise<void> {
    return this.appliquer(avecCategorie(this.filtres(), categorie));
  }

  protected basculerType(type: TypeRessource, coche: boolean): Promise<void> {
    return this.appliquer(avecType(this.filtres(), type, coche));
  }

  protected basculerSecteur(secteur: Secteur, coche: boolean): Promise<void> {
    return this.appliquer(avecSecteur(this.filtres(), secteur, coche));
  }

  protected basculerReglables(coche: boolean): Promise<void> {
    return this.appliquer({ ...this.filtres(), reglables: coche });
  }

  protected basculerAnimees(coche: boolean): Promise<void> {
    return this.appliquer({ ...this.filtres(), animees: coche });
  }

  protected changerTri(valeur: string): Promise<void> {
    return this.appliquer({ ...this.filtres(), tri: valeur === 'az' ? 'az' : 'recent' });
  }

  protected retirer(actif: FiltreActif): Promise<void> {
    return this.appliquer(sansFiltre(this.filtres(), actif));
  }

  protected toutEffacer(): Promise<void> {
    return this.appliquer(sansFiltres(this.filtres(), this.portee()));
  }

  /** Recherche : appliquée après une courte pause de frappe, pour ne pas filtrer à chaque touche. */
  protected saisir(champ: HTMLInputElement): void {
    clearTimeout(this.#minuteurSaisie);
    this.#minuteurSaisie = setTimeout(() => {
      void this.appliquer({ ...this.filtres(), q: champ.value.trim() });
    }, DELAI_SAISIE_MS);
  }

  protected basculerTypes(): void {
    this.typesOuverts.update((ouvert) => !ouvert);
  }

  /** Montre la page suivante et met le focus sur la première case ajoutée (le bouton peut disparaître). */
  protected afficherPlus(): void {
    const dejaVisibles = this.visibles();
    this.visibles.set(dejaVisibles + TAILLE_PAGE);
    afterNextRender(
      () => {
        const liens = this.#hote.nativeElement.querySelectorAll<HTMLElement>('.ngs-case__link');
        liens[dejaVisibles]?.focus();
      },
      { injector: this.#injector },
    );
  }

  protected ouvrirTiroir(): void {
    if (!this.petitEcran()) return;
    this.tiroirOuvert.set(true);
    afterNextRender(() => this.boutonFermer()?.nativeElement.focus(), { injector: this.#injector });
  }

  protected fermerTiroir(): void {
    if (!this.tiroirOuvert()) return;
    this.tiroirOuvert.set(false);
    this.boutonOuvrir()?.nativeElement.focus();
  }

  /** Échap ferme le tiroir ; Tab y reste piégé tant qu'il est modal. */
  protected gererClavier(evenement: KeyboardEvent): void {
    if (!this.modal()) return;
    if (evenement.key === 'Escape') {
      this.fermerTiroir();
      return;
    }
    if (evenement.key !== 'Tab') return;
    const tiroir = this.tiroir()?.nativeElement;
    if (!tiroir) return;
    const focusables = [...tiroir.querySelectorAll<HTMLElement>(FOCUSABLES)].filter(
      (el) => el.tagName === 'SUMMARY' || !el.closest('details:not([open])'),
    );
    const premier = focusables.at(0);
    const dernier = focusables.at(-1);
    const actif = this.#document.activeElement;
    if (evenement.shiftKey && actif === premier) {
      evenement.preventDefault();
      dernier?.focus();
    } else if (!evenement.shiftKey && actif === dernier) {
      evenement.preventDefault();
      premier?.focus();
    }
  }
}
