import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEXTES } from '@core/i18n/textes.fr';
import { RegistreService } from '@core/registre/registre.service';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { LigneCompteComponent } from './ligne-compte.component';
import { LienCompte, construireMenuCatalogue } from './menu-catalogue';

/** Délais de survol à la souris : ouverture un peu retardée, fermeture plus patiente (maquette). */
const DELAI_OUVERTURE_MS = 120;
const DELAI_FERMETURE_MS = 220;

/**
 * Méga-menu « Catalogue » du header (grands écrans) : un bouton à divulgation (`aria-expanded`) et son
 * panneau de liens (familles, types, secteurs, avec compteurs). Souris : s'ouvre au survol. Clavier :
 * Entrée, Espace ou flèche bas ouvrent et placent le focus sur le premier lien ; Échap ferme et rend le
 * focus au bouton ; Tab hors du menu le referme. Fermé, le panneau est `inert` mais reste dans le HTML
 * prérendu, ses liens aident le maillage interne.
 */
@Component({
  selector: 'app-mega-menu',
  imports: [RouterLink, IconeComponent, LigneCompteComponent],
  templateUrl: './mega-menu.component.html',
  host: {
    class: 'contents',
    '(document:click)': 'surClicDocument($event)',
    '(document:keydown.escape)': 'surEchap()',
    '(focusout)': 'surPerteDeFocus($event)',
  },
})
export class MegaMenuComponent {
  readonly #hote = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);

  protected readonly textes = TEXTES.mega;
  protected readonly nav = TEXTES.nav;
  protected readonly menu = construireMenuCatalogue(inject(RegistreService).compteurs);
  protected readonly colonnesTypes: readonly {
    readonly titre: string;
    readonly liens: readonly LienCompte[];
  }[] = [
    { titre: this.textes.typesComposants, liens: this.menu.composants },
    { titre: this.textes.typesBlocs, liens: this.menu.blocs },
  ];
  protected readonly ouvert = signal(false);

  private readonly declencheur = viewChild.required<ElementRef<HTMLButtonElement>>('declencheur');
  #minuteur: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.#minuteur));
  }

  protected basculer(evenement: MouseEvent): void {
    // detail vaut 0 pour un clic produit au clavier (Entrée, Espace) : le focus va alors dans le panneau.
    const auClavier = evenement.detail === 0;
    clearTimeout(this.#minuteur);
    if (this.ouvert()) {
      this.ouvert.set(false);
    } else {
      this.#ouvrir(auClavier);
    }
  }

  protected surFlecheBas(evenement: Event): void {
    evenement.preventDefault();
    clearTimeout(this.#minuteur);
    this.#ouvrir(true);
  }

  /** Survol à la souris seulement : un doigt ou un stylet passe par le clic. */
  protected surEntree(evenement: PointerEvent): void {
    if (evenement.pointerType !== 'mouse') return;
    clearTimeout(this.#minuteur);
    this.#minuteur = setTimeout(() => this.#ouvrir(false), DELAI_OUVERTURE_MS);
  }

  protected surSortie(evenement: PointerEvent): void {
    if (evenement.pointerType !== 'mouse') return;
    clearTimeout(this.#minuteur);
    this.#minuteur = setTimeout(() => this.ouvert.set(false), DELAI_FERMETURE_MS);
  }

  protected fermer(): void {
    clearTimeout(this.#minuteur);
    this.ouvert.set(false);
  }

  protected surEchap(): void {
    if (!this.ouvert()) return;
    this.fermer();
    this.declencheur().nativeElement.focus();
  }

  protected surClicDocument(evenement: Event): void {
    if (this.ouvert() && !this.#hote.nativeElement.contains(evenement.target as Node)) {
      this.fermer();
    }
  }

  /** Le focus quitte le menu (Tab ou Maj+Tab au-delà de ses bornes) : on le referme. */
  protected surPerteDeFocus(evenement: FocusEvent): void {
    const prochain = evenement.relatedTarget;
    if (this.ouvert() && prochain instanceof Node && !this.#hote.nativeElement.contains(prochain)) {
      this.fermer();
    }
  }

  #ouvrir(focaliserPremierLien: boolean): void {
    this.ouvert.set(true);
    if (focaliserPremierLien) {
      afterNextRender(
        () => this.#hote.nativeElement.querySelector<HTMLElement>('.ngs-mega a[href]')?.focus(),
        { injector: this.#injector },
      );
    }
  }
}
